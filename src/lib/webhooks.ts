import crypto from "crypto";
import dns from "dns";
import http from "http";
import https from "https";
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
    // timingSafeEqual throws on length mismatch — normalise first so the
    // comparison is always constant-time over equal-length buffers.
    const a = Buffer.from(signature, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isTimestampFresh(timestamp: string, toleranceMs = TIMESTAMP_TOLERANCE_MS): boolean {
  const ts = new Date(timestamp).getTime();
  if (isNaN(ts)) return false;
  return Math.abs(Date.now() - ts) <= toleranceMs;
}

// SSRF protection -----------------------------------------------------------

/** Only standard web ports are permitted for webhook targets. */
const ALLOWED_WEBHOOK_PORTS = new Set([80, 443, 8080, 8443]);

/**
 * Normalise a hostname that may be an IP in one of the many textual forms an
 * attacker can use to smuggle loopback/private addresses past naive filters:
 *   - decimal/octal/hex IPv4:  "2130706433", "0177.0.0.1", "0x7f.0.0.1"
 *   - dotted-padded forms:     "127.000.000.001"
 *   - IPv6 with embedded v4:   "::ffff:127.0.0.1", "64:ff9b::127.0.0.1"
 * Returns the canonical lowercase textual IP, or null if `host` is not an IP.
 */
export function normalizeIpHost(host: string): string | null {
  const h = host.trim().replace(/^\[|\]$/g, "").toLowerCase();
  if (!h) return null;

  // Already-canonical IPv6 (contains a colon)
  if (h.includes(":")) {
    // IPv4-mapped / embedded forms: pull out the trailing dotted quad and expand.
    const v4Match = h.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (v4Match) {
      const v4 = normalizeIpv4(v4Match[1]);
      if (!v4) return null;
      // Re-express as full IPv6 so range checks below are uniform.
      const parts = v4.split(".").map((p) => Number(p).toString(16).padStart(2, "0"));
      const prefix = h.slice(0, h.length - v4Match[1].length).replace(/:$/, "");
      const expanded = `${prefix}:${parts[0]}${parts[1]}:${parts[2]}${parts[3]}`;
      return expanded;
    }
    return h; // plain IPv6 — handled by isBlockedResolvedIp
  }

  // Pure-numeric hosts: decimal ("2130706433"), hex ("0x7f000001"), octal.
  if (/^(0x[0-9a-f]+|0[0-7]+|\d+)$/.test(h)) {
    let value: number;
    if (h.startsWith("0x")) value = parseInt(h.slice(2), 16);
    else if (/^0[0-7]+$/.test(h)) value = parseInt(h, 8);
    else value = parseInt(h, 10);
    if (!Number.isFinite(value) || value < 0 || value > 0xffffffff) return null;
    return normalizeIpv4(
      `${(value >>> 24) & 0xff}.${(value >>> 16) & 0xff}.${(value >>> 8) & 0xff}.${value & 0xff}`
    );
  }

  // Dotted IPv4 (possibly with octal/zero-padded octets).
  if (h.split(".").length === 4) {
    return normalizeIpv4(h);
  }

  return null;
}

/** Canonicalise a dotted-quad IPv4, expanding octal/zero-padded octets. */
function normalizeIpv4(ip: string): string | null {
  const octets = ip.split(".");
  if (octets.length !== 4) return null;
  const out: number[] = [];
  for (const octet of octets) {
    if (!/^(0x[0-9a-fA-F]+|0[0-7]*|[0-9]+)$/.test(octet)) return null;
    let value: number;
    if (octet.startsWith("0x")) value = parseInt(octet.slice(2), 16);
    else if (/^0[0-7]+$/.test(octet)) value = parseInt(octet, 8);
    else value = parseInt(octet, 10);
    if (!Number.isFinite(value) || value < 0 || value > 255) return null;
    out.push(value);
  }
  return out.join(".");
}

/** True for IPv4 addresses in ranges that must never be contacted. */
function isBlockedIpv4(ip: string): string | null {
  const [a, b] = ip.split(".").map(Number);
  if (a === 0) return "Blocked 0.0.0.0/8 (this-host) network."; // 0.0.0.0/8
  if (a === 127) return "Blocked loopback address."; // 127.0.0.0/8 (whole /8, not just .1)
  if (a === 10) return "Blocked RFC-1918 private IPv4 subnet."; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return "Blocked RFC-1918 private IPv4 subnet."; // 172.16.0.0/12
  if (a === 192 && b === 168) return "Blocked RFC-1918 private IPv4 subnet."; // 192.168.0.0/16
  if (a === 169 && b === 254) return "Blocked link-local / cloud metadata address."; // 169.254.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return "Blocked CGNAT (100.64.0.0/10) address."; // carrier-grade NAT
  if (a === 192 && b === 0) return "Blocked IETF special-purpose address."; // 192.0.0.0/24
  if (a === 198 && (b === 18 || b === 19)) return "Blocked benchmarking network."; // 198.18.0.0/15
  if (a >= 224) return "Blocked multicast/reserved address."; // 224.0.0.0/4 + 240.0.0.0/4
  return null;
}

/** True for IPv6 addresses in ranges that must never be contacted. */
function isBlockedIpv6(ip: string): string | null {
  const h = ip.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "::" || h === "::1") return "Blocked loopback address.";
  if (h.startsWith("::ffff:")) {
    // IPv4-mapped — evaluate the embedded v4 with the v4 rules.
    const v4 = h.slice("::ffff:".length);
    if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) return isBlockedIpv4(v4);
  }
  if (/^f[cd]/.test(h)) return "Blocked IPv6 unique-local address."; // fc00::/7
  if (/^fe[89ab]/.test(h)) return "Blocked IPv6 link-local address."; // fe80::/10
  if (h.startsWith("ff")) return "Blocked IPv6 multicast address."; // ff00::/8
  if (h.startsWith("64:ff9b")) return "Blocked NAT64 address."; // 64:ff9b::/96
  if (h.startsWith("2001:db8")) return "Blocked IPv6 documentation address.";
  if (h.startsWith("2002:")) return "Blocked 6to4 transition address."; // 2002::/16 can embed v4
  return null;
}

