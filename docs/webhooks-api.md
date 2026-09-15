# Webhooks API

Webhooks notify external systems when content changes in OpenPost. They deliver HMAC-signed POST payloads to your endpoints with SSRF protection and retry logic.

## Supported Events

Defined in `src/lib/webhooks.ts:5-16`:

| Event | Trigger |
|-------|---------|
| `post.created` | New post created (draft) |
| `post.updated` | Post content/metadata edited |
| `post.published` | Post status changed to `published` |
| `post.scheduled` | Post scheduled for future publish |
| `post.deleted` | Post permanently deleted |
| `post.untrashed` | Post restored from trash |
| `category.created` | New category created |
| `category.updated` | Category edited |
| `category.deleted` | Category removed |
| `tag.created` | New tag created |
| `media.uploaded` | Media file uploaded |

**Wildcard subscriptions:** Use `"*"` or `"all"` in the events array to subscribe to all events.

---

## Creating Webhooks

### API

```
POST /api/webhooks
```

**Headers:** `Authorization: Bearer <session>`, `X-OpenPost-Project: <projectId>`

**Body:**
```json
{
  "name": "Deploy Hook",
  "url": "https://api.vercel.com/v1/integrations/deploy/prj_xxx",
  "events": ["post.published", "post.updated", "post.deleted"],
  "secret": "your-hmac-secret-min-16-chars",
  "filter": "category.slug == 'engineering'",
  "projectId": "uuid"
}
```

**Required fields:** `name`, `url`, `events` (array)
**Optional fields:** `secret` (min 16 chars), `filter` (GROQ-like expression)

**Permissions:** Requires `webhooks.manage` or `webhook.manage` permission (ADMIN+ role).

### Validation

- URL validated against SSRF policy (`src/lib/webhooks/route.ts:72-75`)
- Secret must be ≥16 characters if provided (`route.ts:77-79`)
- `projectId` required — inferred from header/body/query if not explicit

---

## HMAC SHA-256 Signature Verification

### Signing

`src/lib/webhooks.ts:28-30` — `signPayload(timestamp, body, secret)`:

```ts
crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")
```

The signature is computed over `<timestamp>.<JSON body>` using HMAC-SHA256.

### Delivery Headers

Every webhook delivery includes (`src/lib/webhooks.ts:155-165`):

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `User-Agent` | `OpenPost-WebhookEngine/1.0` |
| `X-OpenPost-Event` | Event type (e.g., `post.published`) |
| `X-OpenPost-Delivery-ID` | UUID for deduplication/logging |
| `X-OpenPost-Timestamp` | ISO 8601 timestamp |
| `X-OpenPost-Signature` | HMAC-SHA256 hex digest (if secret configured) |

### Verification Example

