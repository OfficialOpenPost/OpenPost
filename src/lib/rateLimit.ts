/**
 * In-memory sliding window rate limiter.
 * NOTE: This store is per-instance and in-memory only. For multi-instance horizontal scaling,
 * back with an external store such as Redis or Upstash.
 */
type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export interface RateLimitOpts {
  windowMs: number;
  max: number;
}

export function rateLimit(key: string, opts: RateLimitOpts): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: opts.max - 1, resetAt };
  }
  if (entry.count >= opts.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { allowed: true, remaining: opts.max - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract the client IP for rate limiting.
 *
 * `x-forwarded-for` is attacker-controllable end-to-end: the client can send
 * any value and each proxy *appends* the real peer. Trusting the LEFT-most
 * entry (the old behaviour) let any caller bypass rate limits simply by
 * sending a fresh `X-Forwarded-For` per request. We instead prefer
 * `x-real-ip` (set by the terminating proxy and not client-suppliable when
 * the platform overwrites it) and otherwise take the RIGHT-most XFF entry,
 * which is the address added by our own edge.
 */
export function getClientIp(req: Request): string {
  const get = (name: string): string | null => {
    const v = (req.headers as any).get?.(name);
    return typeof v === "string" ? v : null;
  };

  const realIp = get("x-real-ip")?.trim();
  if (realIp) return sanitizeIp(realIp);

  const xff = get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    const rightMost = parts[parts.length - 1];
    if (rightMost) return sanitizeIp(rightMost);
  }

  return "unknown";
}

/** Keep only a short, printable token so header content can't explode rate-limit keys. */
function sanitizeIp(value: string): string {
  const cleaned = value.replace(/[^0-9a-fA-F:.%\-_]/g, "");
  return cleaned.slice(0, 45) || "unknown";
}

// Clean up old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) if (now > v.resetAt) store.delete(k);
  }, 60_000).unref?.();
}
