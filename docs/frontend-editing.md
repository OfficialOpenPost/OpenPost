# Frontend Integration Guide

OpenPost is API-first — your frontend consumes content entirely through the REST API. The editor stores content as ProseMirror JSON, which is rendered by a shared component for visual parity between the CMS and your public site.

## API-First Approach

All content lives in the database and is served via versioned API routes under `/api/v1/`. No server-side rendering of CMS internals — your frontend fetches, caches, and renders independently.

**Base URL:** `https://your-cms-domain.com/api/v1`

**Authentication:** Bearer token via `resolveProjectContext()` (`src/lib/apiToken.ts`) — supports `Authorization: Bearer op_live_<64hex>`, `?project=` query param, or `X-OpenPost-Project` header.

---

## Fetching Posts

### List Published Posts

```
GET /api/v1/posts
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | `number` | `10` | Max posts (1-50) |
| `cursor` | `string` | — | Pagination cursor (post ID) |
| `category` | `string` | — | Filter by category slug |
| `tag` | `string` | — | Filter by tag slug |
| `author` | `string` | — | Filter by author slug |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Post Title",
      "slug": "post-title",
      "status": "published",
      "publishedAt": "2026-01-15T10:00:00Z",
      "readingTime": "5 min",
      "wordCount": 1200,
      "category": { "id": "...", "name": "Tech", "slug": "tech" },
      "authors": [{ "id": "...", "name": "Jane", "slug": "jane" }],
      "tags": [{ "id": "...", "name": "Next.js", "slug": "nextjs" }],
      "coverImage": "https://r2.dev/openpost-media/...",
      "seo": { "title": "...", "description": "...", "ogImage": "..." }
    }
  ],
  "meta": { "cursor": "next-page-id", "hasMore": true, "total": 10, "projectId": "..." }
}
```

**Cache headers:** `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` (`src/app/api/v1/posts/route.ts:130-132`).

### Get Single Post by Slug

```
GET /api/v1/posts/:slug
```

**Response includes** full `content` (ProseMirror JSON), `polls`, `authors` with bios/socialLinks, `tags`, `category`, `seo`, and `featuredImage`.

Returns `301` with `redirect: newSlug` if the slug was renamed (`src/app/api/v1/posts/[slug]/route.ts:17-44`).

Returns `ETag` header based on post ID + updatedAt for conditional requests.

---

## Rendering ProseMirror JSON

The `SharedRender` component (`src/components/render/SharedRender.tsx`) renders OpenPost's ProseMirror JSON to React. It is shared between the CMS preview and public frontend for visual parity.

### Usage

