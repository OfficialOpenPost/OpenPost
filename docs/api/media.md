# Media & Presign API Reference

Upload, manage, and optimize media files stored in Cloudflare R2 with automatic WebP conversion and SHA-256 deduplication.

---

## 1. Direct Server Upload

`POST /api/media/upload`

Uploads an image file (`multipart/form-data`) directly to Cloudflare R2 storage, generates WebP variants, calculates dimensions (`width`, `height`), and saves the media record in the database.

### Request Format
- Header: `Content-Type: multipart/form-data`
- Body: `file` (binary payload)

### Example Request (cURL)

```bash
curl -X POST "https://your-openpost-domain.com/api/media/upload" \
  -H "Authorization: Bearer op_sec_your_token_here" \
  -F "file=@/path/to/image.png"
```

### Example Response (`200 OK`)

```json
{
  "id": "m1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d",
  "url": "https://media.yourdomain.com/Openpost-images/1709849204-header.webp",
  "originalFilename": "image.png",
  "mimeType": "image/webp",
  "sizeBytes": 142850,
  "width": 1920,
  "height": 1080,
  "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "variants": {
    "thumbnail": "https://media.yourdomain.com/Openpost-images/1709849204-header-thumb.webp",
    "medium": "https://media.yourdomain.com/Openpost-images/1709849204-header-med.webp"
  }
}
```

---

## 2. Generate Presigned Upload URL

`POST /api/media/presign`

For large uploads (e.g. video files, PDFs, high-res assets), generate a presigned S3 upload URL so the browser can upload directly to Cloudflare R2 without passing through the Next.js server.

### Request Body

```json
{
  "filename": "annual-report-2026.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 4820192
}
```

### Example Request

```bash
curl -X POST "https://your-openpost-domain.com/api/media/presign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer op_sec_your_token_here" \
  -d '{
    "filename": "annual-report-2026.pdf",
    "contentType": "application/pdf"
  }'
```

### Example Response (`200 OK`)

```json
{
  "uploadUrl": "https://your-r2-account-id.r2.cloudflarestorage.com/openpost-media/Openpost-images/report.pdf?X-Amz-Algorithm=...",
  "publicUrl": "https://media.yourdomain.com/Openpost-images/report.pdf",
  "key": "Openpost-images/report.pdf"
}
```

---

## 3. List Media Assets

`GET /api/media`

Returns a paginated list of all media uploaded for the current project, including post usage references.

### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `limit` | integer | No | Number of media items (default: `20`). |
| `page` | integer | No | Page number (default: `1`). |
| `mimeType` | string | No | Filter by type (e.g. `image/webp`, `application/pdf`). |

### Example Request

```bash
curl -X GET "https://your-openpost-domain.com/api/media?limit=10" \
  -H "Authorization: Bearer op_sec_your_token_here"
```

---

## 4. Delete Media Asset

`DELETE /api/media/:id`

Deletes the media file from Cloudflare R2 and removes its database entry.

```bash
curl -X DELETE "https://your-openpost-domain.com/api/media/m1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d" \
  -H "Authorization: Bearer op_sec_your_token_here"
```