/**
 * Combined check for any textual IP (v4 or v6, any notation).
 */
export function isBlockedIpLiteral(ip: string): { blocked: boolean; reason?: string } {
  const normalized = normalizeIpHost(ip);
  if (!normalized) return { blocked: false };

  if (normalized.includes(":")) {
    const reason = isBlockedIpv6(normalized);
    return reason ? { blocked: true, reason } : { blocked: false };
  }
  const reason = isBlockedIpv4(normalized);
  return reason ? { blocked: true, reason } : { blocked: false };
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

    // Port allow-list: blocks classic SSRF pivots onto internal services
    // (6379 redis, 11211 memcached, 27017 mongo, 9200 elastic, …).
    if (u.port && !ALLOWED_WEBHOOK_PORTS.has(Number(u.port))) {
      return { allowed: false, reason: "Port not permitted for webhook targets." };
    }

    const rawHostname = u.hostname.toLowerCase();
    const hostname = rawHostname.replace(/^\[|\]$/g, "");

    // Literal IPs in ANY notation (decimal, hex, octal, embedded-v4, …)
    const literalCheck = isBlockedIpLiteral(hostname);
    if (literalCheck.blocked) {
      return { allowed: false, reason: literalCheck.reason || "Blocked private address." };
    }

    // Hostnames that look like bare numbers never resolve as domains meaningfully
    // but some resolvers interpret them as IPv4 — already handled above, but be
    // explicit for dotted forms that failed normalization.
    if (/^[\d.xXa-fA-F]+$/.test(hostname) && !hostname.includes("-")) {
      const maybeIp = normalizeIpHost(hostname);
      if (maybeIp) {
        const recheck = isBlockedIpLiteral(maybeIp);
        if (recheck.blocked) {
          return { allowed: false, reason: recheck.reason || "Blocked private address." };
        }
      }
    }

    if (["localhost", "localhost.localdomain", "ip6-localhost", "ip6-loopback"].includes(hostname)) {
      return { allowed: false, reason: "Blocked loopback / localhost address." };
    }
    if (
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".home.arpa") ||
      hostname.endsWith(".localdomain")
    ) {
      return { allowed: false, reason: "Blocked internal hostname." };
    }
    if (hostname === "metadata.google.internal" || hostname === "metadata.goog") {
      return { allowed: false, reason: "Blocked cloud instance metadata endpoint." };
    }
    return { allowed: true };
  } catch {
    return { allowed: false, reason: "Invalid target URL." };
  }
}

