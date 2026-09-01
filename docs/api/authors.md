# Authors API Reference

Manage author profiles, biographies, social links, and multi-author associations.

---

## 1. List Authors

`GET /api/v1/authors`

Returns all author profiles for the current project.

### Example Request

```bash
curl -X GET "https://your-openpost-domain.com/api/v1/authors" \
  -H "X-OpenPost-Token: op_sec_your_token_here"
```

### Example Response (`200 OK`)

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Devasish Pal",
      "slug": "devasish-pal",
      "bio": "Full-stack developer building modern open-source web systems.",
      "website": "https://devasish.dev",
      "email": "devasish@example.com",
      "socialLinks": {
        "twitter": "https://twitter.com/devasish",
        "github": "https://github.com/devasish",
        "linkedin": "https://linkedin.com/in/devasish"
      },
      "photo": {
        "id": "m1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d",
        "url": "https://media.yourdomain.com/Openpost-images/avatar-devasish.webp"
      },
      "postCount": 14
    }
  ]
}
```

---

## 2. Get Single Author by ID or Slug

`GET /api/v1/authors/:id`

Retrieves an author by UUID or slug.

```bash
curl -X GET "https://your-openpost-domain.com/api/v1/authors/devasish-pal" \
  -H "X-OpenPost-Token: op_sec_your_token_here"
```

---

## 3. Create an Author

`POST /api/v1/authors`

Creates a new author profile.

### Request Body

```json
{
  "name": "Sarah Connor",
  "slug": "sarah-connor",
  "bio": "Security engineer and technical writer.",
  "website": "https://sarahconnor.io",
  "socialLinks": {
    "twitter": "https://twitter.com/sarahconnor",
    "github": "https://github.com/sarahconnor"
  },
  "photoId": "m1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d"
}
```

### Example Request

```bash
curl -X POST "https://your-openpost-domain.com/api/v1/authors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer op_sec_your_token_here" \
  -d '{
    "name": "Sarah Connor",
    "slug": "sarah-connor",
    "bio": "Security engineer and technical writer."
  }'
```

---

## 4. Update an Author

`PUT /api/v1/authors/:id`

```bash
curl -X PUT "https://your-openpost-domain.com/api/v1/authors/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer op_sec_your_token_here" \
  -d '{
    "bio": "Updated biography with new projects."
  }'
```

---

## 5. Delete an Author

`DELETE /api/v1/authors/:id`

```bash
curl -X DELETE "https://your-openpost-domain.com/api/v1/authors/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" \
  -H "Authorization: Bearer op_sec_your_token_here"
```
