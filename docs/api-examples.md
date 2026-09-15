# API Examples

All examples use `http://localhost:3000` as the base URL. Replace with your production URL.

## Authentication

### Session-based (Dashboard)

Dashboard routes use Supabase session cookies. Log in via the web UI — cookies are automatically sent with requests.

### Token-based (Headless/API)

Create an integration in **Dashboard → Settings → Integrations**. You'll receive a raw token `op_live_<64hex>`. Use it in headers:

```bash
# Option A: Authorization header
curl -H "Authorization: Bearer op_live_abc123..." http://localhost:3000/api/v1/posts

# Option B: Custom header
curl -H "X-OpenPost-Token: op_live_abc123..." http://localhost:3000/api/v1/posts
```

### Project Scoping

For multi-project instances, specify the target project:

```bash
# Via query param
curl -H "X-OpenPost-Token: op_live_..." "http://localhost:3000/api/v1/posts?project=my-project"

# Via header
curl -H "X-OpenPost-Token: op_live_..." -H "X-OpenPost-Project: my-project" http://localhost:3000/api/v1/posts
```

## Posts

### List Posts

```bash
curl -H "X-OpenPost-Token: op_live_..." \
  "http://localhost:3000/api/v1/posts?limit=10&status=published"
```

**Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Getting Started with OpenPost",
      "slug": "getting-started-with-openpost",
      "status": "published",
      "publishedAt": "2025-01-15T10:00:00.000Z",
      "wordCount": 1250,
      "readingTime": 5
    }
  ]
}
```

### Get Post by Slug

```bash
curl -H "X-OpenPost-Token: op_live_..." \
  "http://localhost:3000/api/v1/posts/getting-started-with-openpost"
```

### Create Post

```bash
curl -X POST \
  -H "X-OpenPost-Token: op_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Post",
    "slug": "my-new-post",
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Hello world!" }]
        }
      ]
    },
    "status": "draft",
    "seo": {
      "title": "SEO Title",
      "description": "SEO description for search engines"
    }
  }' \
  http://localhost:3000/api/blogs
```

**Response (201):**

```json
{
  "data": {
    "id": "...",
    "title": "My New Post",
    "slug": "my-new-post",
    "status": "draft",
    "wordCount": 12,
    "readingTime": 1
  }
}
```

### Update Post

```bash
curl -X POST \
  -H "X-OpenPost-Token: op_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Title",
    "content": { "type": "doc", "content": [...] },
    "status": "published"
  }' \
  http://localhost:3000/api/blogs
```

### Delete Post

```bash
curl -X DELETE \
  -H "X-OpenPost-Token: op_live_..." \
  "http://localhost:3000/api/blogs?id=550e8400-e29b-41d4-a716-446655440000"
```

## Categories

### List Categories

```bash
curl -H "X-OpenPost-Token: op_live_..." \
  http://localhost:3000/api/categories
```

### Create Category

```bash
curl -X POST \
  -H "X-OpenPost-Token: op_live_..." \
  -H "Content-Type: application/json" \
  -d '{ "name": "Technology", "slug": "technology" }' \
  http://localhost:3000/api/categories
```

## Tags

### List Tags

```bash
curl -H "X-OpenPost-Token: op_live_..." \
  http://localhost:3000/api/tags
```

### Create Tag

```bash
curl -X POST \
  -H "X-OpenPost-Token: op_live_..." \
  -H "Content-Type: application/json" \
  -d '{ "name": "JavaScript", "slug": "javascript" }' \
  http://localhost:3000/api/tags
```

## Authors

### List Authors

```bash
curl -H "X-OpenPost-Token: op_live_..." \
  http://localhost:3000/api/authors
```

### Create Author

```bash
curl -X POST \
  -H "X-OpenPost-Token: op_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "slug": "jane-doe",
    "bio": "Technical writer and open source contributor.",
    "email": "jane@example.com",
    "socialLinks": {
      "twitter": "janedoe",
      "github": "janedoe"
    }
  }' \
  http://localhost:3000/api/authors
```

## Media Upload (Presigned URL Flow)

### Step 1: Request Presigned URL

```bash
curl -X POST \
  -H "X-OpenPost-Token: op_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "hero-image.webp",
    "contentType": "image/webp",
    "sizeBytes": 245000
  }' \
  http://localhost:3000/api/media/upload
