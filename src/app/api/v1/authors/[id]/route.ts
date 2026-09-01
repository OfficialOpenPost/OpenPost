import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { requirePermission, AuthError } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  website: z.string().url().nullable().optional().or(z.literal("")),
  photoId: z.string().uuid().nullable().optional(),
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
      await requirePermission(existing.projectId, "taxonomy.manage");
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
    if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
    if (parsed.data.website !== undefined) data.website = parsed.data.website || null;
    if (parsed.data.photoId !== undefined) data.photoId = parsed.data.photoId;
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
      await requirePermission(existing.projectId, "taxonomy.manage");
    }

    const count = await withDbRetry(() => db.blogAuthor.count({ where: { authorId: id } })).catch(() => 0);
    if (count > 0) {
      return NextResponse.json(
        { error: { code: "IN_USE", message: `Author in use by ${count} post(s).` } },
        { status: 409 }
      );
    }

    await withDbRetry(() => db.author.delete({ where: { id } }));
    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "DELETE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to delete author." } }, { status });
  }
}
