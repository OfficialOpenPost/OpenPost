import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { requirePermission, AuthError } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    }

    const existing = await withDbRetry(() => db.tag.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Tag not found." } }, { status: 404 });
    }

    if (existing.projectId) {
      await requirePermission(existing.projectId, "taxonomy.manage");
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.slug !== undefined || parsed.data.name !== undefined) {
      const raw = parsed.data.slug ?? (parsed.data.name as string) ?? existing.slug;
      const slug = slugify(raw);
      if (!slug) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug." } }, { status: 400 });

      if (existing.projectId) {
        const dup = await withDbRetry(() =>
          db.tag.findFirst({
            where: { slug, projectId: existing.projectId, id: { not: id } },
          })
        );
        if (dup) return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Tag slug already exists in project." } }, { status: 409 });
      }
      data.slug = slug;
    }

    const updated = await withDbRetry(() =>
      db.tag.update({
        where: { id },
        data: data as never,
      })
    );

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "UPDATE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to update tag." } }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await withDbRetry(() => db.tag.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Tag not found." } }, { status: 404 });
    }

    if (existing.projectId) {
      await requirePermission(existing.projectId, "taxonomy.manage");
    }

    const usage = await withDbRetry(() => db.blogTag.count({ where: { tagId: id } })).catch(() => 0);
    if (usage > 0) {
      return NextResponse.json(
        { error: { code: "IN_USE", message: `Tag in use by ${usage} post(s).` } },
        { status: 409 }
      );
    }

    await withDbRetry(() => db.tag.delete({ where: { id } }));
    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "DELETE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to delete tag." } }, { status });
  }
}
