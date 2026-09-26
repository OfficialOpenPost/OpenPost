import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requirePermission, createAuditLog, AuthError } from "@/lib/auth";
import { deleteObject } from "@/lib/storage";
import { queryCache } from "@/lib/cache";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApprovedUser();
    const { id } = await params;

    const media = await withDbRetry(() => db.media.findUnique({ where: { id } }));
    if (!media) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Media item not found." } }, { status: 404 });
    }

    if (media.projectId) {
      await requirePermission(media.projectId, "media.manage");
    }

    // Check usage across articles
    const usages = await withDbRetry(() =>
      db.mediaUsage.findMany({
        where: { mediaId: id },
        include: { blog: { select: { id: true, title: true } } },
      })
    ).catch(() => []);

    if (usages.length > 0) {
      const titles = usages.map((u: any) => u.blog?.title || u.blogId);
      return NextResponse.json(
        {
          error: {
            code: "IN_USE",
            message: `Media file is in use by ${usages.length} article(s). Remove it from those articles before deleting.`,
            details: { count: usages.length, titles },
          },
        },
        { status: 409 }
      );
    }

    // Delete from R2 storage if key is known
    let key = (media.variants as any)?.key;
    if (!key && (media.variants as any)?.publicUrl) {
      try {
        const parsed = new URL((media.variants as any).publicUrl);
        key = parsed.pathname.replace(/^\//, "");
      } catch {
        // Ignored
      }
    }

    // Delete DB row first — if R2 deletion then fails we get a harmless orphan
    // object, whereas the reverse order would leave DB rows pointing at
    // already-deleted files (broken images across articles).
    await withDbRetry(() => db.media.delete({ where: { id } }));

    if (key) {
      await deleteObject(key).catch((err) => {
        console.warn(`[media/delete] Failed to delete R2 object ${key}:`, err);
      });
    }

    await createAuditLog({
      actorId: user.id,
      projectId: media.projectId || undefined,
      action: "media.deleted",
      targetId: id,
      metadata: { filename: media.originalFilename },
    });

    queryCache.invalidate("dashboard:");

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "DELETE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to delete media item." } }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApprovedUser();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { altTextDefault } = body as { altTextDefault?: string };

    const media = await withDbRetry(() => db.media.findUnique({ where: { id } }));
    if (!media) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Media item not found." } }, { status: 404 });
    }

    if (media.projectId) {
      await requirePermission(media.projectId, "media.upload");
    }

    const updated = await withDbRetry(() =>
      db.media.update({
        where: { id },
        data: {
          altTextDefault: altTextDefault !== undefined ? altTextDefault : media.altTextDefault,
        },
      })
    );

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "UPDATE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to update media item." } }, { status });
  }
}
