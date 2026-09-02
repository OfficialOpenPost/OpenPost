-- 019 — Canonical 5-role model: OWNER / ADMIN / EDITOR / AUTHOR / CONTRIBUTOR
-- Expands user_role enum to support PRD distinction between AUTHOR and CONTRIBUTOR
-- Preserves WRITER as deprecated alias (mapped to AUTHOR) for backwards compatibility

-- 1. Add missing canonical enum values (AUTHOR, CONTRIBUTOR) — OWNER/ADMIN/EDITOR/WRITER already exist
do $$ begin
  alter type user_role add value if not exists 'AUTHOR';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type user_role add value if not exists 'CONTRIBUTOR';
exception when duplicate_object then null;
end $$;

-- Also ensure OWNER uppercase exists (added in 001, but ensure for older DBs)
do $$ begin
  alter type user_role add value if not exists 'OWNER';
exception when duplicate_object then null;
end $$;

-- 2. Normalize legacy WRITER data: keep WRITER for now, but document mapping
-- We do NOT auto-convert WRITER → AUTHOR to avoid data loss; app layer treats WRITER as AUTHOR alias.
-- New code should create AUTHOR/CONTRIBUTOR directly.

-- 3. Ensure project_members role column can accept new values — no constraint change needed, enum expanded

-- 4. Add helpful composite indexes for permission checks (if not already present)
create index if not exists project_members_user_project_idx on project_members(user_id, project_id);
create index if not exists project_members_project_role_idx on project_members(project_id, role);
create index if not exists authors_project_slug_idx on authors(project_id, slug);
create index if not exists authors_linked_user_idx on authors(linked_user_id) where linked_user_id is not null;

-- 5. Add audit_logs indexes for UI filtering
create index if not exists audit_logs_action_idx on audit_logs(action);
create index if not exists audit_logs_actor_idx on audit_logs(actor_id);

comment on type user_role is '019: Canonical 5 roles OWNER>ADMIN>EDITOR>AUTHOR>CONTRIBUTOR. WRITER retained as deprecated alias for AUTHOR.';
