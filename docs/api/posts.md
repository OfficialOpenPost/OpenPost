# Posts & Revisions API Reference

The Posts API enables you to list, fetch, create, update, delete, and restore blog posts and manage their revision history.

---

## 1. List Published Posts

`GET /api/v1/posts`

Returns a cursor-paginated list of published blog posts. Draft and archived posts are never returned by this endpoint.

### Query Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `limit` | integer | No | `10` | Number of posts to return (1 to 50). |
| `cursor` | string (UUID) | No | `null` | Pagination cursor (ID of the last post from the previous page). |
| `category`| string | No | `null` | Filter posts by category slug (e.g. `engineering`). |
| `tag` | string | No | `null` | Filter posts by tag slug (e.g. `react`). |
| `author` | string | No | `null` | Filter posts by author slug (e.g. `alex-smith`). |
| `search` | string | No | `null` | Keyword search across titles and content. |

### Example Request

```bash
curl -X GET "https://your-openpost-domain.com/api/v1/posts?limit=5&category=engineering" \
  -H "X-OpenPost-Token: op_sec_your_token_here"
```

### Example Response (`200 OK`)

```json
{
  "data": [
    {
      "id": "7b8e1a2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
      "title": "Optimizing Next.js 16 with OpenPost CMS",
      "slug": "optimizing-nextjs-16-with-openpost",
      "publishedAt": "2026-09-01T10:00:00.000Z",
      "wordCount": 1240,
      "readingTime": 5,
      "featuredImage": {
        "id": "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b",
        "url": "https://media.yourdomain.com/Openpost-images/featured-header.webp",
        "altText": "Next.js banner graphic"
      },
      "category": {
        "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
        "name": "Engineering",
        "slug": "engineering"
      },
      "tags": [
        { "id": "t1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c", "name": "Performance", "slug": "performance" },
        { "id": "t2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d", "name": "Next.js", "slug": "nextjs" }
      ],
      "authors": [
        {
          "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "name": "Devasish Pal",
          "slug": "devasish-pal",
          "photoUrl": "https://media.yourdomain.com/Openpost-images/avatar-devasish.webp"
        }
      ]
    }
  ],
  "pagination": {
    "nextCursor": "7b8e1a2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
    "hasMore": false,
    "limit": 5
  }
}
```

---

## 2. Get Single Post by Slug

`GET /api/v1/posts/:slug`

Retrieves a single published post by its unique URL slug, including the complete ProseMirror JSON AST content blocks and SEO metadata.

### Path Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `slug` | string | **Yes** | Unique post slug (e.g. `optimizing-nextjs-16-with-openpost`). |

### Example Request

```bash
curl -X GET "https://your-openpost-domain.com/api/v1/posts/optimizing-nextjs-16-with-openpost" \
  -H "X-OpenPost-Token: op_sec_your_token_here"
```

### Example Response (`200 OK`)

```json
{
  "id": "7b8e1a2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
  "title": "Optimizing Next.js 16 with OpenPost CMS",
  "slug": "optimizing-nextjs-16-with-openpost",
  "status": "published",
  "publishedAt": "2026-09-01T10:00:00.000Z",
  "updatedAt": "2026-09-01T14:30:00.000Z",
  "wordCount": 1240,
  "readingTime": 5,
  "seo": {
    "metaTitle": "Optimizing Next.js 16 with OpenPost CMS",
    "metaDescription": "Learn how to integrate OpenPost headless CMS with Next.js 16 App Router for sub-100ms load times.",
    "canonicalUrl": "https://yourdomain.com/blog/optimizing-nextjs-16-with-openpost",
    "ogImage": "https://media.yourdomain.com/Openpost-images/featured-header.webp"
  },
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Introduction" }]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "In this guide, we explore how OpenPost provides structured JSON content..." }
        ]
      },
      {
        "type": "callout",
        "attrs": { "type": "tip" },
        "content": [
          { "type": "text", "text": "Always use Next.js fetch cache with revalidate: 60 for optimal edge performance." }
        ]
      }
    ]
  },
  "category": {
    "name": "Engineering",
    "slug": "engineering"
  },
  "tags": [
    { "name": "Next.js", "slug": "nextjs" }
  ],
  "authors": [
    {
      "name": "Devasish Pal",
      "slug": "devasish-pal",
      "bio": "Full-stack developer and open source enthusiast."
    }
  ]
}
```

---

## 3. Create a New Post

`POST /api/blogs`

Creates a new blog post in draft or published status. Requires authentication with `WRITER`, `EDITOR`, or `ADMIN` role.

### Request Body (`application/json`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | string | **Yes** | Post title (1 to 255 characters). |
| `slug` | string | No | Optional custom slug. Auto-generated from title if omitted. |
| `content` | object (JSON) | No | ProseMirror JSON document tree. |
| `status` | string | No | `draft`, `published`, `scheduled`, or `archived` (default: `draft`). |
| `categoryId` | string (UUID) | No | Category ID. |
| `tagIds` | array of UUIDs | No | Array of tag IDs to link. |
| `authorIds` | array of UUIDs | No | Array of author IDs to associate. |
| `featuredImageId` | string (UUID)| No | Media asset ID for the hero image. |
| `seo` | object | No | Object containing `metaTitle`, `metaDescription`, `ogImage`. |

### Example Request

```bash
curl -X POST "https://your-openpost-domain.com/api/blogs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer op_sec_your_token_here" \
  -d '{
    "title": "Building Modern Headless Web Apps",
    "status": "draft",
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Draft content here..." }]
        }
      ]
    }
  }'
```

---

## 4. Update an Existing Post

`PUT /api/blogs/:id`

Updates the content, metadata, or status of an existing post.

### Example Request

```bash
curl -X PUT "https://your-openpost-domain.com/api/blogs/7b8e1a2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer op_sec_your_token_here" \
  -d '{
    "title": "Building Modern Headless Web Apps (Updated)",
    "status": "published"
  }'
```

---

## 5. Delete or Move Post to Trash

`DELETE /api/blogs/:id`

Moves a post to `trash` status. Permanently deletes if already in trash.

```bash
curl -X DELETE "https://your-openpost-domain.com/api/blogs/7b8e1a2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c" \
  -H "Authorization: Bearer op_sec_your_token_here"
```

---

## 6. Restore Post from Trash

`POST /api/blogs/:id/restore`

Restores a deleted post back to `draft` status.

```bash
curl -X POST "https://your-openpost-domain.com/api/blogs/7b8e1a2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c/restore" \
  -H "Authorization: Bearer op_sec_your_token_here"
```

---

## 7. Post Revisions

### List Revisions
`GET /api/blogs/:id/revisions`

Returns all past snapshots saved for a specific post.

### Restore Revision Snapshot
`POST /api/blogs/:id/revisions/:revId/restore`

Replaces the post's current content with the specified revision snapshot.
