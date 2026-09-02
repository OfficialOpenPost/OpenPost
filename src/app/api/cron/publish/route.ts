import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { triggerWebhooks } from "@/lib/webhooks";

function verifyCronAuth(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  // Fail closed in production — secret must be configured
  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: { code: "CONFIG_ERROR", message: "CRON_SECRET not configured on server." } }, { status: 500 });
    }
    // In dev, allow without secret but warn
    console.warn("[CRON] CRON_SECRET not set — allowing unauthenticated cron in non-production");
    return null;
  }

  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!bearerSecret || bearerSecret !== cronSecret) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing CRON_SECRET. Use Authorization: Bearer <CRON_SECRET>." } },
      { status: 401 }
    );
  }
  return null;
}

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
    return NextResponse.json({ error: { code: "CRON_FAILED", message: String(error?.message ?? error) } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
