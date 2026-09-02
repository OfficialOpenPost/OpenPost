-- 020 — CKEditor 5 structured document + rendered HTML + content version
-- Extends existing blogs/blog_revisions without destroying data
-- Reuses existing content jsonb as fallback; adds dedicated columns for CKEditor

-- Blogs: add editor_document, rendered_html, content_version if not exists
do $$ begin
  alter table blogs add column if not exists editor_document jsonb;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table blogs add column if not exists rendered_html text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table blogs add column if not exists content_version int not null default 1;
exception when duplicate_column then null;
end $$;

-- Backfill: where editor_document is null, copy from content if it looks like structured doc
update blogs
set editor_document = content,
    content_version = coalesce(schema_version, 1)
where editor_document is null;

-- Generate rendered_html for existing published posts where missing (simple fallback)
-- We store a minimal semantic HTML wrapper; full re-render will happen on next save via app
update blogs
set rendered_html = coalesce(
  rendered_html,
  case
    when content is not null and content::text != '{}'::text then
      '<article class="openpost-article">' || coalesce(title, 'Untitled') || '</article>'
    else null
  end
)
where rendered_html is null and status = 'published';

-- Blog revisions: add same columns for restore safety
do $$ begin
  alter table blog_revisions add column if not exists editor_document jsonb;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table blog_revisions add column if not exists rendered_html text;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table blog_revisions add column if not exists content_version int;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table blog_revisions add column if not exists word_count int;
exception when duplicate_column then null;
end $$;

do $$ begin
  alter table blog_revisions add column if not exists reading_time int;
exception when duplicate_column then null;
end $$;

-- Backfill revisions
update blog_revisions
set editor_document = coalesce(editor_document, content),
    content_version = coalesce(content_version, 1)
where editor_document is null;

-- Indexes for new columns (optional, for queries)
create index if not exists blogs_content_version_idx on blogs(content_version);
-- Trigram index for rendered_html search — requires pg_trgm, safe to skip if extension not available
do $$ begin
  create extension if not exists pg_trgm;
exception when others then null;
end $$;
do $$ begin
  create index if not exists blogs_rendered_html_trgm_idx on blogs using gin (rendered_html gin_trgm_ops);
exception
  when undefined_object then null;
  when others then null;
end $$;

-- Comment
comment on column blogs.editor_document is 'CKEditor 5 structured document (OpenPost article schema v1) — source of truth';
comment on column blogs.rendered_html is 'Canonical semantic HTML generated from editor_document — portable for headless rendering';
comment on column blogs.content_version is 'Content schema version for migrations (additive)';
