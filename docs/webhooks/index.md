# Webhooks Engine & Automations

OpenPost includes an enterprise-grade webhooks engine that automatically notifies downstream frontends, CI/CD pipelines, and search indexers whenever content changes.

---

## Supported Webhook Events

| Event Name | Trigger Condition |
| :--- | :--- |
| `post.publish` | Triggered when a new or scheduled post is published. |
| `post.update` | Triggered when an already published post is edited. |
| `post.delete` | Triggered when a post is moved to trash or deleted. |
| `post.scheduled` | Triggered when a post is scheduled for future release. |
| `post.unpublish` | Triggered when a published post is converted back to draft. |

---

## Webhook Payload Structure

When an event occurs, OpenPost sends an HTTP `POST` request to your endpoint with an `application/json` payload:

```json
{
  "event": "post.publish",
  "timestamp": "2026-09-01T15:00:00.000Z",
  "deliveryId": "d1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d",
  "post": {
    "id": "7b8e1a2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
    "title": "Optimizing Next.js 16 with OpenPost",
    "slug": "optimizing-nextjs-16-with-openpost",
    "status": "published",
    "publishedAt": "2026-09-01T15:00:00.000Z",
    "category": {
      "name": "Engineering",
      "slug": "engineering"
    },
    "tags": [
      { "name": "Next.js", "slug": "nextjs" }
    ]
  }
}
```

---

## HMAC SHA-256 Signature Verification

Every webhook request includes an `X-OpenPost-Signature` HTTP header computed using your configured secret key and the raw request body:

```
X-OpenPost-Signature: sha256=5d41402abc4b2a76b9719d911017c592...
```

### Node.js / Next.js Verification Example

```typescript
// app/api/webhooks/openpost/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-openpost-signature");
  const webhookSecret = process.env.OPENPOST_WEBHOOK_SECRET!;

  // Compute expected HMAC SHA-256 hash
  const hmac = crypto.createHmac("sha256", webhookSecret);
  const digest = `sha256=${hmac.update(rawBody).digest("hex")}`;

  // Constant-time comparison to prevent timing attacks
  if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  console.log(`Received event ${payload.event} for post: ${payload.post.slug}`);

  // Trigger On-Demand ISR Revalidation
  // await revalidatePath(`/blog/${payload.post.slug}`);

  return NextResponse.json({ received: true });
}
```

### Python (FastAPI / Flask) Verification Example

```python
import hmac
import hashlib
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

WEBHOOK_SECRET = b"your_webhook_secret_here"

@app.post("/webhooks/openpost")
async def handle_openpost_webhook(request: Request):
    signature = request.headers.get("X-OpenPost-Signature")
    raw_body = await request.body()
    
    expected_sig = "sha256=" + hmac.new(WEBHOOK_SECRET, raw_body, hashlib.sha256).hexdigest()
    
    if not signature or not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    payload = await request.json()
    return {"status": "success"}
```

---

## Filtering Webhook Deliveries (GROQ Filters)

You can restrict webhooks so they only trigger for specific categories or tags using GROQ-like filter expressions:

- `category == 'seo'` — Only fires if the post belongs to the `seo` category.
- `status == 'published'` — Only fires for published items.
- `'news' in tags` — Only fires if the post is tagged with `news`.

---

## Triggering Vercel & Netlify Deploy Hooks

To trigger an automatic static rebuild of your frontend when a post is published:
1. In your **Vercel Dashboard**, go to **Project Settings → Git → Deploy Hooks**.
2. Create a hook named `OpenPost Publish`.
3. In your **OpenPost Dashboard**, go to **Settings → Webhooks → New Webhook**.
4. Paste the Vercel Deploy Hook URL and select event `post.publish`.