```tsx
import { SharedRender } from "@/components/render/SharedRender";

// content = the `content` field from /api/v1/posts/:slug
<SharedRender content={post.content} viewport="desktop" />
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `content` | `any` | ProseMirror JSON document (`{ type: "doc", content: [...] }`) |
| `viewport` | `"desktop" \| "tablet" \| "mobile" \| "wide"` | Responsive viewport mode |
| `isMobile` | `boolean` | Force mobile layout |

### Supported Node Types

The `SharedRender` switch statement (`SharedRender.tsx:376-861`) handles:

| Node Type | Rendering |
|-----------|-----------|
| `paragraph` | `<p>` with textAlign, lineHeight |
| `heading` (h1-h6) | `<h1>`-`<h6>` with size classes per level |
| `image` | `<figure>` with `<img>`, float/layout modes, border, shadow, opacity, rotation, link, caption |
| `callout` | Tone-colored callout box with icon and label |
| `gallery` | Grid (2-col) or carousel (horizontal scroll) of images |
| `faq` | FAQ card with collapsible `<details>` + JSON-LD |
| `accordion` | Collapsible sections with `<details>/<summary>` |
| `buttonBlock` | Styled CTA link |
| `downloadBlock` | File download card with icon |
| `pollBlock` / `poll` | Interactive poll with vote UI |
| `videoBlock` / `youtube` | YouTube/Vimeo iframe with privacy mode |
| `embedBlock` | Provider-detected embed (YouTube/Vimeo) |
| `codeBlock` | Code block with copy button + language label |
| `blockquote` | Styled blockquote with brand border |
| `bulletList` / `orderedList` | Lists with brand-colored markers |
| `table` | Full table with colgroup, rowspan, colspan |
| `taskList` | Checkbox list |
| `horizontalRule` | `<hr>` divider |

### Inline Text Marks

`renderInline()` (`SharedRender.tsx:13-44`) handles: `bold`, `italic`, `underline`, `strike`, `superscript`, `subscript`, `code`, `highlight` (with color), `link` (with target), `textStyle` (color, fontFamily, fontSize).

---

## ISR / Revalidation Strategies

### Static Generation with On-Demand Revalidation

```ts
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const res = await fetch("https://cms.example.com/api/v1/posts?limit=50");
  const { data } = await res.json();
  return data.map((post: any) => ({ slug: post.slug }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const res = await fetch(`https://cms.example.com/api/v1/posts/${params.slug}`, {
    next: { revalidate: 60 },  // ISR: revalidate every 60 seconds
  });
  const { data } = await res.json();
  return <SharedRender content={data.content} />;
}
```

### Cache Headers

The API returns:
- `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- `CDN-Cache-Control: public, s-maxage=300`
- `ETag: "<postId>-<updatedAt>"` for conditional requests

---

## Preview Mode

### Next.js Draft Mode

```ts
// app/api/draft/route.ts
import { draftMode } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  
  (await draftMode()).enable();
  
  redirect(`/blog/${slug}`);
}
```

In your page component, check draft mode and fetch with a preview token that returns unpublished posts:

```ts
const isPreview = (await draftMode()).isEnabled;
const status = isPreview ? "draft" : "published";
// Pass status to API or use a separate preview endpoint
```

---

## Webhook-Triggered Revalidation

When content changes in the CMS, webhooks can trigger revalidation on your frontend.

### Webhook Setup

1. Create a webhook in the CMS at `/dashboard/webhooks` or via API:
```json
POST /api/webhooks
{
  "name": "Vercel Revalidation",
  "url": "https://your-vercel-app.com/api/revalidate",
  "events": ["post.published", "post.updated", "post.deleted"],
  "projectId": "your-project-id"
}
```

### Frontend Revalidation Endpoint

```ts
// app/api/revalidate/route.ts
import { revalidatePath } from "next/cache";
import { verifySignature } from "@/lib/webhooks";

export async function POST(request: Request) {
  const body = await request.json();
  const signature = request.headers.get("X-OpenPost-Signature");
  
  // Verify HMAC signature
  const timestamp = request.headers.get("X-OpenPost-Timestamp");
  if (!verifySignature(timestamp, JSON.stringify(body), signature, process.env.WEBHOOK_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const { event, payload } = body;
  
  if (event === "post.published" || event === "post.updated") {
    revalidatePath(`/blog/${payload.slug}`);
    revalidatePath("/blog");  // revalidate listing page
  }
  
  if (event === "post.deleted") {
    revalidatePath("/blog");
  }
  
  return Response.json({ revalidated: true });
}
```

---

## Media URL Handling

Media files are stored in Cloudflare R2. Public URLs follow this pattern:

```
https://<bucket>.r2.dev/openpost-media/<projectId>/<uuid>.<ext>
```

The URL is returned in `variants.publicUrl` from the media API. In post content, image `src` attributes contain the full R2 public URL.

**Key format** (server-generated): `openpost-media/<projectId>/<uuid>.<ext>` — prevents path traversal and cross-project overwrites.

**Image optimization:** Use your framework's image optimization (Next.js `<Image>`, Astro `<Image>`) with the R2 URL as `src`. The R2 public URL is CDN-served and cached at the edge.

---

## SEO Metadata from API

The `seo` field on each post contains:

```json
{
  "seo": {
    "title": "Custom SEO Title",
    "description": "Meta description for search engines",
    "ogImage": "https://r2.dev/og-image.jpg",
    "image": "https://r2.dev/twitter-card.jpg"
  }
}
```

Use in page metadata:

```ts
export async function generateMetadata({ params }) {
  const { data } = await fetchPost(params.slug);
  return {
    title: data.seo?.title || data.title,
    description: data.seo?.description,
    openGraph: {
      title: data.seo?.title || data.title,
      images: [data.seo?.ogImage || data.coverImage],
    },
  };
}
```

---

## Complete Next.js Example

```tsx
// app/blog/page.tsx — Post listing
async function getPosts() {
  const res = await fetch(`${process.env.OPENPOST_URL}/api/v1/posts?limit=20`, {
    headers: {
      Authorization: `Bearer ${process.env.OPENPOST_TOKEN}`,
    },
    next: { revalidate: 60 },
  });
  return res.json();
}

export default async function BlogIndex() {
  const { data: posts } = await getPosts();
  
  return (
    <div className="max-w-2xl mx-auto">
      {posts.map((post) => (
        <article key={post.id} className="mb-8">
          <h2><a href={`/blog/${post.slug}`}>{post.title}</a></h2>
          <time>{new Date(post.publishedAt).toLocaleDateString()}</time>
          <p>{post.readingTime} read</p>
          {post.authors?.map((a) => <span key={a.id}>{a.name}</span>)}
        </article>
      ))}
    </div>
  );
}
```

```tsx
// app/blog/[slug]/page.tsx — Single post
import { SharedRender } from "@/components/render/SharedRender";

async function getPost(slug: string) {
  const res = await fetch(`${process.env.OPENPOST_URL}/api/v1/posts/${slug}`, {
    headers: { Authorization: `Bearer ${process.env.OPENPOST_TOKEN}` },
    next: { revalidate: 60 },
  });
  return res.json();
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const { data: post } = await getPost(params.slug);
  
  return (
    <article className="max-w-2xl mx-auto">
      <h1>{post.title}</h1>
      <time>{new Date(post.publishedAt).toLocaleDateString()}</time>
      <SharedRender content={post.content} />
    </article>
  );
}
```
