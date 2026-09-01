import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
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
    const data = await db.tag.findMany({
      where: where as never,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true },
    });
    return NextResponse.json({ data, meta: { hasMore: false } }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
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
    const { name, slug: rawSlug, description } = parsed.data;
    const slug = slugify(rawSlug || name);
    if (!slug) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug" } }, { status: 400 });
    const existing = await db.tag.findFirst({ where: { slug } as never });
    if (existing) return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Slug already exists", details: { slug } } }, { status: 409 });
    const created = await db.tag.create({ data: { name, slug, description: description ?? null } as never });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
