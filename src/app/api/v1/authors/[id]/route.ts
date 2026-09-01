import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";

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
    try { const user = await getCurrentUser().catch(()=>null); if (process.env.NODE_ENV === "production" && !user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }); if (user && ["WRITER","CONTRIBUTOR","author","contributor"].includes(user.role)) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }); } catch {}

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    const existing = await db.author.findUnique({ where: { id } as never });
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Author not found" } }, { status: 404 });
    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
    if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
    if (parsed.data.website !== undefined) data.website = parsed.data.website || null;
    if (parsed.data.photoId !== undefined) data.photoId = parsed.data.photoId;
    if (parsed.data.socialLinks !== undefined) data.socialLinks = parsed.data.socialLinks;
    else if (parsed.data.twitter !== undefined || parsed.data.linkedin !== undefined) {
      const current = (existing as any).socialLinks ?? {};
      const next: Record<string, string> = { ...current };
      if (parsed.data.twitter !== undefined) { if (parsed.data.twitter) next.twitter = parsed.data.twitter; else delete next.twitter; }
      if (parsed.data.linkedin !== undefined) { if (parsed.data.linkedin) next.linkedin = parsed.data.linkedin; else delete next.linkedin; }
      data.socialLinks = next;
    }
    if (parsed.data.slug !== undefined || parsed.data.name !== undefined) {
      const raw = parsed.data.slug ?? (parsed.data.name as string) ?? (existing as any).slug;
      const slug = slugify(raw);
      if (!slug) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug" } }, { status: 400 });
      const dup = await db.author.findFirst({ where: { slug, id: { not: id } } as never });
      if (dup) return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Slug already exists" } }, { status: 409 });
      data.slug = slug;
    }
    const updated = await db.author.update({ where: { id } as never, data: data as never });
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
    const existing = await db.author.findUnique({ where: { id } as never });
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Author not found" } }, { status: 404 });
    let count = 0;
    try { const r: any = await db.$queryRaw`SELECT COUNT(*)::int as c FROM blog_authors WHERE author_id = ${id}::uuid`; count = r?.[0]?.c ?? 0; } catch {}
    if (count > 0) {
      return NextResponse.json({ error: { code: "IN_USE", message: `Author in use by ${count} post(s)`, details: { count } } }, { status: 409 });
    }
    await db.author.delete({ where: { id } as never });
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