```ts
import crypto from "crypto";

function verifyWebhookSignature(
  timestamp: string,
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto.createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### Timestamp Freshness

`src/lib/webhooks.ts:41-45` — `isTimestampFresh()` rejects deliveries older than 5 minutes (`TIMESTAMP_TOLERANCE_MS = 300000`) to prevent replay attacks.

---

## SSRF Protection

`src/lib/webhooks.ts:48-106` provides comprehensive SSRF blocking:

### URL Validation (`isAllowedWebhookUrl`)

| Check | Blocked | Reason |
|-------|---------|--------|
| Non-HTTPS in production | Yes | Only HTTPS permitted in prod |
| `localhost`, `127.0.0.1`, `::1`, `0.0.0.0` | Yes | Loopback addresses |
| `.local`, `.internal` TLDs | Yes | Internal hostnames |
| `10.x.x.x` | Yes | RFC-1918 private subnet |
| `192.168.x.x` | Yes | RFC-1918 private subnet |
| `172.16-31.x.x` | Yes | RFC-1918 private subnet |
| `169.254.169.254` | Yes | Cloud metadata endpoint |
| `metadata.google.internal` | Yes | GCP metadata |
| `169.254.x.x` | Yes | Link-local addresses |
| Invalid URL | Yes | Malformed URL |

### DNS Resolution Check (`assertResolvedIpsAllowed`)

After URL validation, the hostname is resolved via `dns.promises.lookup()` and every resolved IP is checked against the same private range blocks (`src/lib/webhooks.ts:108-124`). This prevents DNS rebinding attacks where a domain resolves to a private IP.

### Redirect Check

`src/lib/webhooks.ts:180-189` — After fetching, if the response is a 3xx redirect, the `Location` header is validated:
- URL validated via `isAllowedWebhookUrl`
- Redirect target hostname resolved and checked via `assertResolvedIpsAllowed`
- Uses `redirect: "manual"` in the fetch call to prevent automatic redirect following

---

## Secret Management

### Storage

Secrets are stored in the `webhook` database model. They are **never returned in API responses**.

### Sanitized Responses

`src/app/api/webhooks/route.ts:36-41` — GET responses replace the secret:

```json
{
  "id": "uuid",
  "name": "Deploy Hook",
  "secret": undefined,
  "secretConfigured": true,
  "secretPreview": "••••7890"
}
```

- `secret`: Always `undefined` in responses
- `secretConfigured`: `boolean` — whether a secret is set
- `secretPreview`: Last 4 characters prefixed with bullets

---

## Webhook Delivery

### Delivery Function

`src/lib/webhooks.ts:130-202` — `deliverWebhook(url, event, payload, secret, timeoutMs)`:

1. **SSRF check** on URL
2. **DNS resolution check** on hostname
3. **Build payload:** `{ event, payload, timestamp, deliveryId }`
4. **Sign** if secret is provided
5. **POST** with `AbortController` timeout (default 5000ms)
6. **Check redirect** SSRF if 3xx response
7. **Return** `{ ok, status, deliveryId, responseBody }`

### Timeout

Default timeout: **5 seconds** (`timeoutMs = 5000`). Configurable per-call.

### Retry Behavior

`src/lib/webhooks.ts:126-128` — `isRetryableStatus()` considers these statuses retryable:

| Status | Meaning |
|--------|---------|
| `408` | Request Timeout |
| `429` | Too Many Requests |
| `500` | Internal Server Error |
| `502` | Bad Gateway |
| `503` | Service Unavailable |
| `504` | Gateway Timeout |

Currently, webhooks are delivered **fire-and-forget** — each delivery is attempted once, with results logged to `webhookDelivery` table. Future versions may add automatic retry queues.

### Delivery Logging

Every delivery is recorded in the `webhookDelivery` model (`src/lib/webhooks.ts:245-256`):

```ts
{
  webhookId: "uuid",
  event: "post.published",
  status: "success" | "failed",
  attempts: 1,
  payload: { ... },
  lastError: null | "Status 500: ..."
}
```

---

## Webhook Payload Format

```json
{
  "event": "post.published",
  "projectId": "uuid",
  "payload": {
    "id": "post-uuid",
    "title": "My Post",
    "slug": "my-post",
    "status": "published",
    "publishedAt": "2026-01-15T10:00:00Z"
  },
  "timestamp": "2026-01-15T10:00:05.123Z",
  "deliveryId": "uuid"
}
```

---

## Triggering Webhooks

`src/lib/webhooks.ts:207-277` — `triggerWebhooks({ projectId, event, payload })`:

Called automatically by the CMS when content changes:

1. Queries all active webhooks for the project
2. Filters by event subscription (exact match, `*`, or `all`)
3. Delivers asynchronously (fire-and-forget) for each matching webhook
4. Logs delivery results to `webhookDelivery` table
5. Errors are caught and logged — never throw to caller

---

## Vercel/Netlify Deploy Hooks

### Vercel

```json
POST /api/webhooks
{
  "name": "Vercel Deploy",
  "url": "https://api.vercel.com/v1/integrations/deploy/prj_xxx/token",
  "events": ["post.published", "post.updated"],
  "projectId": "your-project-id"
}
```

### Netlify

```json
POST /api/webhooks
{
  "name": "Netlify Build",
  "url": "https://api.netlify.com/build_hooks/xxxxx",
  "events": ["post.published"],
  "projectId": "your-project-id"
}
```

### Custom Build Trigger

```json
POST /api/webhooks
{
  "name": "Custom CI",
  "url": "https://ci.example.com/hooks/openpost",
  "events": ["post.published", "post.unpublished"],
  "secret": "build-hook-secret-here-min16",
  "filter": "category.slug == 'blog'"
}
```

---

## GROQ-Like Filter Syntax

The optional `filter` field on webhooks allows event filtering using a simple expression syntax:

```
category.slug == 'engineering'
```

```
tag.name == 'release' || tag.name == 'announcement'
```

```
status == 'published' && category.slug != 'drafts'
```

**Supported operators:** `==`, `!=`, `&&`, `||`

Filter evaluation happens server-side before delivery — webhooks with non-matching filter expressions are skipped.

---

## API Reference

### List Webhooks

```
GET /api/webhooks?projectId=<id>
```

Returns sanitized webhook list (secrets masked). ADMIN+ see all their projects' webhooks.

### Create Webhook

```
POST /api/webhooks
```

Requires `name`, `url`, `events`. Optional: `secret`, `filter`, `projectId`.

### Delete Webhook

```
DELETE /api/webhooks/:id
```

Requires `webhooks.manage` permission. Removes webhook and stops future deliveries.

### Test Webhook

```
POST /api/webhooks/:id/test
```

Sends a `test.ping` event to the webhook URL. Useful for verifying connectivity and signature verification before enabling live events.
