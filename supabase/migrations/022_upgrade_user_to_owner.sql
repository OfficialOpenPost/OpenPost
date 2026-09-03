-- ==============================================================================
-- 022 — Upgrade User to OWNER (SQL Utility / Migration)
-- ==============================================================================
-- Description:
-- Safely elevates any registered user account to 'OWNER' role and 'approved' status.
-- Automatically links them to the default project (or all existing projects) as OWNER.
--
-- HOW TO USE IN SUPABASE SQL EDITOR:
-- 1. Replace 'admin@example.com' below with the target user's email.
-- 2. Run this script in the Supabase SQL Editor.
-- ==============================================================================

DO $$
DECLARE
  target_email TEXT := 'admin@example.com'; -- <<< CHANGE THIS TO YOUR USER EMAIL
  target_user_id UUID;
  default_proj_id UUID;
BEGIN
  -- 1. Locate the user ID from auth.users (or profiles)
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = lower(target_email)
  LIMIT 1;

  IF target_user_id IS NULL THEN
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE lower(email) = lower(target_email)
    LIMIT 1;
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email "%" was not found in auth.users or profiles. Please sign up on the login/signup page first.', target_email;
  END IF;

  -- 2. Update public.users table with OWNER role
  INSERT INTO public.users (id, email, password_hash, name, role)
  VALUES (target_user_id, lower(target_email), '', 'Admin', 'OWNER'::user_role)
  ON CONFLICT (id) DO UPDATE
    SET role = 'OWNER'::user_role,
        email = EXCLUDED.email;

  -- 3. Update public.profiles to approved status
  INSERT INTO public.profiles (id, email, display_name, status, updated_at)
  VALUES (target_user_id, lower(target_email), 'Owner', 'approved', now())
  ON CONFLICT (id) DO UPDATE
    SET status = 'approved',
        updated_at = now();

  -- 4. Find or create a default project
  SELECT id INTO default_proj_id
  FROM public.projects
  ORDER BY created_at ASC
  LIMIT 1;

  IF default_proj_id IS NULL THEN
    INSERT INTO public.projects (id, name, slug, description, owner_id)
    VALUES (gen_random_uuid(), 'Default Project', 'default-project', 'Primary workspace', target_user_id)
    RETURNING id INTO default_proj_id;
  END IF;

  -- 5. Add or upgrade user as OWNER in project_members
  INSERT INTO public.project_members (project_id, user_id, role, created_at)
  SELECT p.id, target_user_id, 'OWNER'::user_role, now()
  FROM public.projects p
  ON CONFLICT (project_id, user_id) DO UPDATE
    SET role = 'OWNER'::user_role;

  -- 6. Insert an audit log record
  INSERT INTO public.audit_logs (id, actor_id, project_id, action, target_id, metadata, created_at)
  VALUES (
    gen_random_uuid(),
    target_user_id,
    default_proj_id,
    'user.upgraded_to_owner',
    target_user_id::text,
    jsonb_build_object('email', target_email, 'role', 'OWNER', 'status', 'approved'),
    now()
  );

  RAISE NOTICE 'SUCCESS: % is now an APPROVED OWNER on all projects!', target_email;
END $$;
