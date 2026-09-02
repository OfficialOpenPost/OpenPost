-- 021 — Site config fields + remove auto-created demo project

-- 1. Remove the auto-created "Main Publication" demo project if it has NO content
-- (migration 018 auto-created it for new installs — we don't want that)
DO $$
DECLARE
  demo_proj_id uuid;
  has_content boolean;
BEGIN
  SELECT id INTO demo_proj_id
  FROM projects
  WHERE slug = 'main-publication' AND name = 'Main Publication'
  LIMIT 1;

  IF demo_proj_id IS NOT NULL THEN
    -- Check if it has any real content
    SELECT EXISTS (
      SELECT 1 FROM blogs WHERE project_id = demo_proj_id
      UNION ALL
      SELECT 1 FROM categories WHERE project_id = demo_proj_id
      UNION ALL
      SELECT 1 FROM tags WHERE project_id = demo_proj_id
      UNION ALL
      SELECT 1 FROM authors WHERE project_id = demo_proj_id
      UNION ALL
      SELECT 1 FROM media WHERE project_id = demo_proj_id
    ) INTO has_content;

    -- Only delete if completely empty (no blogs, no categories, no tags, no authors, no media)
    IF NOT has_content THEN
      DELETE FROM project_members WHERE project_id = demo_proj_id;
      DELETE FROM projects WHERE id = demo_proj_id;
    END IF;
  END IF;
END $$;

-- 2. Add site config columns to projects for CLI template customization
-- These fields let users configure their website appearance from the CMS
-- The CLI fetches these and injects them into the Next.js template

ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_name text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_tagline text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_description text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_logo_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_favicon_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_primary_color text DEFAULT '#FEA611';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_language text DEFAULT 'en';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_timezone text DEFAULT 'UTC';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS social_twitter text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS social_github text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS social_linkedin text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS social_youtube text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS social_instagram text;

COMMENT ON COLUMN projects.site_name IS 'Public website name shown in template header/footer/meta';
COMMENT ON COLUMN projects.site_tagline IS 'Short tagline shown below site name';
COMMENT ON COLUMN projects.site_description IS 'Longer description used in SEO meta tags';
COMMENT ON COLUMN projects.site_logo_url IS 'URL to logo image for template header';
COMMENT ON COLUMN projects.site_favicon_url IS 'URL to favicon';
COMMENT ON COLUMN projects.site_primary_color IS 'Brand accent color hex code';
COMMENT ON COLUMN projects.site_url IS 'Canonical public URL of the deployed website';
COMMENT ON COLUMN projects.site_language IS 'Default language code (en, es, fr, etc.)';
COMMENT ON COLUMN projects.site_timezone IS 'Default timezone for scheduling';
COMMENT ON COLUMN projects.social_twitter IS 'Twitter/X profile URL';
COMMENT ON COLUMN projects.social_github IS 'GitHub profile or repo URL';
COMMENT ON COLUMN projects.social_linkedin IS 'LinkedIn profile URL';
COMMENT ON COLUMN projects.social_youtube IS 'YouTube channel URL';
COMMENT ON COLUMN projects.social_instagram IS 'Instagram profile URL';
