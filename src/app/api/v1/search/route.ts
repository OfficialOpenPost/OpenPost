import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { resolveProjectContext } from "@/lib/apiToken";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 10), 1), 50);

    if (!query.trim()) {
      return NextResponse.json({ data: [] });
    }

    const context = await resolveProjectContext(req);
    const where: any = {
      status: "published",
      OR: [
        { title: { contains: query.trim(), mode: "insensitive" } },
        { slug: { contains: query.trim(), mode: "insensitive" } },
      ],
    };

    if (context?.projectId) {
      where.projectId = context.projectId;
    }

    const posts = await withDbRetry(() =>
      db.blog.findMany({
        where,
        take: limit,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          wordCount: true,
          readingTime: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          author: {
            select: { id: true, name: true, email: true },
          },
          featuredImage: {
            select: { id: true, variants: true, altTextDefault: true },
          },
        },
      })
    );

    return NextResponse.json({
      data: posts,
      meta: {
        query: query.trim(),
        total: posts.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/search error:", error);
    return NextResponse.json(
      { error: { code: "SEARCH_FAILED", message: "Failed to perform search." } },
      { status: 500 }
    );
  }
}
