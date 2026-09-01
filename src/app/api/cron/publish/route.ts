import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { triggerWebhooks } from "@/lib/webhooks";

export async function GET(req: NextRequest) {
  try {
    // Verify CRON_SECRET if configured in production
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      const urlSecret = new URL(req.url).searchParams.get("secret");
      const bearerSecret = authHeader?.replace(/^Bearer\s+/i, "");

      if (bearerSecret !== cronSecret && urlSecret !== cronSecret) {
        return NextResponse.json(
          { error: { code: "UNAUTHORIZED", message: "Invalid or missing CRON_SECRET authorization." } },
          { status: 401 }
        );
      }
    }

    const now = new Date();
    const duePosts = await withDbRetry(() =>
      db.blog.findMany({
        where: {
          status: "scheduled",
          scheduledAt: { lte: now },
        },
      })
    );

    let publishedCount = 0;
    for (const post of duePosts) {
      await withDbRetry(() =>
        db.blog.update({
          where: { id: post.id },
          data: {
            status: "published",
            publishedAt: now,
          },
        })
      );

      // Trigger Webhooks on publish
      triggerWebhooks({
        projectId: post.projectId,
        event: "post.published",
        payload: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          publishedAt: now,
        },
      }).catch(() => {});

      publishedCount++;
    }

    return NextResponse.json({
      data: {
        checked: duePosts.length,
        published: publishedCount,
        timestamp: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("CRON publish error:", error);
    return NextResponse.json(
      { error: { code: "CRON_FAILED", message: String(error?.message ?? error) } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
