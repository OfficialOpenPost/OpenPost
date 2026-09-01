import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, AuthError } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireApprovedUser();

    const blog = await withDbRetry(() => db.blog.findUnique({ where: { id }, select: { projectId: true } }));
    if (!blog) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Post not found" } }, { status: 404 });
    }

    if (blog.projectId && typeof blog.projectId === "string") {
      await requireProjectMember(blog.projectId, "WRITER");
    }

    const revisions = await withDbRetry(() =>
      db.blogRevision.findMany({
        where: { blogId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          blogId: true,
          label: true,
          createdAt: true,
          createdBy: true,
          content: true,
        },
      })
    );

    return NextResponse.json({ data: revisions });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "FETCH_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to load revisions." } }, { status });
  }
}
