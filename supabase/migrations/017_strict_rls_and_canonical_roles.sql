-- 017 — Strict Multi-Tenant RLS Policies, Canonical Role Normalization & Project Isolation
-- Safe, additive migration. Preserves all data while fixing security model to fail-closed.

-- 1. Ensure canonical uppercase roles exist in user_role enum
do $$ begin
  alter type user_role add value if not exists 'ADMIN';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type user_role add value if not exists 'EDITOR';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type user_role add value if not exists 'WRITER';
exception when duplicate_object then null;
end $$;

-- 2. Normalize legacy role values in existing tables
update project_members
set role = case
  when role::text in ('owner', 'admin', 'OWNER') then 'ADMIN'::user_role
  when role::text in ('editor') then 'EDITOR'::user_role
  when role::text in ('author', 'contributor') then 'WRITER'::user_role
  else role
end
where role::text in ('owner', 'admin', 'OWNER', 'editor', 'author', 'contributor');

update users
set role = case
  when role::text in ('owner', 'admin', 'OWNER') then 'ADMIN'::user_role
  when role::text in ('editor') then 'EDITOR'::user_role
  when role::text in ('author', 'contributor') then 'WRITER'::user_role
  else role
end
where role::text in ('owner', 'admin', 'OWNER', 'editor', 'author', 'contributor');

update invites
set role = case
  when role::text in ('owner', 'admin', 'OWNER') then 'ADMIN'::user_role
  when role::text in ('editor') then 'EDITOR'::user_role
  when role::text in ('author', 'contributor') then 'WRITER'::user_role
  else role
end
where role::text in ('owner', 'admin', 'OWNER', 'editor', 'author', 'contributor');

-- 3. Ensure composite indexes for project isolation
create index if not exists blogs_project_status_idx on blogs(project_id, status);
create index if not exists blogs_project_published_at_idx on blogs(project_id, published_at desc);
create index if not exists media_project_created_idx on media(project_id, created_at desc);
create index if not exists integrations_token_hash_active_idx on integrations(token_hash) where revoked_at is null;

-- 4. Clean up existing loose RLS policies
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table blogs enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table authors enable row level security;
alter table media enable row level security;
alter table media_usage enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table webhooks enable row level security;
alter table webhook_deliveries enable row level security;
alter table integrations enable row level security;
alter table connection_codes enable row level security;
alter table cli_auth_codes enable row level security;
alter table invites enable row level security;
alter table audit_logs enable row level security;

-- Profiles: user can read own; admins can read members of their projects
drop policy if exists "profiles_self_read" on profiles;
drop policy if exists "profiles_self_update" on profiles;
create policy "profiles_self_read" on profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from project_members my_pm
      join project_members other_pm on other_pm.project_id = my_pm.project_id
      where my_pm.user_id = auth.uid()
        and my_pm.role::text in ('ADMIN', 'owner', 'admin', 'OWNER')
        and other_pm.user_id = profiles.id
    )
  );
create policy "profiles_self_update" on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Projects: only members can read; owner or project ADMIN can update
drop policy if exists "projects_member_read" on projects;
drop policy if exists "projects_owner_write" on projects;
drop policy if exists "projects_admin_write" on projects;
create policy "projects_member_read" on projects for select
  using (
    exists (
      select 1 from project_members
      where project_members.project_id = projects.id
        and project_members.user_id = auth.uid()
    )
  );
create policy "projects_admin_write" on projects for all
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from project_members
      where project_members.project_id = projects.id
        and project_members.user_id = auth.uid()
        and project_members.role::text in ('ADMIN', 'owner', 'admin', 'OWNER')
    )
  );

-- Project Members: members can read co-members; ADMIN can manage
drop policy if exists "members_self_read" on project_members;
drop policy if exists "members_project_read" on project_members;
drop policy if exists "members_admin_manage" on project_members;
create policy "members_project_read" on project_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from project_members pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
    )
  );
create policy "members_admin_manage" on project_members for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'owner', 'admin', 'OWNER')
    )
  )
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = project_members.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'owner', 'admin', 'OWNER')
    )
  );

-- Blogs: published posts public; members access project posts by role
drop policy if exists "blogs_public_read" on blogs;
drop policy if exists "blogs_auth_read" on blogs;
drop policy if exists "blogs_member_write" on blogs;
drop policy if exists "blogs_member_select" on blogs;
drop policy if exists "blogs_member_insert" on blogs;
drop policy if exists "blogs_member_update" on blogs;
drop policy if exists "blogs_member_delete" on blogs;

create policy "blogs_public_read" on blogs for select
  using (status = 'published');

create policy "blogs_member_select" on blogs for select
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = blogs.project_id
        and pm.user_id = auth.uid()
    )
  );

create policy "blogs_member_insert" on blogs for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = blogs.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'WRITER', 'owner', 'admin', 'editor', 'author', 'contributor')
    )
  );

create policy "blogs_member_update" on blogs for update
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = blogs.project_id
        and pm.user_id = auth.uid()
        and (
          pm.role::text in ('ADMIN', 'EDITOR', 'owner', 'admin', 'editor')
          or (pm.role::text in ('WRITER', 'author', 'contributor') and blogs.created_by = auth.uid())
        )
    )
  );

