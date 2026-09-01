-- 004 — authors (public byline, may link to users)

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  width int,
  height int,
  variants jsonb not null default '{}'::jsonb, -- {webp:{480:url}, avif:{}, thumbnail:url}
  alt_text_default text,
  checksum text not null,
  uploaded_by uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists media_checksum_idx on media (checksum);
create index if not exists media_uploaded_by_idx on media (uploaded_by);

create table if not exists authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  bio text,
  photo_id uuid references media(id) on delete set null,
  social_links jsonb not null default '{}'::jsonb,
  website text,
  email text,
  linked_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists authors_slug_idx on authors (slug);

drop trigger if exists authors_updated_at on authors;
create trigger authors_updated_at before update on authors for each row execute function update_updated_at();

-- RLS
alter table media enable row level security;
alter table authors enable row level security;

drop policy if exists "media_public_read" on media;
create policy "media_public_read" on media for select using (true);

drop policy if exists "media_auth_write" on media;
create policy "media_auth_write" on media for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authors_public_read" on authors;
create policy "authors_public_read" on authors for select using (true);

drop policy if exists "authors_auth_write" on authors;
create policy "authors_auth_write" on authors for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
