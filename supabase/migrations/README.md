# Supabase Migrations — Run one by one

1. Open Supabase Dashboard → SQL Editor → New query
2. Run each file **in order** `001` → `010` (copy-paste, Run)
3. Check “Success” then next file. RLS is enabled per table — see notes below.

| File | What it does |
|------|--------------|
| `001_extensions_enums.sql` | `pgcrypto`, `uuid-ossp`, 5 enums |
| `002_users.sql` | `users` + `update_updated_at()` |
| `003_categories_tags.sql` | `categories` (single-level parent) + `tags` |
| `004_authors.sql` | `media` + `authors` (photo FK) |
| `005_blogs.sql` | `blogs` + `blog_revisions` + `redirects` + `settings` |
| `006_blog_relations.sql` | `blog_tags`, `blog_authors`, `media_usage` |
| `007_polls.sql` | `polls`, `poll_options`, `poll_votes` (fingerprint unique) |
| `008_webhooks.sql` | `webhooks` + `webhook_deliveries` (Sanity-like) |
| `009_fts_search.sql` | `search_vector` tsvector + GIN index + `search_blogs()` helper |
| `010_storage_rls.sql` | Notes for R2 vs Supabase Storage (no-op if using R2) |

## RLS Summary

- **Public read:** `blogs` (only `published`), `categories`, `tags`, `authors`, `media`, `redirects`, `polls/options` — for headless API
- **Authenticated write:** `categories/tags/authors/blogs/media/polls/webhooks` — `auth.role()='authenticated'`
- **Votes:** public can `insert` into `poll_votes` (unique `poll_id+voter_fingerprint` prevents double vote, rate limit in API)
- **Users:** `users_self_read` via `auth.uid()`, admin via JWT role; `service_role` bypasses RLS (used by `src/lib/db.ts` with `DATABASE_URL` pooler)
- **Storage:** R2 uses presigned URLs (`src/lib/storage.ts`); if using Supabase Storage `media` bucket, see `010` comments

## After running

```bash
# Verify
npx prisma db pull # introspect
npx prisma generate

# Test RLS
# As anon: should see only published blogs
# As authenticated (log in at /login): should see drafts + published
```

## Supabase Auth

If using Supabase Auth (recommended), `users` table is optional — you can sync `auth.users` → `users` via trigger, or just use `auth.uid()` directly. Current API uses `created_by uuid` — set to `auth.uid()` in `src/app/api/blogs/route.ts:24`.
