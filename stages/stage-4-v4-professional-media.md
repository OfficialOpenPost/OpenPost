# Stage 4 — V4: Professional Media System

## Goal

Production-grade image pipeline and media library. Any uploaded image is automatically served in an optimized, responsive, modern format without user configuration. Users can find where any asset is used before deleting it.

---

## Scope

### Upload Pipeline (Enhanced)
1. Client-side pre-check (file type/size) — UX convenience, never trusted security boundary
2. Upload to object storage via signed URL (avoids routing large binaries through app server)
3. Server-side validation:
   - Magic-byte verification (not just extension)
   - MIME allowlist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
   - SVG rejected by default (can carry embedded scripts); if enabled, strict sanitizer strips `<script>`, event handlers, external references
   - Max dimensions: 8000×8000px cap
   - Max file size: 25MB
4. Queue async processing job (return "processing" state immediately)
5. Processing worker:
   - Strip EXIF/metadata (privacy + size reduction; keep orientation-corrected pixels, discard GPS/device data)
   - Generate resized variants at breakpoints: 480px, 768px, 1200px, 1920px wide
   - Generate WebP for all variants (~25-35% smaller than JPEG/PNG)
   - Generate AVIF for largest 1-2 variants (CPU-heavier, progressive enhancement)
   - Generate small thumbnail for media library grid
6. Store all variants + metadata in `media` table
7. Editor polls/subscribes for "ready" state → swaps placeholder for final optimized asset

### Variant Purpose
| Variant | Purpose |
|---|---|
| Original | Retained for re-processing; never served directly if avoidable |
| Resized breakpoints | Enables responsive `srcset` — mobile never downloads 4000px image |
| WebP | Default served format; near-universal browser support |
| AVIF | Progressive enhancement via `<picture>` source ordering |
| Thumbnail | Fast media library grid rendering |

### Media Library UI
- Grid view (default) and list view
- Search by filename/alt text
- Filter by type (image/video/document), date, usage status
- Sort by date, size, name
- Pagination (50 items/page, never loads full library)

### Media Detail Panel
- Full metadata: dimensions, size, MIME, created date, checksum
- **Usage tracking:** "cover-photo.jpg is used in: How to Remove Backgrounds, 5 SEO Tips"
- Usage updated via `media_usage` join table on blog save (diff doc tree for asset references)

### Safe Delete
- Attempt delete on in-use asset → blocking warning modal listing every usage
- User must cancel or explicitly confirm (warning states "these posts will have broken images")
- Orphaned assets detectable and cleanable

### Image Delivery
- All served images pass through CDN
- CDN handles on-the-fly format negotiation (AVIF/WebP/JPEG based on `Accept` header) as defense-in-depth
- Responsive `srcset` always used, never single fixed-size image

### Image Bomb Protection
- Cap max pixel dimensions before full decode (where image library supports header-only inspection)
- Hard memory/time limits on processing worker
- Sandboxed worker (no ability to execute uploaded content)

---

## Database Updates (V4)

### Enhanced `media` table
```sql
ALTER TABLE media ADD COLUMN variants JSONB DEFAULT '{}';
-- variants shape: { webp: { 480: url, 768: url, ... }, avif: { 1200: url }, thumbnail: url, original: url }
ALTER TABLE media ADD COLUMN width INT;
ALTER TABLE media ADD COLUMN height INT;
ALTER TABLE media ADD COLUMN size_bytes BIGINT;
ALTER TABLE media ADD COLUMN checksum VARCHAR(64); -- indexed for dedupe
```

### `media_usage` table
```sql
CREATE TABLE media_usage (
  media_id UUID REFERENCES media(id),
  blog_id UUID REFERENCES blogs(id),
  PRIMARY KEY (media_id, blog_id)
);
-- Updated on blog save by diffing document tree for assetId references
```

---

## Screens

| Screen | New Components |
|---|---|
| Media Library | Grid/list toggle, search, filter (type/date/usage), sort, pagination |
| Media Detail | Metadata display, usage list, safe-delete warning modal |
| Editor Image | Processing state indicator, swap to optimized asset on ready |
| Settings (Media) | Processing defaults, storage provider config |

---

## Acceptance Criteria

1. Any uploaded image is automatically served in WebP format by default.
2. AVIF served as progressive enhancement where browser supports it.
3. Responsive `srcset` generated with 4+ breakpoints (480/768/1200/1920px).
4. Thumbnails generated for fast library grid rendering.
5. Upload validation rejects: wrong MIME, oversized files, dimension bombs, SVG (by default).
6. EXIF/metadata stripped; GPS/device data discarded.
7. Media library search finds assets by filename or alt text.
8. Media library filter works by type, date, and usage status.
9. Usage tracking shows which posts reference each asset.
10. Deleting an in-use asset triggers blocking warning with list of posts.
11. Editor shows "processing" state while image variants are generated.
12. Images lazy-loaded below the fold on public frontend.
13. CDN serves format-negotiated variant based on Accept header.
14. Media library paginates at 50 items; never loads full library into memory.
15. Processing worker is sandboxed (cannot execute uploaded content).

---

## Technical Notes

- **Worker isolation:** Image processing runs in separate containerized worker, NOT in serverless web tier
- **Queue:** Postgres-backed (pgboss) or Redis-backed (BullMQ)
- **CDN:** Cloudflare R2 (or S3-compatible) with CDN layer for format negotiation
- **Sharp/Image processing library:** Use for resize, WebP/AVIF generation, metadata stripping
- **Memory limits:** Cap worker memory; decompression bomb protection via header-only inspection
- **Dedupe:** Checksum-based duplicate detection; reuse existing variants on upload of identical file

---

## Deliverables

- [ ] Enhanced upload pipeline with server-side validation
- [ ] Image processing worker (resize, WebP, AVIF, thumbnail, metadata strip)
- [ ] Queue integration for async processing
- [ ] Media library UI (grid/list, search, filter, sort, paginate)
- [ ] Media detail panel with metadata + usage tracking
- [ ] Media usage tracking (update on blog save)
- [ ] Safe-delete warning modal
- [ ] Responsive `srcset` generation
- [ ] CDN integration with format negotiation
- [ ] Image bomb protection (memory/dimension limits)
- [ ] SVG sanitization (if enabled)
- [ ] Settings page for media/processing configuration
- [ ] Editor processing state indicator

---

## Dependencies

- Stage 3 (V3 Advanced Blocks) complete
- Background worker infrastructure (separate from web tier)
- Object storage (R2/S3) with CDN
- Sharp or equivalent image processing library installed in worker
