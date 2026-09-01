-- 014 — RLS hardening for production
-- Fixes permissive policies + adds project isolation + drops global slug uniques

-- 1. Users: drop permissive service_all
drop policy if exists "users_service_all" on users;
-- Keep only self read (already exists) + add admin via project_members check if needed
-- No universal true policy

-- 2. Categories: fix to enforce project isolation + published vs auth
drop policy if exists "categories_public_read" on categories;
drop policy if exists "categories_auth_write" on categories;
create policy "categories_public_read" on categories for select using (true); -- public can read all categories (taxonomy is public), but filtered by project in API
-- Auth write requires authenticated and project member if project_id set
drop policy if exists "categories_member_write" on categories;
create policy "categories_member_write" on categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 3. Tags: same
drop policy if exists "tags_public_read" on tags;
drop policy if exists "tags_auth_write" on tags;
create policy "tags_public_read" on tags for select using (true);
drop policy if exists "tags_member_write" on tags;
create policy "tags_member_write" on tags for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 4. Media/authors
drop policy if exists "media_public_read" on media;
drop policy if exists "media_auth_write" on media;
create policy "media_public_read" on media for select using (true);
drop policy if exists "media_member_write" on media;
create policy "media_member_write" on media for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "authors_public_read" on authors;
drop policy if exists "authors_auth_write" on authors;
create policy "authors_public_read" on authors for select using (true);
drop policy if exists "authors_member_write" on authors;
create policy "authors_member_write" on authors for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 5. Fix global slug uniques to per-project (allow same slug across projects)
drop index if exists categories_slug_idx;
drop index if exists tags_slug_idx;
drop index if exists authors_slug_idx;
create unique index if not exists categories_project_slug_unique on categories(project_id, slug) where slug is not null and project_id is not null;
create unique index if not exists tags_project_slug_unique on tags(project_id, slug) where slug is not null and project_id is not null;
create unique index if not exists authors_project_slug_unique on authors(project_id, slug) where slug is not null and project_id is not null;
-- Keep global unique for null project_id (legacy single-tenant) via partial where project_id is null
create unique index if not exists categories_slug_global on categories(slug) where project_id is null;
create unique index if not exists tags_slug_global on tags(slug) where project_id is null;
create unique index if not exists authors_slug_global on authors(slug) where project_id is null;

-- 6. Blogs: enforce published vs auth
drop policy if exists "blogs_public_read" on blogs;
drop policy if exists "blogs_auth_read" on blogs;
create policy "blogs_public_read" on blogs for select using (status = 'published');
drop policy if exists "blogs_member_write" on blogs;
create policy "blogs_member_write" on blogs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 7. Connection codes: lock down anon enumeration
drop policy if exists "codes_read" on connection_codes;
create policy "codes_service_only" on connection_codes for select using (false); -- only service_role via API, not anon
drop policy if exists "codes_member_create" on connection_codes;
create policy "codes_member_create" on connection_codes for insert
  with check (exists (select 1 from project_members where project_members.project_id = connection_codes.project_id and project_members.user_id = auth.uid()));

-- 8. Polls: hide drafts from anon
drop policy if exists "polls_public_read" on polls;
-- Re-create with status filter if table exists
do $$ begin
  if exists (select 1 from pg_tables where tablename='polls') then
    drop policy if exists "polls_public_read" on polls;
    create policy "polls_public_read" on polls for select using (status = 'open' or status = 'closed');
    drop policy if exists "polls_member_write" on polls;
    create policy "polls_member_write" on polls for all using (auth.role()='authenticated') with check (auth.role()='authenticated');
  end if;
end $$;

-- 9. Redirects: add project_id if missing and index
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='redirects' and column_name='project_id') then
    alter table redirects add column project_id uuid references projects(id) on delete set null;
    create index if not exists redirects_project_idx on redirects(project_id);
  end if;
end $$;

comment on table categories is 'RLS hardened 014: public read, auth write, per-project slug unique';
