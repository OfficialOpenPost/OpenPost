import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, AuthError } from "@/lib/auth";

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

    const [
      publishedCount,
      draftsCount,
      scheduledCount,
      trashCount,
      categoriesCount,
      tagsCount,
      authorsCount,
      mediaCount,
      webhooksCount,
      aggregates,
      recentBlogs,
    ] = await withDbRetry(() =>
      Promise.all([
        db.blog.count({ where: { ...projectWhere, status: "published" } }),
        db.blog.count({ where: { ...projectWhere, status: "draft" } }),
        db.blog.count({ where: { ...projectWhere, status: "scheduled" } }),
        db.blog.count({ where: { ...projectWhere, status: "trash" } }),
        db.category.count({ where: projectWhere }),
        db.tag.count({ where: projectWhere }),
        db.author.count({ where: projectWhere }),
        db.media.count({ where: projectWhere }),
        db.webhook.count({ where: projectWhere }),
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

    const totalWords = aggregates._sum.wordCount || 0;
    const avgReadingTime = Math.round(aggregates._avg.readingTime || 0);

    return NextResponse.json({
      data: {
        projectId: targetProjectId,
        userRole,
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
