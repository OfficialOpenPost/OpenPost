-- 003 — categories & tags (taxonomies)

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  parent_id uuid references categories(id) on delete set null, -- single-level enforced in app
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_slug_idx on categories (slug);
create index if not exists categories_parent_idx on categories (parent_id);

drop trigger if exists categories_updated_at on categories;
create trigger categories_updated_at before update on categories for each row execute function update_updated_at();

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tags_slug_idx on tags (slug);

drop trigger if exists tags_updated_at on tags;
create trigger tags_updated_at before update on tags for each row execute function update_updated_at();

-- RLS: public can read published taxonomies (for headless API), writes require auth
alter table categories enable row level security;
alter table tags enable row level security;

drop policy if exists "categories_public_read" on categories;
create policy "categories_public_read" on categories for select using (true);

drop policy if exists "categories_auth_write" on categories;
create policy "categories_auth_write" on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "tags_public_read" on tags;
create policy "tags_public_read" on tags for select using (true);

drop policy if exists "tags_auth_write" on tags;
create policy "tags_auth_write" on tags for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
