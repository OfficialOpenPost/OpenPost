import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    try { const user = await getCurrentUser().catch(()=>null); if (process.env.NODE_ENV === "production" && !user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }); if (user && ["WRITER","CONTRIBUTOR","author","contributor"].includes(user.role)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }); } catch {}

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    const existing = await db.tag.findUnique({ where: { id } as never });
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Tag not found" } }, { status: 404 });
    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.slug !== undefined || parsed.data.name !== undefined) {
      const raw = parsed.data.slug ?? (parsed.data.name as string) ?? (existing as any).slug;
      const slug = slugify(raw);
      if (!slug) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug" } }, { status: 400 });
      const dup = await db.tag.findFirst({ where: { slug, id: { not: id } } as never });
      if (dup) return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Slug already exists" } }, { status: 409 });
      data.slug = slug;
    }
    const updated = await db.tag.update({ where: { id } as never, data: data as never });
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
    const existing = await db.tag.findUnique({ where: { id } as never });
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Tag not found" } }, { status: 404 });
    // Check usage via BlogTag
    const usage = await (db as any).blogTag?.count?.({ where: { tagId: id } }).catch(() => 0) ?? 0;
    // Fallback raw query
    let count = usage;
    if (!count) {
      try { const r: any = await db.$queryRaw`SELECT COUNT(*)::int as c FROM blog_tags WHERE tag_id = ${id}::uuid`; count = r?.[0]?.c ?? 0; } catch {}
    }
    if (count > 0) {
      return NextResponse.json({ error: { code: "IN_USE", message: `Tag in use by ${count} post(s)`, details: { count } } }, { status: 409 });
    }
    await db.tag.delete({ where: { id } as never });
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
