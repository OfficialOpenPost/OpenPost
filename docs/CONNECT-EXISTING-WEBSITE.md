# Connecting Your Existing Website to OpenPost

This guide explains how to use OpenPost as a headless CMS for your existing website.

---

## Architecture

```
Your Existing Website
        ↓
   OpenPost REST API (Bearer Token + Project ID)
        ↓
   OpenPost Database (PostgreSQL via Supabase)
        ↓
   Cloudflare R2 (Media Assets)
```

---

## Prerequisites

1. OpenPost CMS deployed and running (e.g. `https://cms.yourdomain.com`)
2. An API token generated from **Settings → API Tokens** in the dashboard
3. Your Project ID (found in Settings)

---

## Authentication

All API requests require two headers:

```
Authorization: Bearer op_live_YOUR_64_CHAR_TOKEN
X-OpenPost-Project: your-project-uuid
```

---

## Fetching Posts

### All Published Posts

```bash
curl -H "Authorization: Bearer op_live_..." \
     -H "X-OpenPost-Project: your-project-id" \
     "https://cms.yourdomain.com/api/v1/blogs"
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "My Article",
      "slug": "my-article",
      "status": "published",
      "content": { "type": "doc", "content": [...] },
      "renderedHtml": "<article>...</article>",
      "featuredImage": { "url": "https://media.yourdomain.com/..." },
      "category": { "name": "Technology", "slug": "technology" },
      "tags": [{ "name": "React", "slug": "react" }],
      "authors": [{ "name": "John Doe", "slug": "john-doe", "photo": "..." }],
      "seo": { "title": "...", "description": "...", "ogImage": "..." },
      "publishedAt": "2025-01-15T10:00:00Z",
      "wordCount": 1200,
      "readingTime": 6
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45 }
}
```

### Single Post by Slug

```bash
curl -H "Authorization: Bearer op_live_..." \
     -H "X-OpenPost-Project: your-project-id" \
     "https://cms.yourdomain.com/api/v1/blogs/my-article"
```

### Filter by Category

```
GET /api/v1/blogs?category=technology
```

### Filter by Tag

```
GET /api/v1/blogs?tag=react
```

### Pagination

```
GET /api/v1/blogs?page=2&limit=10
```

---

## Fetching Categories

```bash
curl -H "Authorization: Bearer op_live_..." \
     -H "X-OpenPost-Project: your-project-id" \
     "https://cms.yourdomain.com/api/v1/categories"
```

---

## Fetching Tags

```bash
curl -H "Authorization: Bearer op_live_..." \
     -H "X-OpenPost-Project: your-project-id" \
     "https://cms.yourdomain.com/api/v1/tags"
```

---

## Fetching Authors

```bash
curl -H "Authorization: Bearer op_live_..." \
     -H "X-OpenPost-Project: your-project-id" \
     "https://cms.yourdomain.com/api/v1/authors"
```

---

## Using Rendered HTML

Each post includes `renderedHtml` — pre-rendered HTML ready for display:

```html
<article class="openpost-article">
  <!-- Fully rendered content with all blocks -->
</article>
```

You can inject this directly into your page template.

---

## Using ProseMirror JSON

Each post includes `content` as a ProseMirror JSON document. If you need custom rendering:

```javascript
// Example: Extract plain text from ProseMirror JSON
function extractText(node) {
  if (node.text) return node.text;
  if (node.content) return node.content.map(extractText).join("");
  return "";
}

const plainText = extractText(post.content);
```

---

## Featured Images

Featured images are served from Cloudflare R2:

```json
{
  "featuredImage": {
    "url": "https://media.yourdomain.com/openpost-media/project-id/uuid.jpg"
  }
}
```

Use the `url` directly in `<img>` tags.

---

## Drafts vs Published

By default, the public API only returns `status: "published"` posts.

To preview drafts, you need server-side rendering with your API token (never expose tokens in client-side code).

---

## Webhook Revalidation

For instant updates when content changes:

1. In OpenPost Dashboard → Webhooks → Create Webhook
2. Set URL to your revalidation endpoint
3. Select events: `post.published`, `post.updated`, `post.deleted`

### Next.js Example

```typescript
// app/api/revalidate/route.ts
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.REVALIDATION_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const body = await req.json();
  revalidatePath("/");
  revalidatePath(`/blog/${body.slug}`);
  
  return Response.json({ revalidated: true });
}
```

---

## Caching Strategy

| Approach | Pros | Cons |
|----------|------|------|
| ISR (revalidate: 60) | Simple, automatic | 60s delay |
| On-demand revalidation | Instant updates | Requires webhook setup |
| Static generation | Fastest | Requires manual rebuild |

---

## CORS

If your website runs on a different domain, ensure your OpenPost instance allows CORS for your domain. Configure this in your deployment.

---

## Protecting API Credentials

**Never** expose `op_live_*` tokens in client-side JavaScript.

For client-side rendering, create a thin API proxy on your own server that adds the authorization headers.

---

## Recommended Deployment Architecture

| Component | Recommended |
|-----------|-------------|
| OpenPost CMS | Vercel / Railway / VPS |
| Blog Frontend | Vercel / Netlify / your existing host |
| Database | Supabase (PostgreSQL) |
| Media | Cloudflare R2 |
| DNS | Cloudflare |

---

## Example: Next.js Blog Consuming OpenPost API

```typescript
// app/blog/[slug]/page.tsx
const API_URL = process.env.OPENPOST_URL!;
const API_TOKEN = process.env.OPENPOST_TOKEN!;
const PROJECT_ID = process.env.OPENPOST_PROJECT_ID!;

async function getPost(slug: string) {
  const res = await fetch(`${API_URL}/api/v1/blogs/${slug}`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "X-OpenPost-Project": PROJECT_ID,
    },
    next: { revalidate: 60 },
  });
  const json = await res.json();
  return json.data;
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.renderedHtml }} />
    </article>
  );
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check your API token is valid and not revoked |
| 403 Forbidden | Ensure `X-OpenPost-Project` header matches your project |
| Empty results | Verify posts are published, not drafts |
| CORS errors | Configure CORS on your OpenPost instance |
| Stale content | Check ISR revalidate interval or webhook setup |
