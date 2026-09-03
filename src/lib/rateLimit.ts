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

export function getClientIp(req: Request): string {
  const h = (req.headers as any).get?.("x-forwarded-for") || (req.headers as any).get?.("x-real-ip") || "unknown";
  if (typeof h === "string") return h.split(",")[0].trim();
  return "unknown";
}

// Clean up old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) if (now > v.resetAt) store.delete(k);
  }, 60_000).unref?.();
}
