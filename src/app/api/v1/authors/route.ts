import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  website: z.string().url().nullable().optional().or(z.literal("")),
  photoId: z.string().uuid().nullable().optional(),
  socialLinks: z.any().optional(),
  twitter: z.string().max(100).nullable().optional(),
  linkedin: z.string().max(100).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const where: Record<string, unknown> = {};
    if (search) {
      (where as any).OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    const data = await db.author.findMany({
      where: where as never,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, bio: true, email: true, website: true, socialLinks: true, photoId: true },
    });
    const normalized = data.map((a: any) => ({
      ...a,
      social: a.socialLinks ?? {},
      postCount: 0,
    }));
    return NextResponse.json({ data: normalized, meta: { hasMore: false } }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ data: [], meta: { hasMore: false } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    }
    const { name, slug: rawSlug, bio, email, website, photoId, socialLinks, twitter, linkedin } = parsed.data;
    const slug = slugify(rawSlug || name);
    if (!slug) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug" } }, { status: 400 });
    const existing = await db.author.findFirst({ where: { slug } as never });
    if (existing) return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Slug already exists", details: { slug } } }, { status: 409 });
    const links = socialLinks ?? { ...(twitter ? { twitter } : {}), ...(linkedin ? { linkedin } : {}) };
    const created = await db.author.create({
      data: {
        name,
        slug,
        bio: bio ?? null,
        email: email || null,
        website: website || null,
        socialLinks: links,
        photoId: photoId ?? null,
      } as never,
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
