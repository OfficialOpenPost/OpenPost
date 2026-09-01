import crypto from "crypto";

export type WebhookEvent = "post.publish" | "post.update" | "post.delete" | "post.scheduled" | "post.unpublish" | "blog.created" | "blog.updated" | "blog.published" | "blog.unpublished" | "blog.deleted" | "blog.restored" | "blog.scheduled" | "media.created" | "category.updated" | "tag.updated";

export interface WebhookPayload {
  event: WebhookEvent;
  post?: { id: string; slug: string; title: string; status: string };
  media?: { id: string; filename: string };
  timestamp: string; // ISO string
  deliveryId: string; // unique idempotency key
}

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

export function signPayload(timestamp: string, body: string, secret: string): string {
  // Signature = HMAC SHA256 of timestamp + "." + body (like Stripe/GitHub)
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifySignature(timestamp: string, body: string, signature: string, secret: string): boolean {
  const expected = signPayload(timestamp, body, secret);
  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isTimestampFresh(timestamp: string, toleranceMs = TIMESTAMP_TOLERANCE_MS): boolean {
  const ts = new Date(timestamp).getTime();
  if (isNaN(ts)) return false;
  return Math.abs(Date.now() - ts) <= toleranceMs;
}

export function matchesFilter(payload: WebhookPayload, filter?: string | null): boolean {
  if (!filter) return true;
  const m = filter.match(/(\w+)\s*==\s*['"]([^'"]+)['"]/);
  if (!m) return true;
  const [, field, value] = m;
  const post = (payload.post ?? {}) as Record<string, unknown>;
  return String(post[field] ?? "") === value;
}

// SSRF protection
export function isAllowedWebhookUrl(url: string): { allowed: boolean; reason?: string } {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") {
      // Allow http only in development
      if (process.env.NODE_ENV === "production") return { allowed: false, reason: "Only HTTPS allowed in production" };
      if (u.protocol !== "http:" && u.protocol !== "https:") return { allowed: false, reason: "Only HTTP/HTTPS allowed" };
    }
    const hostname = u.hostname.toLowerCase();
    // Block localhost, loopback, private, link-local, metadata
    if (["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(hostname)) return { allowed: false, reason: "Blocked localhost" };
    if (hostname.endsWith(".local")) return { allowed: false, reason: "Blocked .local" };
    if (/^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return { allowed: false, reason: "Blocked private IP range" };
    if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") return { allowed: false, reason: "Blocked cloud metadata" };
    if (hostname.includes("169.254.")) return { allowed: false, reason: "Blocked link-local" };
    return { allowed: true };
  } catch {
    return { allowed: false, reason: "Invalid URL" };
  }
}

export function isRetryableStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

export function getNextRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s...
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

export async function deliverWebhook(url: string, event: WebhookEvent, payload: Omit<WebhookPayload, "timestamp" | "deliveryId"> & Partial<Pick<WebhookPayload, "timestamp" | "deliveryId">>, secret?: string | null, timeoutMs = 5000): Promise<{ ok: boolean; status: number; deliveryId: string }> {
  const check = isAllowedWebhookUrl(url);
  if (!check.allowed) throw new Error(`SSRF blocked: ${check.reason}`);

  const deliveryId = payload.deliveryId ?? crypto.randomUUID();
  const timestamp = payload.timestamp ?? new Date().toISOString();
  const fullPayload: WebhookPayload = { ...payload, timestamp, deliveryId } as WebhookPayload;
  const body = JSON.stringify(fullPayload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "OpenPost-Webhook/1.0",
    "X-OpenPost-Event": event,
    "X-OpenPost-Delivery-ID": deliveryId,
    "X-OpenPost-Timestamp": timestamp,
  };
  if (secret) headers["X-OpenPost-Signature"] = signPayload(timestamp, body, secret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "POST", headers, body, signal: controller.signal, redirect: "manual" });
    // Block redirects to private addresses (SSRF via redirect)
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (loc) {
        const redirectCheck = isAllowedWebhookUrl(loc);
        if (!redirectCheck.allowed) throw new Error(`SSRF blocked redirect to ${loc}: ${redirectCheck.reason}`);
      }
    }
    return { ok: res.ok, status: res.status, deliveryId };
  } finally {
    clearTimeout(timeout);
  }
}
