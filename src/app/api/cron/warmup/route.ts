import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  // SECURITY: cron endpoints must not be publicly invocable — an open warmup
  // endpoint is free compute for an attacker and discloses DB latency.
  const authErr = verifyCronAuth(req);
  if (authErr) return authErr;

  const start = Date.now();

  try {
    // 1. Warm up database connection pool
    await withDbRetry(() => db.$queryRaw`SELECT 1`);

    // 2. Warm up Prisma model query engine
    await withDbRetry(() =>
      db.blog.findFirst({
        where: { status: "published" },
        select: { id: true, slug: true, status: true },
      })
    ).catch(() => null);

    const latencyMs = Date.now() - start;

    return NextResponse.json({
      status: "ok",
      message: "OpenPost serverless instance and DB pool warmed up successfully.",
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON_WARMUP] Warmup failed:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Warmup failed",
        latencyMs: Date.now() - start,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
