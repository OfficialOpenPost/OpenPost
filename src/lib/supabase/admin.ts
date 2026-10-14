import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client authenticated with the service-role key.
 *
 * NEVER expose this to the browser and never return values produced with it
 * directly to untrusted callers — it bypasses Row Level Security entirely.
 * Returns null when the service-role key is not configured so callers can
 * fail closed instead of silently downgrading to the anon key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !url ||
    !serviceKey ||
    url.includes("placeholder") ||
    serviceKey.includes("placeholder") ||
    serviceKey.length < 20
  ) {
    return null;
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Confirms that `userId` is a real Supabase Auth user and that `email` matches
 * the address registered on that account. Used to stop unauthenticated callers
 * from minting profiles for arbitrary UUIDs/emails.
 *
 * Fails closed: returns false when the admin client is unavailable or the
 * lookup errors.
 */
export async function verifyAuthUserMatchesEmail(
  userId: string,
  email: string
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user) return false;
    const accountEmail = (data.user.email || "").toLowerCase().trim();
    if (!accountEmail) return false;
    return accountEmail === email.toLowerCase().trim();
  } catch {
    return false;
  }
}
