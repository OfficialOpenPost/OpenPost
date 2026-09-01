import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { resolveProjectContext } from "@/lib/apiToken";

// Public, versioned, read-only, cache-friendly — only published content scoped strictly to authorized project
export async function GET(req: NextRequest) {
  try {
    const projectContext = await resolveProjectContext(req);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const categorySlug = searchParams.get("category");
    const tagSlug = searchParams.get("tag");
    const authorSlug = searchParams.get("author");
    const cursor = searchParams.get("cursor");

    const where: any = {
      status: "published",
    };

    if (projectContext?.projectId) {
      where.OR = [
        { projectId: projectContext.projectId },
        { projectId: null },
      ];
    }

    if (categorySlug) {
      where.category = {
        slug: categorySlug.trim(),
        ...(projectContext?.projectId ? { projectId: projectContext.projectId } : {}),
      };
    }

    if (tagSlug) {
      where.tags = {
        some: {
          tag: {
            slug: tagSlug.trim(),
            ...(projectContext?.projectId ? { projectId: projectContext.projectId } : {}),
          },
        },
      };
    }

    if (authorSlug) {
      where.authors = {
        some: {
          author: {
            slug: authorSlug.trim(),
            ...(projectContext?.projectId ? { projectId: projectContext.projectId } : {}),
          },
        },
      };
    }

    const blogs = await withDbRetry(() =>
      db.blog.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
          readingTime: true,
          wordCount: true,
          seo: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          authors: {
            select: {
              author: { select: { id: true, name: true, slug: true, photoId: true } },
            },
          },
          tags: {
            select: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
          featuredImage: {
            select: { id: true, variants: true, altTextDefault: true, originalFilename: true },
          },
        },
      })
    );

    const hasMore = blogs.length > limit;
    const rawData = hasMore ? blogs.slice(0, -1) : blogs;
    const nextCursor = hasMore && rawData.length > 0 ? rawData[rawData.length - 1].id : null;

    const data = rawData.map((b: any) => {
      const coverUrl =
        (b.featuredImage?.variants as any)?.publicUrl ||
        (b.seo as any)?.ogImage ||
        (b.seo as any)?.image ||
        null;

      return {
        id: b.id,
        title: b.title,
        slug: b.slug,
        status: b.status,
        publishedAt: b.publishedAt,
        readingTime: b.readingTime,
        wordCount: b.wordCount,
        category: b.category,
        authors: (b.authors || []).map((a: any) => a.author),
        tags: (b.tags || []).map((t: any) => t.tag),
        coverImage: coverUrl,
        seo: b.seo,
      };
    });

    return NextResponse.json(
      { data, meta: { cursor: nextCursor, hasMore, total: data.length, projectId: projectContext?.projectId ?? null } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "CDN-Cache-Control": "public, s-maxage=300",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/v1/posts error:", error);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch posts." } },
      { status: 500 }
    );
  }
}
