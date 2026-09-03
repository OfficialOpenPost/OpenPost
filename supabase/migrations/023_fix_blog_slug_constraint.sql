-- ==============================================================================
-- 023 — Fix Blog Slug Constraint (Multi-tenant scoped uniqueness)
-- ==============================================================================
-- Description:
-- Drops legacy global UNIQUE(slug) table constraint on 'blogs' if present,
-- ensuring slug uniqueness is properly scoped per project (project_id, slug).
-- ==============================================================================

-- 1. Drop global table constraints on slug
ALTER TABLE public.blogs DROP CONSTRAINT IF EXISTS blogs_slug_key;
ALTER TABLE public.blogs DROP CONSTRAINT IF EXISTS blogs_slug_unique;

-- 2. Ensure project-scoped unique index exists
DROP INDEX IF EXISTS blogs_slug_idx;
CREATE UNIQUE INDEX IF NOT EXISTS blogs_project_slug_unique 
  ON public.blogs(project_id, slug) 
  WHERE slug IS NOT NULL;

-- 3. Also ensure unique slug per project on categories, tags, authors
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS categories_project_slug_unique 
  ON public.categories(project_id, slug) 
  WHERE slug IS NOT NULL;

ALTER TABLE public.tags DROP CONSTRAINT IF EXISTS tags_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS tags_project_slug_unique 
  ON public.tags(project_id, slug) 
  WHERE slug IS NOT NULL;