create policy "blogs_member_delete" on blogs for delete
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = blogs.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'owner', 'admin', 'editor')
    )
  );

-- Categories / Tags / Authors: public read, project member write
drop policy if exists "categories_public_read" on categories;
drop policy if exists "categories_member_write" on categories;
drop policy if exists "categories_member_manage" on categories;
create policy "categories_public_read" on categories for select using (true);
create policy "categories_member_manage" on categories for all
  using (
    project_id is null
    or exists (
      select 1 from project_members pm
      where pm.project_id = categories.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'owner', 'admin', 'editor')
    )
  );

drop policy if exists "tags_public_read" on tags;
drop policy if exists "tags_member_write" on tags;
drop policy if exists "tags_member_manage" on tags;
create policy "tags_public_read" on tags for select using (true);
create policy "tags_member_manage" on tags for all
  using (
    project_id is null
    or exists (
      select 1 from project_members pm
      where pm.project_id = tags.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'owner', 'admin', 'editor')
    )
  );

drop policy if exists "authors_public_read" on authors;
drop policy if exists "authors_member_write" on authors;
drop policy if exists "authors_member_manage" on authors;
create policy "authors_public_read" on authors for select using (true);
create policy "authors_member_manage" on authors for all
  using (
    project_id is null
    or exists (
      select 1 from project_members pm
      where pm.project_id = authors.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'owner', 'admin', 'editor')
    )
  );

-- Media: public read, project member upload/delete
drop policy if exists "media_public_read" on media;
drop policy if exists "media_member_write" on media;
drop policy if exists "media_member_insert" on media;
drop policy if exists "media_member_manage" on media;
create policy "media_public_read" on media for select using (true);
create policy "media_member_insert" on media for insert
  with check (
    project_id is null
    or exists (
      select 1 from project_members pm
      where pm.project_id = media.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'WRITER', 'owner', 'admin', 'editor', 'author', 'contributor')
    )
  );
create policy "media_member_manage" on media for all
  using (
    project_id is null
    or exists (
      select 1 from project_members pm
      where pm.project_id = media.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'owner', 'admin', 'editor')
    )
  );

-- Polls: only open/closed visible to public; drafts only to project members
drop policy if exists "polls_public_read" on polls;
drop policy if exists "polls_member_write" on polls;
drop policy if exists "polls_member_manage" on polls;
create policy "polls_public_read" on polls for select
  using (status in ('open', 'closed'));
create policy "polls_member_manage" on polls for all
  using (
    project_id is null
    or exists (
      select 1 from project_members pm
      where pm.project_id = polls.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'owner', 'admin', 'editor')
    )
  );

-- Poll options & votes
alter table poll_options enable row level security;
drop policy if exists "poll_options_read" on poll_options;
create policy "poll_options_read" on poll_options for select using (true);

alter table poll_votes enable row level security;
drop policy if exists "poll_votes_insert" on poll_votes;
create policy "poll_votes_insert" on poll_votes for insert with check (true);

-- Integrations: members can read, ADMINs can manage
drop policy if exists "integrations_member_read" on integrations;
drop policy if exists "integrations_admin_write" on integrations;
drop policy if exists "integrations_admin_manage" on integrations;
create policy "integrations_member_read" on integrations for select
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = integrations.project_id
        and pm.user_id = auth.uid()
    )
  );
create policy "integrations_admin_manage" on integrations for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = integrations.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'owner', 'admin', 'OWNER')
    )
  );

-- Connection codes & CLI auth codes: service-role only for select
drop policy if exists "codes_read" on connection_codes;
drop policy if exists "codes_service_only" on connection_codes;
drop policy if exists "codes_member_create" on connection_codes;
create policy "codes_service_only" on connection_codes for select using (false);
create policy "codes_member_create" on connection_codes for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = connection_codes.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'WRITER', 'owner', 'admin', 'editor', 'author', 'contributor')
    )
  );

drop policy if exists "cli_codes_member" on cli_auth_codes;
drop policy if exists "cli_codes_service_only" on cli_auth_codes;
drop policy if exists "cli_codes_member_create" on cli_auth_codes;
create policy "cli_codes_service_only" on cli_auth_codes for select using (false);
create policy "cli_codes_member_create" on cli_auth_codes for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = cli_auth_codes.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'WRITER', 'owner', 'admin', 'editor', 'author', 'contributor')
    )
  );

-- Webhooks: project ADMIN manage
drop policy if exists "webhooks_member_manage" on webhooks;
create policy "webhooks_member_manage" on webhooks for all
  using (
    project_id is null
    or exists (
      select 1 from project_members pm
      where pm.project_id = webhooks.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'owner', 'admin', 'OWNER')
    )
  );

-- Audit logs: project ADMIN read
drop policy if exists "audit_member_read" on audit_logs;
create policy "audit_member_read" on audit_logs for select
  using (
    project_id is null
    or exists (
      select 1 from project_members pm
      where pm.project_id = audit_logs.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'owner', 'admin', 'OWNER')
    )
  );

comment on table profiles is '017: Normalized canonical roles ADMIN/EDITOR/WRITER and enforced strict project-scoped RLS policies';
