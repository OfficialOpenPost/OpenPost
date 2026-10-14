import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { triggerWebhooks } from "@/lib/webhooks";
import { verifyCronAuth } from "@/lib/cronAuth";

export async function GET(req: NextRequest) {
  try {
    const authErr = verifyCronAuth(req);
    if (authErr) return authErr;

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
      // Atomic publish: only transition if still scheduled and due (prevents double publish race)
      const result = await withDbRetry(() =>
        db.blog.updateMany({
          where: { id: post.id, status: "scheduled", scheduledAt: { lte: now } },
          data: { status: "published", publishedAt: now },
        })
      ).catch(() => ({ count: 0 } as any));

      const wasPublished = (result as any).count > 0;
      if (!wasPublished) continue;

      triggerWebhooks({
        projectId: post.projectId,
        event: "post.published",
        payload: { id: post.id, title: post.title, slug: post.slug, publishedAt: now },
      }).catch(() => {});

      publishedCount++;
    }

    return NextResponse.json({
      data: { checked: duePosts.length, published: publishedCount, timestamp: now.toISOString() },
    });
  } catch (error: any) {
    console.error("CRON publish error:", error);
    return NextResponse.json({ error: { code: "CRON_FAILED", message: "Internal server error" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
