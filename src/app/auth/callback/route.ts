import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, withDbRetry } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/pending-approval";

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