export function isBlockedResolvedIp(ip: string): { blocked: boolean; reason?: string } {
  return isBlockedIpLiteral(ip);
}

async function assertResolvedIpsAllowed(hostname: string): Promise<string> {
  // Literal IPs skip DNS entirely.
  if (normalizeIpHost(hostname)) {
    const check = isBlockedIpLiteral(hostname);
    if (check.blocked) {
      throw new Error(`SSRF blocked address ${hostname}: ${check.reason}`);
    }
    return hostname.replace(/^\[|\]$/g, "");
  }

  let addresses;
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch {
    throw new Error(`DNS resolution failed for ${hostname}`);
  }
  if (!addresses || addresses.length === 0) {
    throw new Error(`No DNS records found for ${hostname}`);
  }
  for (const addr of addresses) {
    const check = isBlockedResolvedIp(addr.address);
    if (check.blocked) {
      throw new Error(`SSRF blocked resolved IP ${addr.address} for ${hostname}: ${check.reason}`);
    }
  }
  // Return the first validated address for IP pinning at connect time.
  return addresses[0].address;
}

export function isRetryableStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

/**
 * Low-level request that connects to `pinnedIp` while keeping the original
 * hostname for SNI/Host. Because the socket lookup is overridden, a DNS
 * rebind between our validation and the connect cannot redirect the request
 * to an internal address (TOCTOU / DNS-rebinding defence).
 */
function requestPinned(
  url: URL,
  pinnedIp: string,
  options: { method: string; headers: Record<string, string>; body?: string; timeoutMs: number }
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  const isHttps = url.protocol === "https:";
  const lib = isHttps ? https : http;
  const family = pinnedIp.includes(":") ? 6 : 4;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname, // original hostname → SNI + Host header intact
        port: url.port || (isHttps ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: options.method,
        headers: options.headers,
        // Pin: the OS resolver is never consulted for the actual connect.
        lookup: (_hostname: string, _opts: unknown, cb: (err: Error | null, address: string | dns.LookupAddress[], family?: number) => void) =>
          cb(null, pinnedIp, family),
        servername: isHttps && !pinnedIp.includes(":") ? url.hostname : undefined,
        timeout: options.timeoutMs,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          if (body.length < 50_000) body += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode || 0, headers: res.headers, body }));
      }
    );

    req.on("timeout", () => req.destroy(new Error("Webhook delivery timed out")));
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
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

  const parsedUrl = new URL(url);
  const pinnedIp = await assertResolvedIpsAllowed(parsedUrl.hostname);

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
    "Content-Length": String(Buffer.byteLength(body)),
  };

  if (secret) {
    headers["X-OpenPost-Signature"] = signPayload(timestamp, body, secret);
  }

  const res = await requestPinned(parsedUrl, pinnedIp, {
    method: "POST",
    headers,
    body,
    timeoutMs,
  });

  // Manual redirect handling: never auto-follow. Validate + re-pin each hop.
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.location;
    if (loc) {
      const redirectCheck = isAllowedWebhookUrl(loc);
      if (!redirectCheck.allowed) {
        throw new Error(`SSRF blocked redirect target ${loc}: ${redirectCheck.reason}`);
      }
      const redirectUrl = new URL(loc, url);
      await assertResolvedIpsAllowed(redirectUrl.hostname);
      // Redirect target is validated but NOT followed — the caller sees the 3xx.
    }
  }

  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    deliveryId,
    responseBody: res.body.slice(0, 500),
  };
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
    // SECURITY: webhooks are strictly project-scoped. A null/undefined
    // projectId previously produced an unscoped findMany that delivered this
    // event (and its payload) to EVERY tenant's endpoints.
    if (!projectId) {
      return;
    }

    const webhooks = await withDbRetry(() =>
      db.webhook.findMany({
        where: {
          isActive: true,
          projectId,
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
