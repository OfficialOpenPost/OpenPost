import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Warm up database connection pool
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      message: "Database connection warmed up",
      timestamp: new Date().toISOString(),
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[warmup] database warmup failed:", error);
    return NextResponse.json({
      status: "error",
      message: "Warmup failed",
    }, {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
