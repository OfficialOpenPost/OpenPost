import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Shared Bearer auth for cron endpoints.
 *
 * Rules:
 * - `CRON_SECRET` MUST be configured in production; if it is missing the
 *   endpoint fails closed (500) rather than running unauthenticated.
 * - The header must be exactly `Authorization: Bearer <CRON_SECRET>`; the
 *   comparison is constant-time over SHA-256 digests.
 * - In non-production a missing secret allows access with a loud warning so
 *   local development keeps working.
 *
 * Returns `null` when authorised, or a ready-to-send error response.
 */
export function verifyCronAuth(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: { code: "CONFIG_ERROR", message: "CRON_SECRET not configured on server." } },
        { status: 500 }
      );
    }
    console.warn("[CRON] CRON_SECRET not set — allowing unauthenticated cron in non-production");
    return null;
  }

  // Require the Bearer prefix explicitly — a raw secret in another header
  // shape is rejected.
  const authHeader = req.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  const bearerSecret = match?.[1]?.trim();
  if (!bearerSecret) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing CRON_SECRET. Use Authorization: Bearer <CRON_SECRET>." } },
      { status: 401 }
    );
  }

  const bearerHash = crypto.createHash("sha256").update(bearerSecret).digest();
  const secretHash = crypto.createHash("sha256").update(cronSecret).digest();
  if (!crypto.timingSafeEqual(bearerHash, secretHash)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing CRON_SECRET. Use Authorization: Bearer <CRON_SECRET>." } },
      { status: 401 }
    );
  }
  return null;
}
