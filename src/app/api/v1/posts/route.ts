import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public, versioned, read-only, cache-friendly — only published content (Supabase RLS also enforces)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const category = searchParams.get("category");
  const cursor = searchParams.get("cursor");

  try {
    const where: Record<string, unknown> = { status: "published" };
    if (category) where.categoryId = category;

    const blogs = await db.blog.findMany({
      where: where as never,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, status: true, publishedAt: true, readingTime: true, categoryId: true },
    });

    const hasMore = blogs.length > limit;
    const data = hasMore ? blogs.slice(0, -1) : blogs;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json(
      { data, meta: { cursor: nextCursor, hasMore, total: data.length } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "CDN-Cache-Control": "public, s-maxage=300",
        },
      }
    );
  } catch {
    // Fallback for build without DB (open-source forks)
    return NextResponse.json({ data: [], meta: { cursor: null, hasMore: false, total: 0 } }, { headers: { "Cache-Control": "public, s-maxage=60" } });
  }
}
