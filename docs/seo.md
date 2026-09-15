# SEO Features

OpenPost provides comprehensive SEO tools for blog content, including per-post metadata, structured data, sitemaps, and social sharing optimization.

## Per-Post SEO Settings

Each blog post has a `seo` JSON column (`prisma/schema.prisma:128`) storing:

```json
{
  "title": "Custom SEO Title | My Site",
  "description": "A compelling meta description for search engines.",
  "canonical": "https://example.com/custom-url",
  "ogTitle": "Custom OG Title",
  "ogDescription": "Description for social sharing",
  "ogImage": "https://cdn.example.com/og-image.jpg",
  "twitterCard": "summary_large_image",
  "twitterTitle": "Custom Twitter Title",
  "twitterDescription": "Twitter-specific description",
  "twitterImage": "https://cdn.example.com/twitter-image.jpg",
  "keywords": ["cms", "headless", "blogging"],
  "noIndex": false,
  "noFollow": false
}
```

### Setting SEO via API

```bash
curl -X POST \
  -H "X-OpenPost-Token: op_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "id": "post-uuid",
    "seo": {
      "title": "OpenPost: The Open Source Headless CMS",
      "description": "Build modern blogs with OpenPost. Features include multi-tenancy, RBAC, and a rich Tiptap editor.",
      "ogImage": "https://example.com/og.png"
    }
  }' \
  http://localhost:3000/api/blogs
```

## OpenGraph Meta Tags

OpenPost generates OpenGraph tags for social sharing:

```html
<meta property="og:type" content="article" />
<meta property="og:title" content="Custom OG Title | Site Name" />
<meta property="og:description" content="OG description text" />
<meta property="og:image" content="https://cdn.example.com/og-image.jpg" />
<meta property="og:url" content="https://example.com/blog/my-post" />
<meta property="og:site_name" content="My Site" />
```

Priority: `seo.ogTitle` → `seo.title` → `blog.title`

## Twitter Card Metadata

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Custom Twitter Title" />
<meta name="twitter:description" content="Twitter-specific description" />
<meta name="twitter:image" content="https://cdn.example.com/twitter-image.jpg" />
```

Twitter card type defaults to `summary_large_image` when an OG image is present, `summary` otherwise.

## FAQ JSON-LD Structured Data

The `faq` block type automatically generates `FAQPage` structured data in `SharedRender.tsx:362-371`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is OpenPost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "OpenPost is an open-source headless CMS."
      }
    }
  ]
}
</script>
```

This is generated client-side from the `faq` nodes in the ProseMirror content tree. No separate configuration needed — just add FAQ blocks in the editor.

## Sitemap Generation

OpenPost supports sitemap generation for published posts. The sitemap includes:

- All posts with `status: published`
- Last modified date (`updatedAt`)
- Change frequency based on content type
- Priority based on publication recency

## RSS Feed

An RSS feed is available at `/blog/rss.xml` (or configured path) containing:

- Published posts in reverse chronological order
- Full content or excerpt
- Author information
- Publication date

## robots.txt

Configurable via project settings:

```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/

Sitemap: https://example.com/sitemap.xml
```

## Slug Management

### Auto-Generation

Slugs are auto-generated from titles using `slugify()` (`src/lib/slug.ts`):

```typescript
// "My Awesome Blog Post!" → "my-awesome-blog-post"
// "Hello World (2025)" → "hello-world-2025"
```

### Uniqueness

Slugs are unique **per project** (not globally). The `blogs` table has a unique constraint:

```prisma
@@unique([projectId, slug])
```

If a slug collision occurs, a numeric suffix is appended: `my-post-2`, `my-post-3`, etc.

### Manual Edit

Slugs can be manually set via the API:

```bash
curl -X POST \
  -H "X-OpenPost-Token: op_live_..." \
  -d '{ "id": "post-uuid", "slug": "custom-slug" }' \
  http://localhost:3000/api/blogs
```

### 301 Redirects on Slug Change

When a **published** post's slug changes, OpenPost automatically creates a `Redirect` record (`prisma/schema.prisma:320`):

```typescript
// src/app/api/blogs/route.ts:505-515
if (existing.status === "published") {
  await db.redirect.create({
    data: {
      blogId: id,
      oldSlug: existing.slug,
      newSlug: candidateSlug,
    },
  });
}
```

The public blog pages check the `redirects` table and issue 301 redirects:

```
GET /blog/old-slug → 301 → /blog/new-slug
```

## Image Alt Text

All images in the content support `alt` text:

- **FloatingImageNode:** `alt` attribute, plus `isDecorative` flag for decorative images (empty alt)
- **Gallery:** Each image has its own `alt` text
- **Featured image:** Uses `altTextDefault` from the `media` table

```json
{
  "type": "image",
  "attrs": {
    "src": "...",
    "alt": "Descriptive alt text for accessibility and SEO",
    "isDecorative": false
  }
}
```

When `isDecorative: true`, `alt` is set to `""` (empty) per WCAG guidelines.

## SEO Best Practices in OpenPost

1. **Unique titles** — Set `seo.title` per post to avoid duplicate title tags
2. **Meta descriptions** — Always set `seo.description` (150-160 characters recommended)
3. **Featured images** — Set `featuredImageId` for consistent OG/Twitter images
4. **URL structure** — Use descriptive, short slugs (`/blog/my-topic` not `/blog/post-12345`)
5. **Heading hierarchy** — Use H2-H4 for content structure (H1 is reserved for page title)
6. **Internal linking** — Use the link mark for internal cross-references
7. **Image optimization** — Upload WebP/AVIF for faster loading; R2 serves optimized variants
8. **FAQ content** — Use the FAQ block for rich snippets in search results
9. **Canonical URLs** — Set `seo.canonical` for syndicated or duplicate content
10. **No-index control** — Set `seo.noIndex: true` for draft or internal pages