```

**Response:**

```json
{
  "uploadUrl": "https://pub-xxx.r2.dev/openpost-media/project-id/uuid.webp?X-Amz-...",
  "key": "openpost-media/project-id/uuid.webp",
  "mediaId": "..."
}
```

### Step 2: Upload File to Presigned URL

```bash
curl -X PUT \
  -H "Content-Type: image/webp" \
  --data-binary @hero-image.webp \
  "https://pub-xxx.r2.dev/openpost-media/project-id/uuid.webp?X-Amz-..."
```

### Step 3: Verify Upload (Optional)

```bash
curl -H "X-OpenPost-Token: op_live_..." \
  "http://localhost:3000/api/media?projectId=..."
```

**Validation:** Server validates magic bytes via `validateMagicBytes()` (`src/lib/storage.ts:108`) for PNG, JPEG, WebP, GIF, AVIF, PDF, SVG, MP4. SVGs are scanned for `<script>`, event handlers, and `javascript:` URIs.

## Webhooks

### Create Webhook

```bash
curl -X POST \
  -H "X-OpenPost-Token: op_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Notifier",
    "url": "https://hooks.slack.com/services/...",
    "events": ["post.published", "post.updated"],
    "secret": "my-hmac-secret"
  }' \
  http://localhost:3000/api/webhooks
```

### Webhook Events

| Event | Description |
|---|---|
| `post.created` | New post created |
| `post.updated` | Post content/metadata updated |
| `post.published` | Post status changed to published |
| `post.scheduled` | Post scheduled for future publish |
| `post.deleted` | Post deleted |
| `post.untrashed` | Post restored from trash |
| `category.created` | Category created |
| `category.updated` | Category updated |
| `category.deleted` | Category deleted |
| `tag.created` | Tag created |
| `media.uploaded` | Media file uploaded |
| `*` or `all` | Subscribe to all events |

### Verify Webhook Signature

```typescript
import crypto from "crypto";

function verifyWebhookSignature(
  timestamp: string,
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your webhook handler:
const timestamp = req.headers["x-openpost-timestamp"];
const signature = req.headers["x-openpost-signature"];
const body = await req.text();

if (!verifyWebhookSignature(timestamp, body, signature, WEBHOOK_SECRET)) {
  return new Response("Invalid signature", { status: 401 });
}
```

### Webhook Payload Format

```json
{
  "event": "post.published",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My Post",
    "slug": "my-post",
    "publishedAt": "2025-01-15T10:00:00.000Z"
  },
  "timestamp": "2025-01-15T10:00:00.000Z",
  "deliveryId": "unique-delivery-id"
}
```

### Headers Sent

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `User-Agent` | `OpenPost-WebhookEngine/1.0` |
| `X-OpenPost-Event` | Event name |
| `X-OpenPost-Delivery-ID` | Unique delivery UUID |
| `X-OpenPost-Timestamp` | ISO 8601 timestamp |
| `X-OpenPost-Signature` | HMAC-SHA256 signature (if secret configured) |

## Polls

### Vote on Poll

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{ "optionId": "opt_1" }' \
  http://localhost:3000/api/v1/polls/{pollId}/vote
```

### Get Poll Results

```bash
curl http://localhost:3000/api/v1/polls/{pollId}
```

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to publish this post."
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `PENDING_APPROVAL` | 403 | Account awaiting admin approval |
| `ACCOUNT_SUSPENDED` | 403 | Account has been suspended |
| `ACCOUNT_REJECTED` | 403 | Account request was rejected |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found (also used for access denial) |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `SLUG_EXISTS` | 409 | Slug already in use |
| `PROJECT_REQUIRED` | 400 | No project specified |
| `SAVE_FAILED` | 500 | Database save error |
| `FETCH_FAILED` | 500 | Database fetch error |

## Pagination

List endpoints support `limit` query parameter (default 50, max 100):

```bash
curl -H "X-OpenPost-Token: op_live_..." \
  "http://localhost:3000/api/v1/posts?limit=20"
```

Results are ordered by `updatedAt desc` by default.

## Caching Headers

The public API (`/api/v1/*`) may return caching headers for published content. Dashboard API routes do not cache (always fresh data).
