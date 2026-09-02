import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { requirePermission, createAuditLog, AuthError } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  website: z.string().url().nullable().optional().or(z.literal("")),
  photoId: z.string().uuid().nullable().optional(),
  linkedUserId: z.string().uuid().nullable().optional(),
  socialLinks: z.any().optional(),
  twitter: z.string().max(100).nullable().optional(),
  linkedin: z.string().max(100).nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });

    const existing = await withDbRetry(() => db.author.findUnique({ where: { id } }));
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Author not found." } }, { status: 404 });

    if (existing.projectId) {
      await requirePermission(existing.projectId, "authors.update").catch(async () => {
        await requirePermission(existing.projectId!, "taxonomy.manage");
      });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
    if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
    if (parsed.data.website !== undefined) data.website = parsed.data.website || null;
    if (parsed.data.photoId !== undefined) {
      if (parsed.data.photoId) {
        const media = await withDbRetry(() => db.media.findUnique({ where: { id: parsed.data.photoId! } })).catch(() => null);
        if (!media) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Photo not found." } }, { status: 400 });
        if ((media as any).projectId && (media as any).projectId !== (existing as any).projectId) {
          return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Photo must belong to same project." } }, { status: 400 });
        }
      }
      data.photoId = parsed.data.photoId;
    }
    if (parsed.data.linkedUserId !== undefined) {
      if (parsed.data.linkedUserId) {
        if (!(existing as any).projectId) {
          return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Cannot link user without project." } }, { status: 400 });
        }
        const linkMember = await withDbRetry(() =>
          db.projectMember.findUnique({ where: { projectId_userId: { projectId: (existing as any).projectId, userId: parsed.data.linkedUserId! } } })
        ).catch(() => null);
        if (!linkMember) {
          return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Linked user must be a member of the same project." } }, { status: 400 });
        }
        const linkedProfile = await withDbRetry(() => db.profile.findUnique({ where: { id: parsed.data.linkedUserId! } })).catch(() => null);
        if (!linkedProfile || (linkedProfile as any).status !== "approved") {
          return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Linked user must be approved." } }, { status: 400 });
        }
      }
      (data as any).linkedUserId = parsed.data.linkedUserId;
    }
    if (parsed.data.socialLinks !== undefined) data.socialLinks = parsed.data.socialLinks;
    else if (parsed.data.twitter !== undefined || parsed.data.linkedin !== undefined) {
      const current = (existing.socialLinks as any) ?? {};
      const next: Record<string, string> = { ...current };
      if (parsed.data.twitter !== undefined) {
        if (parsed.data.twitter) next.twitter = parsed.data.twitter;
        else delete next.twitter;
      }
      if (parsed.data.linkedin !== undefined) {
        if (parsed.data.linkedin) next.linkedin = parsed.data.linkedin;
        else delete next.linkedin;
      }
      data.socialLinks = next;
    }
    if (parsed.data.slug !== undefined || parsed.data.name !== undefined) {
      const raw = parsed.data.slug ?? (parsed.data.name as string) ?? existing.slug;
      const slug = slugify(raw);
      if (!slug) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug." } }, { status: 400 });

      if (existing.projectId) {
        const dup = await withDbRetry(() =>
          db.author.findFirst({
            where: { slug, projectId: existing.projectId, id: { not: id } },
          })
        );
        if (dup) return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Author slug already exists in project." } }, { status: 409 });
      }
      data.slug = slug;
    }

    const updated = await withDbRetry(() =>
      db.author.update({
        where: { id },
        data: data as never,
      })
    );

    try {
      const { getCurrentUser } = await import("@/lib/auth");
      const actor = await getCurrentUser().catch(() => null);
      if (actor) {
        await createAuditLog({ actorId: actor.id, projectId: (existing as any).projectId || null, action: "author.updated", targetId: id, metadata: { fields: Object.keys(data) } });
        if (parsed.data.linkedUserId !== undefined) {
          await createAuditLog({ actorId: actor.id, projectId: (existing as any).projectId, action: "author.linked", targetId: id, metadata: { linkedUserId: parsed.data.linkedUserId } });
        }
      }
    } catch {}

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "UPDATE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to update author." } }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await withDbRetry(() => db.author.findUnique({ where: { id } }));
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Author not found." } }, { status: 404 });

    if (existing.projectId) {
      await requirePermission(existing.projectId, "authors.delete").catch(async () => {
        await requirePermission(existing.projectId!, "taxonomy.manage");
      });
    }

    const count = await withDbRetry(() => db.blogAuthor.count({ where: { authorId: id } })).catch(() => 0);
    if (count > 0) {
      // Fetch affected post titles for richer error
      let affected: string[] = [];
      try {
        const rows = await withDbRetry(() =>
          db.blogAuthor.findMany({ where: { authorId: id }, include: { blog: { select: { title: true } } }, take: 5 })
        );
        affected = (rows as any[]).map((r) => r.blog.title);
      } catch {}
      return NextResponse.json(
        { error: { code: "IN_USE", message: `Author in use by ${count} post(s).${affected.length ? " e.g. " + affected.join(", ") : ""}`, details: { count, examples: affected } } },
        { status: 409 }
      );
    }

    await withDbRetry(() => db.author.delete({ where: { id } }));
    try {
      const { getCurrentUser } = await import("@/lib/auth");
      const actor = await getCurrentUser().catch(() => null);
      if (actor) await createAuditLog({ actorId: actor.id, projectId: (existing as any).projectId || null, action: "author.deleted", targetId: id });
    } catch {}
    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "DELETE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to delete author." } }, { status });
  }
}
