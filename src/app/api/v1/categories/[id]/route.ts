import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { requirePermission, AuthError } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  seoTitle: z.string().max(60).nullable().optional(),
  seoDesc: z.string().max(160).nullable().optional(),
  seo: z.any().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    }

    const existing = await withDbRetry(() => db.category.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Category not found." } }, { status: 404 });
    }

    if (existing.projectId) {
      await requirePermission(existing.projectId, "taxonomy.manage");
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.slug !== undefined || parsed.data.name !== undefined) {
      const raw = parsed.data.slug ?? (parsed.data.name as string) ?? existing.slug;
      const slug = slugify(raw);
      if (!slug) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug." } }, { status: 400 });

      if (existing.projectId) {
        const dup = await withDbRetry(() =>
          db.category.findFirst({
            where: { slug, projectId: existing.projectId, id: { not: id } },
          })
        );
        if (dup) return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Category slug already exists in project." } }, { status: 409 });
      }
      data.slug = slug;
    }

    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.parentId !== undefined) {
      const parentId = parsed.data.parentId;
      if (parentId) {
        if (parentId === id) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Category cannot be its own parent." } }, { status: 400 });
        const parent = await withDbRetry(() => db.category.findUnique({ where: { id: parentId } }));
        if (!parent) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Parent category not found." } }, { status: 404 });
        if (parent.parentId) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Only top-level categories can be parents." } }, { status: 400 });
      }
      data.parentId = parentId;
    }

    if (parsed.data.seo !== undefined) data.seo = parsed.data.seo;
    else if (parsed.data.seoTitle !== undefined || parsed.data.seoDesc !== undefined) {
      const currentSeo = (existing.seo as any) ?? {};
      data.seo = {
        ...currentSeo,
        ...(parsed.data.seoTitle !== undefined ? { title: parsed.data.seoTitle } : {}),
        ...(parsed.data.seoDesc !== undefined ? { description: parsed.data.seoDesc } : {}),
      };
    }

    const updated = await withDbRetry(() =>
      db.category.update({
        where: { id },
        data: data as never,
      })
    );

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "UPDATE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to update category." } }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await withDbRetry(() => db.category.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Category not found." } }, { status: 404 });
    }

    if (existing.projectId) {
      await requirePermission(existing.projectId, "taxonomy.manage");
    }

    // Check usage
    const usage = await withDbRetry(() => db.blog.count({ where: { categoryId: id } })).catch(() => 0);
    if (usage > 0) {
      return NextResponse.json(
        { error: { code: "IN_USE", message: `Category in use by ${usage} post(s).` } },
        { status: 409 }
      );
    }

    await withDbRetry(() => db.category.delete({ where: { id } }));
    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "DELETE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to delete category." } }, { status });
  }
}
