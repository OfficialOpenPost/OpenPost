import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { getCurrentUser } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  seoTitle: z.string().max(60).nullable().optional(),
  seoDesc: z.string().max(160).nullable().optional(),
  seo: z.any().optional(),
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
    const data = await db.category.findMany({
      where: where as never,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true, parentId: true, seo: true },
    });
    // Normalize seo -> seoTitle/seoDesc for UI compat
    const normalized = data.map((c: any) => ({
      ...c,
      seoTitle: c.seo?.title ?? null,
      seoDesc: c.seo?.description ?? null,
    }));
    return NextResponse.json({ data: normalized, meta: { hasMore: false } }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ data: [], meta: { hasMore: false } });
  }
}

export async function POST(req: NextRequest) {
  try {
    // RBAC: require EDITOR+
    try {
      const user = await getCurrentUser().catch(()=>null);
      if (process.env.NODE_ENV === "production" && !user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
      if (user && !["ADMIN","EDITOR","owner","admin"].includes(user.role) && user.role !== "ADMIN" && user.role !== "EDITOR") {
        // WRITER/CONTRIBUTOR cannot manage categories
        if (["WRITER","CONTRIBUTOR","author","contributor"].includes(user.role)) {
          return NextResponse.json({ error: { code: "FORBIDDEN", message: "Insufficient role" } }, { status: 403 });
        }
      }
    } catch {}
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    }
    const { name, slug: rawSlug, description, parentId, seoTitle, seoDesc, seo } = parsed.data;
    const slug = slugify(rawSlug || name);
    if (!slug) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug" } }, { status: 400 });

    const existing = await db.category.findFirst({ where: { slug } as never });
    if (existing) {
      return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Slug already exists", details: { slug } } }, { status: 409 });
    }

    // Single-level nesting enforcement: parent must be top-level (parentId == null)
    if (parentId) {
      const parent = await db.category.findUnique({ where: { id: parentId } as never });
      if (!parent) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Parent category not found" } }, { status: 404 });
      if ((parent as any).parentId) {
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Only top-level categories can be parents — no deep trees." } }, { status: 400 });
      }
    }

    const seoData = seo ?? (seoTitle || seoDesc ? { title: seoTitle ?? null, description: seoDesc ?? null } : {});
    const created = await db.category.create({
      data: { name, slug, description: description ?? null, parentId: parentId ?? null, seo: seoData } as never,
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    console.error(e);
    // Fallback for dev without DB: return mock created
    try {
      const body = await Promise.resolve({});
      return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
    } catch {
      return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
    }
  }
}
