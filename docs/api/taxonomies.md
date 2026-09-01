# Categories & Tags API Reference

Organize your content taxonomies with hierarchical categories and flat tags.

---

## 1. Categories API

### List Categories
`GET /api/v1/categories`

Returns all categories for the project, including post counts and parent/child hierarchies.

#### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `includeCount` | boolean | No | Set to `true` to include published post count per category. |

#### Example Request

```bash
curl -X GET "https://your-openpost-domain.com/api/v1/categories?includeCount=true" \
  -H "X-OpenPost-Token: op_sec_your_token_here"
```

#### Example Response (`200 OK`)

```json
{
  "data": [
    {
      "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
      "name": "Engineering",
      "slug": "engineering",
      "description": "Technical tutorials, architecture deep dives, and system guides.",
      "parentId": null,
      "postCount": 18,
      "children": [
        {
          "id": "c2e3f4a5-b67c-8d9e-0f1a-2b3c4d5e6f7a",
          "name": "Backend",
          "slug": "backend",
          "parentId": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
          "postCount": 9
        }
      ]
    }
  ]
}
```

---

### Create a Category
`POST /api/v1/categories`

Creates a new category.

```bash
curl -X POST "https://your-openpost-domain.com/api/v1/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer op_sec_your_token_here" \
  -d '{
    "name": "Product Updates",
    "slug": "product-updates",
    "description": "Latest feature releases and changelog announcements."
  }'
```

---

### Update a Category
`PUT /api/v1/categories/:id`

Updates an existing category.

```bash
curl -X PUT "https://your-openpost-domain.com/api/v1/categories/c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer op_sec_your_token_here" \
  -d '{
    "name": "Core Engineering"
  }'
```

---

### Delete a Category
`DELETE /api/v1/categories/:id`

Deletes a category. If posts are linked to this category, their `categoryId` field will be safely set to `null`.

```bash
curl -X DELETE "https://your-openpost-domain.com/api/v1/categories/c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f" \
  -H "Authorization: Bearer op_sec_your_token_here"
```

---

## 2. Tags API

### List Tags
`GET /api/v1/tags`

Returns all tags for the current project.

#### Example Request

```bash
curl -X GET "https://your-openpost-domain.com/api/v1/tags" \
  -H "X-OpenPost-Token: op_sec_your_token_here"
```

#### Example Response (`200 OK`)

```json
{
  "data": [
    {
      "id": "t1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "name": "Performance",
      "slug": "performance",
      "description": "Articles on web speed and database optimizations.",
      "postCount": 12
    },
    {
      "id": "t2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d",
      "name": "Next.js",
      "slug": "nextjs",
      "postCount": 8
    }
  ]
}
```

---

### Create a Tag
`POST /api/v1/tags`

```bash
curl -X POST "https://your-openpost-domain.com/api/v1/tags" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer op_sec_your_token_here" \
  -d '{
    "name": "PostgreSQL",
    "slug": "postgresql"
  }'
```

---

### Delete a Tag
`DELETE /api/v1/tags/:id`

```bash
curl -X DELETE "https://your-openpost-domain.com/api/v1/tags/t1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c" \
  -H "Authorization: Bearer op_sec_your_token_here"
```
