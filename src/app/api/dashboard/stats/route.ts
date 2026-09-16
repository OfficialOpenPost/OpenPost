import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, AuthError } from "@/lib/auth";
import { queryCache } from "@/lib/cache";

export async function GET(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || req.headers.get("x-openpost-project");

    let targetProjectId = projectId;
    let userRole = user.role;

    if (!targetProjectId) {
      const firstMembership = user.memberships[0];
      if (firstMembership) {
        targetProjectId = firstMembership.projectId;
        userRole = firstMembership.role;
      }
    } else {
      const { role } = await requireProjectMember(targetProjectId);
      userRole = role;
    }

    const projectWhere = targetProjectId ? { projectId: targetProjectId } : {};
    const cacheKey = `dashboard:${targetProjectId || "all"}`;

    const result = await queryCache.getOrSet(cacheKey, 15_000, async () => {
      // 1. Group blogs by status in a SINGLE query instead of 4 separate queries
      const [statusGroups, counts, aggregates, recentBlogs] = await withDbRetry(() =>
        Promise.all([
          db.blog.groupBy({
            by: ["status"],
            where: projectWhere,
            _count: { _all: true },
          }),
          Promise.all([
            db.category.count({ where: projectWhere }),
            db.tag.count({ where: projectWhere }),
            db.author.count({ where: projectWhere }),
            db.media.count({ where: projectWhere }),
            db.webhook.count({ where: projectWhere }),
          ]),
          db.blog.aggregate({
            where: projectWhere,
            _sum: { wordCount: true },
            _avg: { readingTime: true },
          }),
          db.blog.findMany({
            where: projectWhere,
            take: 6,
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              updatedAt: true,
              createdAt: true,
              publishedAt: true,
              scheduledAt: true,
              wordCount: true,
              readingTime: true,
              seo: true,
              category: { select: { id: true, name: true, slug: true } },
              author: { select: { name: true, email: true } },
              featuredImage: { select: { id: true, variants: true } },
            },
          }),
        ])
      );

      let publishedCount = 0;
      let draftsCount = 0;
      let scheduledCount = 0;
      let trashCount = 0;

      for (const group of statusGroups) {
        if (group.status === "published") publishedCount = group._count._all;
        else if (group.status === "draft") draftsCount = group._count._all;
        else if (group.status === "scheduled") scheduledCount = group._count._all;
        else if (group.status === "trash") trashCount = group._count._all;
      }

      const [categoriesCount, tagsCount, authorsCount, mediaCount, webhooksCount] = counts;
      const totalWords = aggregates._sum.wordCount || 0;
      const avgReadingTime = Math.round(aggregates._avg.readingTime || 0);

      return {
        stats: {
          published: publishedCount,
          drafts: draftsCount,
          scheduled: scheduledCount,
          trash: trashCount,
          totalArticles: publishedCount + draftsCount + scheduledCount + trashCount,
          categories: categoriesCount,
          tags: tagsCount,
          authors: authorsCount,
          media: mediaCount,
          webhooks: webhooksCount,
          totalWords,
          avgReadingTime,
        },
        recentBlogs,
      };
    });

    return NextResponse.json({
      data: {
        projectId: targetProjectId,
        userRole,
        ...result,
      },
    });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "STATS_FETCH_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to load dashboard statistics." } },
      { status }
    );
  }
}
