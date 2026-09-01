# Stage 2 — V2: Blog Management & Publishing

## Goal

Turn the editor into a CMS. Add the dashboard, content states, organization, SEO metadata, and scheduling. A user can organize 50+ posts, find any post in under 5 seconds, and schedule a post to auto-publish reliably.

---

## Scope

### Dashboard
- Primary nav: Dashboard, Blogs (Drafts / Published / Scheduled / Trash as filtered views), Media, Categories, Tags, Authors, Settings
- Dashboard home: total/published/draft/scheduled counts, recently edited, recently published, aggregate word count, content-activity feed
- Blog list: table view with title, status, author, category, tags, published date, word count, reading time
- Filters: status, category, tag, author
- Search: debounced (300ms), full-text on title/content/slug
- Sort: newest, oldest, title, last updated
- Pagination: cursor-based
- Bulk actions: delete (move to trash), change status

### Content States & Transitions
| From | To | Trigger |
|---|---|---|
| Draft | Published | User clicks Publish |
| Draft | Scheduled | User picks future date/time |
| Scheduled | Published | Background job at scheduled time |
| Published | Draft | User clicks Unpublish |
| Published | Trash | User deletes |
| Trash | Restored | User restores within 30-day window |
| Trash | Permanently deleted | Retention expires or admin force-deletes |

### Categories
- Create, edit, delete categories
- Fields: name, slug (unique), description, parent_id (single-level nesting only)
- SEO metadata per category (title/description for archive pages)
- Assign category to post (one primary category per post)

### Tags
- Create, edit, delete tags
- Fields: name, slug (unique), description
- Assign multiple tags to post
- Flat, no hierarchy

### Authors
- Create, edit, delete author profiles
- Fields: name, slug (unique), bio, profile photo (from media library), social links, website, email (internal)
- Link author profile to user account (nullable — guest bylines possible)
- Multi-author support via `blog_authors` join table (sort order)
- One primary author per post + optional co-authors

### Featured Image
- Set/change featured image from media library or upload
- Display in editor and on public post

### SEO Panel (Tabbed Inspector)
- **SEO tab:** SEO title, meta description, URL slug (manual override), canonical URL, robots directives (index/noindex, follow/nofollow)
- **OG tab:** OG title, OG description, OG image
- **Twitter tab:** Card type, title, description, image
- **Warnings (non-blocking, advisory):**
  - Missing/too-long SEO title (~60 char soft limit)
  - Missing/too-long meta description (~155 char soft limit)
  - Missing featured image / missing OG image
  - Images missing alt text
  - Missing or multiple H1s
  - No internal links detected
- **Disclaimer in UI:** "Structural best-practice checks, not a ranking guarantee"

### Inspector Tabs
- SEO | Organize (category/tags) | Featured Image | Publishing | History
- Tabbed to reduce clutter vs. stacked sections

### Scheduled Publishing
- Date/time picker (respects user timezone)
- Background job polls for due scheduled posts → publishes automatically
- Notification confirms publish

### Slug System
- Auto-generated from title (lowercased, transliterated, hyphenated, stripped special chars)
- Live-updates while title changes until user manually edits slug
- Duplicate slugs: unique constraint at DB level, auto `-2`, `-3` suffix in UI
- Slug change on published post → auto-creates redirect record (old_slug → new_slug, HTTP 301)

### Revision History (Progressive)
- Lightweight autosave snapshots: retained for rolling window (last 20 or 24h)
- Meaningful checkpoints: every Publish, manual "Save version", hourly during active editing
- Retention: last 50 checkpoints or 90 days
- UI: History panel lists checkpoints with timestamp + author + label
- Select revision → preview → "Restore" loads into current draft (not instant overwrite of published)
- Diff/compare: word-count delta + "N blocks changed" summary (best-effort, not full visual diff)

### Trash & Restore
- 30-day retention window (configurable in Settings)
- Trash view shows posts with delete date
- Restore button returns to previous status
- Permanent deletion after retention expires

### Redirects
- `redirects` table: old_slug, new_slug, blog_id, created_at
- Auto-created on slug change of published post
- Frontend/API serves 301 redirect

### Word Count & Reading Time
- Calculated on save
- Displayed in editor and blog list

### Public / Private Status
- Public: visible via public API
- Private: only visible in CMS, not in public API

---

## Database Tables (New for V2)

```sql
-- categories: id, name, slug (unique), description, parent_id (fk→categories, nullable), seo (jsonb)
-- tags: id, name, slug (unique), description
-- blog_tags: blog_id, tag_id (join table)
-- authors: id, name, slug (unique), bio, photo_id (fk→media), social_links (jsonb), linked_user_id (fk→users, nullable)
-- blog_authors: blog_id, author_id, sort_order (join table)
-- media: id, original_filename, mime_type, size_bytes, width, height, variants (jsonb), alt_text_default, checksum, uploaded_by, created_at
-- media_usage: media_id, blog_id (composite unique)
-- redirects: id, old_slug, new_slug, blog_id, created_at
-- settings: key (pk), value (jsonb), updated_at
-- scheduled_posts: NOT created (redundant with blogs.status + scheduled_at)
```

