-- 018 — Assign Legacy Unassigned Blogs & Taxonomies to Default Project
-- Fixes cross-project leak of legacy content where project_id is NULL.

-- 1. Ensure at least one default project exists if none present
DO $$
DECLARE
  default_proj_id uuid;
  first_user_id uuid;
BEGIN
  -- Get first project ID if exists
  SELECT id INTO default_proj_id FROM projects ORDER BY created_at ASC LIMIT 1;

  -- If no project exists, create one
  IF default_proj_id IS NULL THEN
    SELECT id INTO first_user_id FROM users ORDER BY created_at ASC LIMIT 1;
    IF first_user_id IS NOT NULL THEN
      INSERT INTO projects (name, slug, description, owner_id)
      VALUES ('Main Publication', 'main-publication', 'Default primary publication', first_user_id)
      RETURNING id INTO default_proj_id;

      INSERT INTO project_members (project_id, user_id, role)
      VALUES (default_proj_id, first_user_id, 'ADMIN'::user_role)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- 2. Backfill any blogs with NULL project_id to the primary project
  IF default_proj_id IS NOT NULL THEN
    UPDATE blogs
    SET project_id = default_proj_id
    WHERE project_id IS NULL;

    UPDATE categories
    SET project_id = default_proj_id
    WHERE project_id IS NULL;

    UPDATE tags
    SET project_id = default_proj_id
    WHERE project_id IS NULL;

    UPDATE authors
    SET project_id = default_proj_id
    WHERE project_id IS NULL;

    UPDATE media
    SET project_id = default_proj_id
    WHERE project_id IS NULL;

    UPDATE polls
    SET project_id = default_proj_id
    WHERE project_id IS NULL;
  END IF;
END $$;

COMMENT ON TABLE blogs IS '018: Assigned legacy unassigned posts and taxonomies to default primary project for strict multi-tenant isolation';
