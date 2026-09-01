-- 005 — blogs (core post) + blog_revisions + redirects + settings

create table if not exists blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content jsonb not null default '{}'::jsonb,
  schema_version int not null default 1,
  status post_status not null default 'draft',
  featured_image_id uuid references media(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references users(id) on delete restrict,
  seo jsonb not null default '{}'::jsonb,
  word_count int not null default 0,
  reading_time int not null default 0
);

create index if not exists blogs_slug_idx on blogs (slug);
create index if not exists blogs_status_idx on blogs (status);
create index if not exists blogs_published_at_idx on blogs (published_at);
create index if not exists blogs_created_by_idx on blogs (created_by);
create index if not exists blogs_category_idx on blogs (category_id);

drop trigger if exists blogs_updated_at on blogs;
create trigger blogs_updated_at before update on blogs for each row execute function update_updated_at();

create table if not exists blog_revisions (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references blogs(id) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references users(id) on delete restrict,
  label text
);

create index if not exists blog_revisions_blog_created_idx on blog_revisions (blog_id, created_at);

create table if not exists redirects (
  id uuid primary key default gen_random_uuid(),
  old_slug text not null,
  new_slug text not null,
  blog_id uuid not null references blogs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists redirects_old_slug_idx on redirects (old_slug);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS
alter table blogs enable row level security;
alter table blog_revisions enable row level security;
alter table redirects enable row level security;
alter table settings enable row level security;

-- Public can READ only published blogs (headless API)
drop policy if exists "blogs_public_published" on blogs;
create policy "blogs_public_published" on blogs for select
  using (status = 'published');

-- Authenticated can read their own drafts + all published; service_role bypasses
drop policy if exists "blogs_auth_read" on blogs;
create policy "blogs_auth_read" on blogs for select
  using (auth.role() = 'authenticated');

drop policy if exists "blogs_auth_write" on blogs;
create policy "blogs_auth_write" on blogs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "revisions_auth_read" on blog_revisions;
create policy "revisions_auth_read" on blog_revisions for select
  using (auth.role() = 'authenticated');

drop policy if exists "revisions_auth_write" on blog_revisions;
create policy "revisions_auth_write" on blog_revisions for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "redirects_public_read" on redirects;
create policy "redirects_public_read" on redirects for select using (true);

drop policy if exists "redirects_auth_write" on redirects;
create policy "redirects_auth_write" on redirects for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "settings_auth" on settings;
create policy "settings_auth" on settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "settings_public_read" on settings;
create policy "settings_public_read" on settings for select using (true);
