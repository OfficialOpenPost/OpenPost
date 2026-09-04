import { NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const start = Date.now();
  const checks: Record<string, any> = {};

  try {
    // 1. Warm up database connection pool
    await withDbRetry(() => db.$queryRaw`SELECT 1`);
    checks.dbConnection = "ok";

    // 2. Warm up Prisma model query engine & cache
    const samplePost = await withDbRetry(() =>
      db.blog.findFirst({
        where: { status: "published" },
        select: { id: true, slug: true, status: true },
      })
    ).catch(() => null);

    checks.dbQuery = "ok";
    checks.hasPublishedPosts = Boolean(samplePost);

    const latencyMs = Date.now() - start;

    return NextResponse.json(
      {
        status: "warm",
        latencyMs,
        checks,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    console.error("[WARMUP] Error warming up OpenPost CMS:", error);
    return NextResponse.json(
      {
        status: "degraded",
        latencyMs,
        error: error?.message || "Warmup check encountered an error",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST() {
  return GET();
}

export async function HEAD() {
  return GET();
}
