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
    // Strict tenant isolation: without a resolved project there is nothing this
    // caller is allowed to search — never fall back to a global query.
    if (!context?.projectId) {
      return NextResponse.json(
        { data: [], meta: { query: query.trim(), total: 0, warning: "Missing project identification" } },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const where: any = {
      status: "published",
      projectId: context.projectId,
      OR: [
        { title: { contains: query.trim(), mode: "insensitive" } },
        { slug: { contains: query.trim(), mode: "insensitive" } },
      ],
    };

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
          // SECURITY: never expose author emails on the public API.
          author: {
            select: { id: true, name: true },
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
