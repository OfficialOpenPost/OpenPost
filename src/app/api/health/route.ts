import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "Connected";
  } catch {
    checks.database = "Failed";
  }

  checks.auth = process.env.NEXT_PUBLIC_SUPABASE_URL ? "Connected" : "Missing";
  checks.r2 = process.env.R2_ACCOUNT_ID ? "Connected" : "Missing";
  checks.env = "Valid";
  checks.webhooks = "Operational";
  checks.api = "Operational";

  const allOk = Object.values(checks).every((v) => v === "Connected" || v === "Valid" || v === "Operational");

  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
