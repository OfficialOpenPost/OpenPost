import crypto from "crypto";
import { db, withDbRetry } from "@/lib/db";

export type WebhookEvent =
  | "post.created"
  | "post.updated"
  | "post.published"
  | "post.scheduled"
  | "post.deleted"
  | "post.untrashed"
  | "category.created"
  | "category.updated"
  | "category.deleted"
  | "tag.created"
  | "media.uploaded";

export interface WebhookPayload {
  event: string;
  projectId?: string;
  payload: Record<string, any>;
  timestamp: string;
  deliveryId: string;
}

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

export function signPayload(timestamp: string, body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifySignature(timestamp: string, body: string, signature: string, secret: string): boolean {
  try {
    const expected = signPayload(timestamp, body, secret);
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

// SSRF protection
export function isAllowedWebhookUrl(url: string): { allowed: boolean; reason?: string } {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") {
      if (process.env.NODE_ENV === "production") {
        return { allowed: false, reason: "Only HTTPS endpoints are permitted in production." };
      }
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { allowed: false, reason: "Only HTTP/HTTPS protocols are permitted." };
      }
    }
    const hostname = u.hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0", "[::]"].includes(hostname) || hostname.includes("::")) {
      return { allowed: false, reason: "Blocked loopback / localhost address." };
    }
    if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
      return { allowed: false, reason: "Blocked internal hostname." };
    }
    if (
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) {
      return { allowed: false, reason: "Blocked RFC-1918 private IPv4 subnet." };
    }
    if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") {
      return { allowed: false, reason: "Blocked cloud instance metadata endpoint." };
    }
    if (hostname.startsWith("169.254.")) {
      return { allowed: false, reason: "Blocked link-local address." };
    }
    return { allowed: true };
  } catch {
    return { allowed: false, reason: "Invalid target URL." };
  }
}

export function isRetryableStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

export async function deliverWebhook(
  url: string,
  event: string,
  payload: Record<string, any>,
  secret?: string | null,
  timeoutMs = 5000
): Promise<{ ok: boolean; status: number; deliveryId: string; responseBody?: string }> {
  const check = isAllowedWebhookUrl(url);
  if (!check.allowed) {
    throw new Error(`SSRF blocked: ${check.reason}`);
  }

  const deliveryId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const fullPayload: WebhookPayload = {
    event,
    payload,
    timestamp,
    deliveryId,
  };
  const body = JSON.stringify(fullPayload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "OpenPost-WebhookEngine/1.0",
    "X-OpenPost-Event": event,
    "X-OpenPost-Delivery-ID": deliveryId,
    "X-OpenPost-Timestamp": timestamp,
  };

  if (secret) {
    headers["X-OpenPost-Signature"] = signPayload(timestamp, body, secret);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
      redirect: "manual",
    });

    // Check SSRF via redirect
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (loc) {
        const redirectCheck = isAllowedWebhookUrl(loc);
        if (!redirectCheck.allowed) {
          throw new Error(`SSRF blocked redirect target ${loc}: ${redirectCheck.reason}`);
        }
      }
    }

    const responseText = await res.text().catch(() => "");
    return {
      ok: res.ok,
      status: res.status,
      deliveryId,
      responseBody: responseText.slice(0, 500),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Triggers all active webhooks subscribed to the given project and event.
 */
export async function triggerWebhooks({
  projectId,
  event,
  payload,
}: {
  projectId?: string | null;
  event: WebhookEvent | string;
  payload: Record<string, any>;
}): Promise<void> {
  try {
    const webhooks = await withDbRetry(() =>
      db.webhook.findMany({
        where: {
          isActive: true,
          ...(projectId ? { projectId } : {}),
        },
      })
    ).catch(() => []);

    for (const webhook of webhooks) {
      const isSubscribed =
        webhook.events.includes(event) ||
        webhook.events.includes("*") ||
        webhook.events.includes("all");

      if (!isSubscribed) continue;

      // Deliver asynchronously
      (async () => {
        try {
          const result = await deliverWebhook(
            webhook.url,
            event,
            payload,
            webhook.secret,
            5000
          );

          await withDbRetry(() =>
            db.webhookDelivery.create({
              data: {
                webhookId: webhook.id,
                event,
                status: result.ok ? "success" : "failed",
                attempts: 1,
                payload: payload as any,
                lastError: result.ok ? null : `Status ${result.status}: ${result.responseBody || ""}`,
              },
            })
          ).catch(() => {});
        } catch (deliveryErr: any) {
          console.warn(`[webhook] Delivery failed for ${webhook.url}:`, deliveryErr.message);
          await withDbRetry(() =>
            db.webhookDelivery.create({
              data: {
                webhookId: webhook.id,
                event,
                status: "failed",
                attempts: 1,
                payload: payload as any,
                lastError: deliveryErr.message?.slice(0, 500) || "Network error",
              },
            })
          ).catch(() => {});
        }
      })();
    }
  } catch (err) {
    console.error("[webhooks] triggerWebhooks error:", err);
  }
}
