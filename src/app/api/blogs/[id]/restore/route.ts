import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, requirePermission, createAuditLog, AuthError } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApprovedUser();

    const blog = await withDbRetry(() => db.blog.findUnique({ where: { id } }));
    if (!blog) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Article not found" } }, { status: 404 });
    }

    if (blog.projectId) {
      await requireProjectMember(blog.projectId, "CONTRIBUTOR");
    }

    const body = await req.json().catch(() => ({}));
    const { revisionId } = body as { revisionId?: string };

    // Case 1: Restore a specific revision snapshot
    if (revisionId) {
      const revision = await withDbRetry(() =>
        db.blogRevision.findFirst({
          where: { id: revisionId, blogId: id },
        })
      );

      if (!revision) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Revision snapshot not found" } },
          { status: 404 }
        );
      }

      // Restore content from revision
      const updated = await withDbRetry(() =>
        db.blog.update({
          where: { id },
          data: {
            content: revision.content as any,
            updatedAt: new Date(),
          },
        })
      );

      // Add revision audit marker
      await withDbRetry(() =>
        db.blogRevision.create({
          data: {
            blogId: id,
            content: revision.content as any,
            createdBy: user.id,
            label: `Restored to revision from ${new Date(revision.createdAt).toLocaleString()}`,
          },
        })
      ).catch(() => {});

      await createAuditLog({
        actorId: user.id,
        projectId: blog.projectId || undefined,
        action: "post.revision_restored",
        targetId: id,
        metadata: { revisionId },
      });

      return NextResponse.json({ data: updated });
    }

    // Case 2: Restore from trash to draft
    if (blog.projectId) {
      await requirePermission(blog.projectId, "post.edit");
    }

    const updated = await withDbRetry(() =>
      db.blog.update({
        where: { id },
        data: { status: "draft" },
      })
    );

    await createAuditLog({
      actorId: user.id,
      projectId: blog.projectId || undefined,
      action: "post.untrashed",
      targetId: id,
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "RESTORE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to restore article." } }, { status });
  }
}
