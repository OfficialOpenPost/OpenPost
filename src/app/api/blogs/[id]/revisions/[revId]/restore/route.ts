import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, hasPermission, AuthError } from "@/lib/auth";
import { countWords, readingTime as calcReadingTime } from "@/lib/publish";

function countDocWords(doc: unknown): number {
  let count = 0;
  const walk = (n: unknown) => {
    if (!n) return;
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (typeof n !== "object") return;
    const node = n as { type?: unknown; text?: unknown; content?: unknown };
    if (node.type === "text" && typeof node.text === "string") {
      count += node.text.split(/\s+/).filter(Boolean).length;
    }
    if (node.content) walk(node.content);
  };
  walk(doc);
  return count;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; revId: string }> }) {
  try {
    const { id, revId } = await params;
    const user = await requireApprovedUser();

    const blog = await withDbRetry(() => db.blog.findUnique({ where: { id } }));
    if (!blog) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }

    // Tenant + permission check: same rules as PUT /api/blogs/[id]
    if (!blog.projectId) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }
    const membership = user.memberships.find((m) => m.projectId === blog.projectId);
    if (!membership) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }
    const role = membership.role;
    const canEditOthers = hasPermission(role, "posts.edit_others");
    if (!canEditOthers && blog.createdBy !== user.id) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }
    if (!hasPermission(role, "posts.edit_own") && !canEditOthers && !hasPermission(role, "post.edit")) {
      return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const rev = await withDbRetry(() =>
      db.blogRevision.findFirst({ where: { id: revId, blogId: id } })
    );
    if (!rev) {
      return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    }

    const content = rev.content as any;
    const wc =
      content && typeof content === "object"
        ? countDocWords(content)
        : countWords(typeof content === "string" ? content : JSON.stringify(content ?? ""));

    const updated = await withDbRetry(() =>
      db.blog.update({
        where: { id },
        data: {
          content,
          wordCount: wc,
          readingTime: calcReadingTime(wc),
          updatedAt: new Date(),
        },
      })
    );

    await withDbRetry(() =>
      db.blogRevision.create({
        data: {
          blogId: id,
          content,
          createdBy: user.id,
          label: "Restore",
          wordCount: wc,
        },
      })
    ).catch(() => {});

    return NextResponse.json({ data: updated });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.statusCode });
    }
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
