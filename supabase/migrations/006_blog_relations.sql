-- 006 — blog relations: blog_tags, blog_authors, media_usage

create table if not exists blog_tags (
  blog_id uuid not null references blogs(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (blog_id, tag_id)
);

create table if not exists blog_authors (
  blog_id uuid not null references blogs(id) on delete cascade,
  author_id uuid not null references authors(id) on delete cascade,
  sort_order int not null default 0,
  primary key (blog_id, author_id)
);

create table if not exists media_usage (
  media_id uuid not null references media(id) on delete cascade,
  blog_id uuid not null references blogs(id) on delete cascade,
  primary key (media_id, blog_id)
);

-- RLS
alter table blog_tags enable row level security;
alter table blog_authors enable row level security;
alter table media_usage enable row level security;

drop policy if exists "blog_tags_public_read" on blog_tags;
create policy "blog_tags_public_read" on blog_tags for select using (true);
drop policy if exists "blog_tags_auth_write" on blog_tags;
create policy "blog_tags_auth_write" on blog_tags for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "blog_authors_public_read" on blog_authors;
create policy "blog_authors_public_read" on blog_authors for select using (true);
drop policy if exists "blog_authors_auth_write" on blog_authors;
create policy "blog_authors_auth_write" on blog_authors for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "media_usage_public_read" on media_usage;
create policy "media_usage_public_read" on media_usage for select using (true);
drop policy if exists "media_usage_auth_write" on media_usage;
create policy "media_usage_auth_write" on media_usage for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
