import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, hasPermission, createAuditLog, AuthError } from "@/lib/auth";
import { triggerWebhooks } from "@/lib/webhooks";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApprovedUser();

    const blog = await withDbRetry(() => db.blog.findUnique({ where: { id } }));
    // Fail closed: a post with no project cannot be safely authorised.
    if (!blog || !blog.projectId) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Article not found" } }, { status: 404 });
    }

    const { role } = await requireProjectMember(blog.projectId);

    const body = await req.json().catch(() => ({}));
    const { revisionId } = body as { revisionId?: string };

    // Same ownership rules as PUT /api/blogs/[id]: own posts need edit_own,
    // foreign posts need edit_others.
    const isOwn = blog.createdBy === user.id;
    const canEdit =
      hasPermission(role, "posts.edit_others") ||
      (isOwn && hasPermission(role, "posts.edit_own")) ||
      hasPermission(role, "post.edit");
    if (!canEdit) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Insufficient permissions to restore this article." } }, { status: 403 });
    }

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

    // Case 2: Restore from trash to draft — permission already verified above.
    const updated = await withDbRetry(() =>
      db.blog.update({
        where: { id },
        data: { status: "draft" },
      })
    );

    await createAuditLog({
      actorId: user.id,
      projectId: blog.projectId,
      action: "post.untrashed",
      targetId: id,
    });

    triggerWebhooks({
      projectId: blog.projectId,
      event: "post.untrashed",
      payload: { id: blog.id, title: blog.title, slug: blog.slug },
    }).catch(() => {});

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "RESTORE_FAILED";
    return NextResponse.json({ error: { code, message: status < 500 ? error.message : "Failed to restore article." } }, { status });
  }
}
