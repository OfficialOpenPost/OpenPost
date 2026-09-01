# Headless REST API Overview

OpenPost exposes a fast, cached, and secure REST API designed for headless consumption by modern frontends (Next.js, Astro, Remix, mobile apps, or static site generators).

---

## Base URL

All public API endpoints are versioned under `/api/v1`:

```
https://your-openpost-domain.com/api/v1
```

---

## Authentication & Headers

### Public Published Content
Public endpoints (such as fetching published posts, categories, tags, and authors) can be queried directly with project scoping:

```bash
curl -X GET "https://your-openpost-domain.com/api/v1/posts?project=your-project-slug"
```

### Integration Token Authentication (Recommended)
For secure frontend access and private integrations, provide your integration API token using either the `X-OpenPost-Token` or `Authorization: Bearer` header:

```bash
# Option 1: X-OpenPost-Token Header (Recommended)
curl -X GET "https://your-openpost-domain.com/api/v1/posts" \
  -H "X-OpenPost-Token: op_sec_7a8b9c0d1e2f3a4b5c6d..."

# Option 2: Bearer Token Header
curl -X GET "https://your-openpost-domain.com/api/v1/posts" \
  -H "Authorization: Bearer op_sec_7a8b9c0d1e2f3a4b5c6d..."
```

---

## Edge Caching & ETags

OpenPost includes built-in HTTP caching headers to minimize database load and maximize performance on edge CDNs (Vercel Edge, Cloudflare, Fastly):

- `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- `ETag`: Generated from the post's `updatedAt` timestamp and content hash.

If your frontend sends an `If-None-Match` header matching the current ETag, the API responds immediately with `304 Not Modified` and zero payload bytes.

---

## Cursor-Based Pagination

List endpoints use deterministic cursor pagination for optimal performance on large datasets:

```
GET /api/v1/posts?limit=10&cursor=550e8400-e29b-41d4-a716-446655440000
```

### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `limit` | integer | `10` | Number of items to return (max: `50`). |
| `cursor` | string | `null` | The ID of the last item from the previous page. |
| `category`| string | `null` | Filter posts by category slug. |
| `tag` | string | `null` | Filter posts by tag slug. |
| `author` | string | `null` | Filter posts by author slug. |
| `search` | string | `null` | Full-text search keyword query. |

---

## Standard JSON Response Format

### Success Response (List)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Getting Started with OpenPost",
      "slug": "getting-started-with-openpost",
      "wordCount": 850,
      "readingTime": 4,
      "publishedAt": "2026-09-01T12:00:00.000Z",
      "category": {
        "name": "Engineering",
        "slug": "engineering"
      },
      "tags": [
        { "name": "Next.js", "slug": "nextjs" }
      ]
    }
  ],
  "pagination": {
    "nextCursor": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "hasMore": true,
    "limit": 10
  }
}
```

### Error Response

```json
{
  "error": "Not Found",
  "message": "The requested post could not be found or has not been published.",
  "statusCode": 404
}
```

---

## API Endpoints Directory

| Resource | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **Posts** | `GET` | `/api/v1/posts` | List published posts with filters and cursor pagination |
| **Post Detail**| `GET` | `/api/v1/posts/:slug` | Retrieve a single published post with full JSON AST |
| **Categories** | `GET` | `/api/v1/categories` | List all categories |
| **Tags** | `GET` | `/api/v1/tags` | List all tags |
| **Authors** | `GET` | `/api/v1/authors` | List all author profiles |
| **Polls** | `GET` | `/api/v1/polls/:id` | Get poll options and current vote tally |
| **Poll Vote** | `POST` | `/api/v1/polls/:id/vote`| Submit a vote with IP/cookie fingerprinting |
| **Media** | `POST` | `/api/media/upload` | Upload an image asset to Cloudflare R2 |
| **Cron** | `GET` | `/api/cron/publish` | Automated cron job to publish scheduled posts |
