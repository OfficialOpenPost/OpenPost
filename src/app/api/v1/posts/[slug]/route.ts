import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { resolveProjectContext } from "@/lib/apiToken";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Post slug required" } }, { status: 400 });
  }

  try {
    const projectContext = await resolveProjectContext(req);
    const cleanSlug = slug.trim();

    // 1. Check project-scoped 301 redirects first (e.g. if slug was renamed)
    const redirect = await withDbRetry(() =>
      db.redirect.findFirst({
        where: {
          oldSlug: cleanSlug,
          ...(projectContext?.projectId
            ? {
                blog: {
                  OR: [{ projectId: projectContext.projectId }, { projectId: null }],
                },
              }
            : {}),
        },
        select: { newSlug: true },
      })
    ).catch(() => null);

    if (redirect) {
      return NextResponse.json(
        { data: null, redirect: redirect.newSlug },
        {
          status: 301,
          headers: {
            Location: `/api/v1/posts/${redirect.newSlug}`,
            "Cache-Control": "public, max-age=86400",
          },
        }
      );
    }

    // 2. Query published post
    const postWhere: any = {
      slug: cleanSlug,
      status: "published",
    };

    if (projectContext?.projectId) {
      postWhere.OR = [
        { projectId: projectContext.projectId },
        { projectId: null },
      ];
    }

    const post = await withDbRetry(() =>
      db.blog.findFirst({
        where: postWhere,
        include: {
          category: {
            select: { id: true, name: true, slug: true, description: true },
          },
          authors: {
            select: {
              sortOrder: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  bio: true,
                  photoId: true,
                  socialLinks: true,
                  website: true,
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
          tags: {
            select: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
          featuredImage: {
            select: { id: true, variants: true, altTextDefault: true, originalFilename: true },
          },
          polls: {
            where: { status: { in: ["open", "closed"] } },
            include: {
              options: {
                orderBy: { sortOrder: "asc" },
                select: { id: true, label: true, sortOrder: true, _count: { select: { votes: true } } },
              },
              _count: { select: { votes: true } },
            },
          },
        },
      })
    );

    if (!post) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Article not found within project." } },
        { status: 404 }
      );
    }

    const coverUrl =
      (post.featuredImage?.variants as any)?.publicUrl ||
      (post.seo as any)?.ogImage ||
      (post.seo as any)?.image ||
      null;

    const formattedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      status: post.status,
      publishedAt: post.publishedAt,
      readingTime: post.readingTime,
      wordCount: post.wordCount,
      coverImage: coverUrl,
      category: post.category,
      authors: post.authors.map((a: any) => a.author),
      tags: post.tags.map((t: any) => t.tag),
      polls: post.polls.map((p: any) => ({
        id: p.id,
        question: p.question,
        type: p.type,
        status: p.status,
        totalVotes: p._count.votes,
        options: p.options.map((o: any) => ({
          id: o.id,
          label: o.label,
          votes: o._count.votes,
        })),
      })),
      seo: post.seo,
      projectId: post.projectId,
    };

    return NextResponse.json(
      { data: formattedPost },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "CDN-Cache-Control": "public, s-maxage=300",
          ETag: `"${post.id}-${new Date(post.updatedAt).getTime()}"`,
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/v1/posts/[slug] error:", error);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to load post." } },
      { status: 500 }
    );
  }
}