### Updated `blogs` table
```sql
ALTER TABLE blogs ADD COLUMN category_id UUID REFERENCES categories(id);
ALTER TABLE blogs ADD COLUMN scheduled_at TIMESTAMPTZ;
ALTER TABLE blogs ALTER COLUMN status TYPE VARCHAR(20); -- draft/published/scheduled/archived/trash
```

---

## Screens

| Screen | Components | Actions |
|---|---|---|
| Dashboard | Stats cards, recent activity feed, quick links | View overview |
| Blog List | Table with filters, search, sort, pagination, bulk actions | Create, edit, delete, filter, search, sort |
| Editor (Enhanced) | + Inspector tabs (SEO, Organize, Featured Image, Publishing, History) | All V1 actions + set category, tags, featured image, SEO, schedule |
| Preview | Same as V1 + SEO/social card snippet preview | Preview |
| Categories | Table list, create/edit modal | CRUD categories |
| Tags | Table list, create/edit modal | CRUD tags |
| Authors | Table list, create/edit modal | CRUD authors, link to user |
| Author Detail | Profile view, linked posts | Edit profile, view authored posts |
| Settings | Sections: General, Users, Authors, Media, SEO, Publishing, API, Security, Editor, Storage | Configure CMS |
| Media Library | Grid/list view, search, filter, upload | Upload, manage, delete (with usage check) |

---

## Acceptance Criteria

1. Dashboard shows accurate counts of drafts, published, and scheduled posts.
2. Blog list supports search, filter by status/category/tag/author, sort, and pagination.
3. A user can find any post in under 5 seconds via search or filter.
4. Categories and tags can be created, assigned to posts, and used for filtering.
5. Authors can be created with profile info and assigned to posts (single or multi-author).
6. Featured image can be set and is displayed in editor and on public post.
7. SEO panel provides title, description, slug, OG, Twitter card fields with advisory warnings.
8. Scheduled publishing works: set date/time → post auto-publishes at target time via background job.
9. Slug uniqueness enforced; duplicate slugs get `-2`, `-3` suffix.
10. Slug change on published post creates a 301 redirect automatically.
11. Revision history shows meaningful checkpoints; restore loads into editor as working draft.
12. Trash holds posts for 30 days; restore returns to previous status.
13. Media library shows where each asset is used; deletion blocked with warning if in use.
14. Role-based permissions enforced server-side (Contributor cannot publish, Author can publish own only, etc.).
15. All public API endpoints serve only published content (drafts/scheduled/trashed never leak).

---

## Technical Notes

- **Background worker:** Separate from serverless web tier for image processing + scheduled publishing
- **Queue:** Postgres-backed (pgboss) or Redis-backed (BullMQ) for async jobs
- **Search:** PostgreSQL full-text search (tsvector/tsquery with GIN index)
- **Pagination:** Cursor-based for stability as content is added/removed
- **Caching:** Aggressive HTTP caching on public GETs (Cache-Control, ETag)
- **Rate limiting:** Per-API-key and per-IP on public endpoints

---

## Deliverables

- [ ] Dashboard page with stats and activity feed
- [ ] Blog list page with filters, search, sort, pagination
- [ ] Categories CRUD (model, API, UI)
- [ ] Tags CRUD (model, API, UI)
- [ ] Authors CRUD (model, API, UI)
- [ ] Blog-author join (multi-author support)
- [ ] Featured image picker in editor
- [ ] Inspector tabs (SEO, Organize, Featured Image, Publishing, History)
- [ ] SEO panel with warnings
- [ ] Slug system with uniqueness + auto-redirect on change
- [ ] Scheduled publishing (background job + date picker)
- [ ] Trash/restore with 30-day retention
- [ ] Revision history (checkpoints, restore)
- [ ] Media library page with grid/list, search, filter
- [ ] Media usage tracking (media_usage table, update on blog save)
- [ ] Settings pages (General, Users, Authors, Media, SEO, Publishing, API, Security, Editor, Storage)
- [ ] Role-based permission checks on all endpoints
- [ ] Public API: /api/v1/posts, /api/v1/posts/{slug}, /api/v1/categories, /api/v1/tags, /api/v1/authors
- [ ] Redirect handling for slug changes
- [ ] Word count + reading time calculation

---

## Dependencies

- Stage 1 (V1 Core Blog Editor) complete
- Authentication + roles system (Phase 2) complete
- Object storage configured for media uploads
- Background worker infrastructure provisioned
