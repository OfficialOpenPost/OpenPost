-- 009 — Full-text search (Postgres FTS, PRD §25) + helper functions
-- Uses tsvector on blogs.title + blogs.content (JSONB text extraction)

-- Add generated tsvector column for fast search (optional, or use expression index)
alter table blogs add column if not exists search_vector tsvector;

-- Function to build tsvector from blog row
create or replace function blogs_search_vector_update() returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.slug, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.content::text, '')), 'C');
  return new;
end;
$$ language plpgsql;

drop trigger if exists blogs_search_vector_trigger on blogs;
create trigger blogs_search_vector_trigger
  before insert or update of title, slug, content on blogs
  for each row execute function blogs_search_vector_update();

-- Backfill existing rows
update blogs set search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(slug, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(content::text, '')), 'C')
where search_vector is null;

-- GIN index
create index if not exists blogs_search_vector_idx on blogs using gin (search_vector);

-- Helper: search query
create or replace function search_blogs(q text, status_filter post_status default null, limit_n int default 10, cursor_id uuid default null)
returns setof blogs as $$
begin
  return query
  select * from blogs
  where (q is null or search_vector @@ plainto_tsquery('english', q))
    and (status_filter is null or status = status_filter)
    and (cursor_id is null or updated_at < (select updated_at from blogs where id = cursor_id))
  order by updated_at desc
  limit limit_n;
end;
$$ language plpgsql stable;

comment on index blogs_search_vector_idx is 'FTS for dashboard search — debounced 300ms, GIN indexed (PRD §25).';
