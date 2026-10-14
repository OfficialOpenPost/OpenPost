import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, withDbRetry } from "@/lib/db";

/**
 * Open-redirect guard. The `next` parameter is concatenated onto `origin`,
 * so values like `@evil.com` (→ `https://cms.example.com@evil.com`, where the
 * CMS host becomes userinfo and evil.com becomes the host), `//evil.com` or
 * `/\evil.com` would bounce the user off-site after a successful login —
 * a classic credential-phishing primitive.
 *
 * Only same-site absolute paths are accepted; anything else falls back to the
 * default post-login destination.
 */
function safeNextPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  const value = raw.trim();
  // Must be a single-slash absolute path; reject protocol-relative,
  // backslash variants, control chars and embedded newlines.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/pending-approval");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const userId = data.user.id;
      const email = data.user.email || "";
      const name =
        (data.user.user_metadata as Record<string, string>)?.full_name ||
        email.split("@")[0];

      // Create pending profile if it doesn't exist yet
      const existing = await withDbRetry(() =>
        db.profile.findUnique({ where: { id: userId }, select: { id: true } })
      ).catch(() => null);

      if (!existing) {
        await withDbRetry(() =>
          db.profile.create({
            data: {
              id: userId,
              email: email.toLowerCase().trim(),
              displayName: name,
              status: "pending",
            },
          })
        ).catch(() => {});
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
