# Media & Storage Documentation

OpenPost uses Cloudflare R2 for media storage with a secure upload pipeline, magic bytes validation, checksum deduplication, and WebP conversion.

## Cloudflare R2 Setup

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 API token secret |
| `R2_BUCKET_NAME` | Yes | R2 bucket name |
| `R2_ENDPOINT` | No | Auto-generated as `https://<accountId>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | No | Public bucket URL (defaults to `https://<bucket>.r2.dev`) |

### S3 Client

The S3 client is initialized in `src/lib/storage.ts:13-36` using `@aws-sdk/client-s3` with `forcePathStyle: true` and `region: "auto"` (required for R2). The client is cached in `cachedS3Client` for reuse across requests.

---

## Upload Flow

### 1. Client-Side: WebP Conversion

`src/lib/uploadMedia.ts:5-33` — `uploadImageWithWebP()`:

1. Receives a `File` object from the editor
2. Converts to WebP at 82% quality via `convertToWebP()` (`src/lib/imageConvert.ts`)
3. POSTs the converted file to `/api/media/upload` as `FormData`
4. Includes `projectId` from localStorage (`openpost_active_project_id`)
5. Returns `{ url, key, webpFile }` — the public URL is immediately usable

### 2. Server-Side: Direct Upload to R2

`src/app/api/media/route.ts:78-163` — `POST /api/media`:

The server receives the uploaded file and:

1. **Validates permissions** — requires `CONTRIBUTOR` role + `media.upload` permission
2. **Generates server-side key** — `openpost-media/<projectId>/<timestamp>-<uuid>.<ext>` (client-supplied key is ignored to prevent path traversal)
3. **Computes SHA-256 checksum** — server-generated, not trusted from client
4. **Validates MIME type** against allowlist
5. **Stores metadata** in the `media` Prisma model with `sizeBytes` as `BigInt`

### 3. Presigned URL Flow (Alternative)

`src/lib/storage.ts:44-59` — `getSignedUploadUrl()`:

Generates a presigned PUT URL for direct browser-to-R2 uploads (bypasses server for large files). Default expiry: 3600 seconds.

```ts
const url = await getSignedUploadUrl(key, contentType, 3600);
// Browser uploads directly to R2 via PUT
```

---

## Magic Bytes Validation

`src/lib/storage.ts:108-189` — `validateMagicBytes(buffer, mimeType)`:

Validates the actual file content against the declared MIME type to prevent polyglot/executable upload attacks.

| MIME Type | Magic Bytes | Pattern |
|-----------|-------------|---------|
| `image/jpeg` | `FF D8 FF` | 3-byte JPEG SOI marker |
| `image/png` | `89 50 4E 47` | 4-byte PNG signature (`\x89PNG`) |
| `image/gif` | `47 49 46 38` | 4-byte GIF header (`GIF8`) |
| `image/webp` | RIFF...WEBP | RIFF header at 0-3, WEBP at 8-11 |
| `image/avif` | `ftypavif` | Brand string at bytes 4-12 (also `ftypavis`, `ftypmif1`) |
| `application/pdf` | `25 50 44 46` | 4-byte PDF header (`%PDF`) |
| `video/mp4` | `ftyp` | Brand string at bytes 4-8 |
| `image/svg+xml` | XML text | Contains `<svg` + dangerous pattern scan |

### SVG Security Scan

SVGs undergo additional security checks (`storage.ts:147-172`):
- Must contain `<svg` tag
- **Blocked patterns:** `<script>`, event handlers (`onload=`, `onerror=`, `onclick=`, etc.), `<foreignObject>`, `<animate>`, `<set>`, `<embed>`, `<object>`, `<applet>`, `<meta>`, `javascript:` hrefs, `data:` URIs (non-image)

---

## SHA-256 Checksum Dedup

The server generates a SHA-256 hash for each upload (`src/app/api/media/route.ts:110-112`):

```ts
const checksum = crypto.createHash("sha256")
  .update(`${originalFilename}:${Date.now()}:${crypto.randomUUID()}`)
  .digest("hex");
```

If a valid 64-character hex checksum is provided by the client, it is used. Otherwise a server-side hash is generated. The `checksum` field is stored on the `media` model for deduplication lookups.

---

## WebP Conversion Pipeline

`src/lib/uploadMedia.ts:7` calls `convertToWebP(file, 0.82)` before upload:

1. Takes the original `File` object
2. Converts to WebP format at 82% quality
3. Returns a new `File` with `type: "image/webp"`
4. The WebP file is what gets uploaded to R2

