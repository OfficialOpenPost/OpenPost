import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Paths that are intentionally machine-to-machine and carry their own auth
 * (Bearer secret, HMAC, or the code itself). Matched EXACTLY by prefix + "/"
 * so `/api/cronnie` or `/api/healthcheck-evil` cannot piggy-back on the skip.
 */
const M2M_PREFIXES = ["/api/health", "/api/cron", "/api/cli", "/api/webhooks", "/api/warmup"];

function isM2mPath(pathname: string): boolean {
  return M2M_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Static asset extensions — skipped for performance, but never for protected trees. */
const STATIC_EXT_RE = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif|woff2?|ttf|map|txt|xml|json)$/i;

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;

  // Never gate machine-to-machine endpoints here — they verify their own
  // credentials (CRON_SECRET, webhook HMAC, CLI code exchange).
  if (isM2mPath(pathname)) {
    return NextResponse.next();
  }

  const isDashboardRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  // FAIL CLOSED: if Supabase env is missing/misconfigured, the dashboard must
  // not be served unauthenticated. Previously every route (including
  // /dashboard) was passed straight through.
  if (!url || !key || url.includes("placeholder")) {
    if (isDashboardRoute) {
      return NextResponse.json(
        { error: { code: "SERVER_MISCONFIGURED", message: "Authentication is not configured." } },
        { status: 503 }
      );
    }
    return NextResponse.next();
  }

  // Static assets under public trees don't need a session refresh — but this
  // exemption must never apply to the dashboard (the old regex matcher let
  // `/dashboard/anything.png` bypass middleware entirely).
  if (STATIC_EXT_RE.test(pathname) && !isDashboardRoute) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Calling getUser() refreshes the auth token cookie automatically
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isPendingRoute = pathname === "/pending-approval";
  const isSetupRoute = pathname === "/setup";

  // 1. Unauthenticated user trying to access dashboard -> redirect to login
  if (!user && isDashboardRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Authenticated user visiting login/signup -> redirect to dashboard
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  // 3. Authenticated user on pending-approval -> allow page render; the page
  //    checks account status client-side and the APIs enforce server-side.
  if (user && isPendingRoute) {
    return supabaseResponse;
  }

  // 4. Authenticated user on setup page -> allow
  if (user && isSetupRoute) {
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Excluded: Next.js internals, favicon and the root logo only. Previously
    // every image extension was excluded, which let `/dashboard/x.png` skip
    // the auth gate; the middleware now handles static assets itself.
    "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
};
