# Supabase Setup — for OpenPost DB + Auth + RLS

OpenPost uses **Supabase Postgres** (with `pgcrypto`, `uuid-ossp`, `tsvector` FTS, RLS). This guide creates your own project, runs `001→016` migrations, and makes your first user admin so uploads work (`media_uploaded_by_fkey`).

## 1. Create Project

1. https://supabase.com → **New project** → name `openpost` → set DB password (copy it) → region `AP South` (or closest) → **Create** → wait 1 min.

## 2. Run Migrations (in order, <30s)

Supabase Dashboard → **SQL Editor** → **New query** → copy-paste each file in `supabase/migrations/` **in order** and **Run**:

- `001_extensions_enums.sql` → `pgcrypto`, `uuid-ossp`, `user_role`, `post_status`, `poll_*`, `profile_status` + compat `ADMIN/EDITOR/WRITER`
- `002_users.sql` → `users` + `update_updated_at()`
- `003_categories_tags.sql` → `categories` (single-level parent) + `tags`
- `004_authors.sql` → `media` + `authors`
- `005_blogs.sql` → `blogs` + `blog_revisions` + `redirects` + `settings`
- `006_blog_relations.sql` → `blog_tags`, `blog_authors`, `media_usage`
- `007_polls.sql` → `polls`, `poll_options`, `poll_votes`
- `008_webhooks.sql` → `webhooks` + `webhook_deliveries`
- `009_fts_search.sql` → `search_vector` GIN + `search_blogs()` helper
- `010_storage_rls.sql` → R2 vs Supabase Storage notes (no-op if R2)
- `011_projects_core.sql` → `profiles`, `projects`, `project_members`, `invites` + per-project `project_id` on all content
- `012_integrations_codes.sql` → `integrations`, `connection_codes`, `cli_auth_codes`
- `013_fix_role_enum_compat.sql` → ensure `ADMIN/EDITOR/WRITER` exist
- `014_rls_hardening.sql` → per-project slug uniques, lock `connection_codes`
- `015_fix_users_name.sql` → `users.name` backfill
- `016_auto_profile_on_signup.sql` → trigger `on_auth_user_created` auto-creates `profiles`/`users` as `pending`

All have `IF NOT EXISTS` — safe to re-run.

## 3. Copy Connection Strings

**Database → Connection string → Session pooler (port 5432, $0 IPv4)** → copy:
```
postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```
Encode password `@`→`%40`, `#`→`%23`.

**Project Settings → API** → copy `URL`, `anon key`, `service_role` (keep `service_role` secret).

Set in `.env`:
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

## 4. First User (so uploads don’t FK fail)

After running `016`, **sign up at `/signup`** as `you@domain.com` → then in **SQL Editor** run as `service_role`:

```sql
-- approve yourself (replace email if different)
update profiles set status='approved' where email='you@domain.com';
update users set role='admin' where email='you@domain.com';

-- or self-service for any logged-in user (no UUID needed):
-- (run while logged in as that user)
insert into profiles (id, email, display_name, status)
select auth.uid(), (auth.jwt()->>'email'), split_part((auth.jwt()->>'email'),'@',1), 'approved'
where auth.uid() is not null
on conflict (id) do update set status='approved';

insert into users (id, email, name, password_hash, role)
select auth.uid(), (auth.jwt()->>'email'), split_part((auth.jwt()->>'email'),'@',1), '', 'admin'
where auth.uid() is not null
on conflict (id) do update set role='admin';
```

Verify:
```sql
select count(*) from profiles; -- should be ≥1
select email, status from profiles;
select email, role from users;
```

## 5. Verify

```bash
git pull origin main
npx prisma generate
npm run build # must be 38/38 or 39/39
npm run dev    # http://localhost:3000
# /signup → /dashboard → /dashboard/media → drag image → R2 Openpost-images/ → 200
```

If `media_uploaded_by_fkey` still fails → you’re not `approved` or `users` row missing → run step 4 again.

For **new teammates** after you: they just `/signup` → you `Dashboard → Settings → Users → Approve` (or they run the self-service SQL above).
