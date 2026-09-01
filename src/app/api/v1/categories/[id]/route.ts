import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";

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
    try { const user = await getCurrentUser().catch(()=>null); if (process.env.NODE_ENV === "production" && !user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }); if (user && ["WRITER","CONTRIBUTOR","author","contributor"].includes(user.role)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }); } catch {}

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });

    const existing = await db.category.findUnique({ where: { id } as never });
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Category not found" } }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.slug !== undefined || parsed.data.name !== undefined) {
      const raw = parsed.data.slug ?? (parsed.data.name as string) ?? (existing as any).slug;
      const slug = slugify(raw);
      if (!slug) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug" } }, { status: 400 });
      const dup = await db.category.findFirst({ where: { slug, id: { not: id } } as never });
      if (dup) return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Slug already exists" } }, { status: 409 });
      data.slug = slug;
    }
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.parentId !== undefined) {
      const parentId = parsed.data.parentId;
      if (parentId) {
        if (parentId === id) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Category cannot be its own parent" } }, { status: 400 });
        const parent = await db.category.findUnique({ where: { id: parentId } as never });
        if (!parent) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Parent not found" } }, { status: 404 });
        if ((parent as any).parentId) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Only top-level categories can be parents" } }, { status: 400 });
      }
      data.parentId = parentId;
    }
    if (parsed.data.seo !== undefined) data.seo = parsed.data.seo;
    else if (parsed.data.seoTitle !== undefined || parsed.data.seoDesc !== undefined) {
      const currentSeo = (existing as any).seo ?? {};
      data.seo = { ...currentSeo, ...(parsed.data.seoTitle !== undefined ? { title: parsed.data.seoTitle } : {}), ...(parsed.data.seoDesc !== undefined ? { description: parsed.data.seoDesc } : {}) };
    }

    const updated = await db.category.update({ where: { id } as never, data: data as never });
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    try { const user = await getCurrentUser().catch(()=>null); if (process.env.NODE_ENV === "production" && !user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }); if (user && ["WRITER","CONTRIBUTOR","author","contributor"].includes(user.role)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }); } catch {}

    const { id } = await params;
    const existing = await db.category.findUnique({ where: { id } as never });
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Category not found" } }, { status: 404 });

    // Safe-delete: check usage
    const usage = await db.blog.count({ where: { categoryId: id } as never }).catch(() => 0);
    if (usage > 0) {
      return NextResponse.json({ error: { code: "IN_USE", message: `Category in use by ${usage} post(s)`, details: { count: usage } } }, { status: 409 });
    }
    await db.category.delete({ where: { id } as never });
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