Benefits:
- 25-35% smaller file sizes vs JPEG at equivalent quality
- Browser-native decoding (no server-side processing needed)
- Single format to serve — reduces storage costs

---

## Key Format

**Pattern:** `openpost-media/<projectId>/<timestamp>-<uuid>.<ext>`

```
openpost-media/proj_abc123/1705312456789-a1b2c3d4-e5f6-7890-abcd-ef1234567890.webp
```

- **Prefix:** `openpost-media/` — namespace for all media
- **Project ID:** Scopes media to a specific project (multi-tenancy)
- **Timestamp:** Unix epoch ms for sorting
- **UUID:** Unique identifier to prevent collisions
- **Extension:** Derived from original filename, sanitized to `[a-z0-9]`

The key is always server-generated — client-supplied keys are ignored to prevent:
- Path traversal (`../../etc/passwd`)
- Cross-project overwrite (writing to another project's namespace)
- Filename collisions

---

## Public URL Format

`src/lib/storage.ts:38-42` — `getPublicUrl(key)`:

```
https://<bucket-name>.r2.dev/openpost-media/<projectId>/<uuid>.<ext>
```

If `R2_PUBLIC_URL` is set, uses that as the base. Otherwise falls back to `https://<bucket>.r2.dev`. If neither is configured, returns `/<key>` (relative path).

---

## Media Library API

### List Media

```
GET /api/media?projectId=<id>&search=<query>&limit=50
```

**Headers:** `X-OpenPost-Project: <projectId>` (alternative to query param)

**Response** (`src/app/api/media/route.ts:38-68`):
```json
{
  "data": [
    {
      "id": "uuid",
      "originalFilename": "hero.webp",
      "mimeType": "image/webp",
      "sizeBytes": 125000,
      "width": 1920,
      "height": 1080,
      "altTextDefault": "Hero image",
      "url": "https://r2.dev/openpost-media/...",
      "variants": { "publicUrl": "...", "webp": { "url": "...", "key": "...", "size": 125000 } },
      "usedIn": ["blog-post-uuid-1", "blog-post-uuid-2"]
    }
  ]
}
```

Includes `usedIn` array showing which blog posts reference the media item (via `media_usage` join table).

### Create Media Record

```
POST /api/media
```

**Body:**
```json
{
  "originalFilename": "photo.webp",
  "mimeType": "image/webp",
  "sizeBytes": 125000,
  "width": 1920,
  "height": 1080,
  "key": "openpost-media/<projectId>/<uuid>.webp",
  "publicUrl": "https://r2.dev/...",
  "altTextDefault": "Description",
  "checksum": "sha256-hex",
  "projectId": "uuid"
}
```

**Validation:** MIME type must be in allowlist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`, `image/avif`, `application/pdf`, `video/mp4`.

---

## Image Attributes in Editor

The `Image` block (`src/components/editor/blocks/Image.ts`) extends Tiptap's base image with additional attributes. The `ImageCardView` React component provides a full UI for configuring:

| Category | Attributes |
|----------|-----------|
| **Basic** | `src`, `alt`, `title`, `caption`, `captionAlign` |
| **Layout** | `layout` (center/left/right/wide/inline), `float` (none/left/right), `width` |
| **Styling** | `borderWidth`, `borderStyle`, `borderColor`, `borderRadius`, `shadow` (none/sm/md/lg/xl), `opacity`, `rotation` |
| **Link** | `link` (URL), `openLinkInNewTab`, `isDecorative` |

These 30+ attributes are rendered in `SharedRender` (`src/components/render/SharedRender.tsx:404-503`) with responsive behavior:
- **Mobile viewport:** Always centered, full-width, no float
- **Desktop viewport:** Float left/right with matched proportions, max-width constraints
- **Wide layout:** Full-width with clear-both
- **Inline layout:** inline-block with margin

---

## File Cleanup

`src/lib/storage.ts:85-103` — `deleteObject(key)`:

Removes objects from R2. Called when media records are deleted. Errors are logged but don't throw (fail-safe cleanup). The `media` record is deleted from the database, and the R2 object is removed asynchronously.

---

## Security Considerations

1. **No client-trusted keys** — server always generates the storage key
2. **Magic bytes validation** — prevents polyglot/executable uploads
3. **SVG sanitization** — blocks scripts, event handlers, foreign objects, animations
4. **SHA-256 checksums** — server-computed, not client-trusted
5. **MIME allowlist** — only approved types accepted
6. **Project scoping** — media is namespaced per project, preventing cross-project access
7. **Presigned URLs** — time-limited (1 hour default), scoped to specific key + content type
