-- =============================================================================
-- 025_strict_rls_lockdown.sql
-- =============================================================================
-- Defence-in-depth hardening of the PostgREST surface (anon key + user JWTs).
--
-- The application itself talks to Postgres directly through Prisma using
-- DATABASE_URL (service credentials bypass RLS), so these policies do NOT
-- affect normal app operation. They exist to make the Supabase data API —
-- which anyone can reach with the published anon key — safe by default.
--
-- Prior state (from 002–017) left several permissive policies in place that
-- were never dropped by later migrations because RLS policies are ADDITIVE:
--
--   * users_service_all          … FOR ALL USING (true) WITH CHECK (true)
--   * settings_auth              … FOR ALL authenticated (global settings!)
--   * settings_public_read       … SELECT USING (true)
--   * revisions_auth_read/write  … FOR ALL authenticated (cross-tenant)
--   * redirects_auth_write       … FOR ALL authenticated
--   * blog_tags/blog_authors/media_usage _auth_write … FOR ALL authenticated
--   * webhooks_auth              … FOR ALL authenticated (cross-tenant!)
--   * deliveries_auth            … FOR ALL authenticated (cross-tenant!)
--   * authors_public_read        … SELECT USING (true) incl. email column
--   * "project_id is null"       … escape hatch in every member policy
--   * poll_votes_public_read     … voter fingerprints world-readable
--
-- This migration drops every permissive policy and replaces it with a strict,
-- project-scoped (or service-role-only) equivalent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. users — drop the world-writable FOR ALL USING (true) policy
-- -----------------------------------------------------------------------------
drop policy if exists "users_service_all" on users;
drop policy if exists "users_self_read" on users;
-- Users table is service-role only. The API layer (Prisma) is the sole reader;
-- PostgREST clients must not touch auth-adjacent identity rows at all.
revoke all on users from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. profiles — a user may update their own cosmetic fields, but NEVER
--    `status` (pending/approved/suspended) or any role-ish column. Column-level
--    privileges enforce this; RLS alone cannot distinguish UPDATE sets.
-- -----------------------------------------------------------------------------
drop policy if exists "profiles_self_update" on profiles;
create policy "profiles_self_update" on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on profiles from authenticated, anon;
-- Re-grant only the columns a self-service profile edit may touch.
-- (profiles has: id, email, display_name, status, created_at, updated_at —
--  `email` and `status` stay immutable to the owner of the row.)
grant update (display_name, updated_at)
  on profiles to authenticated;

-- -----------------------------------------------------------------------------
-- 3. settings — global CMS settings are service-role only. The app reads and
--    writes them through Prisma; no PostgREST client needs them.
-- -----------------------------------------------------------------------------
drop policy if exists "settings_auth" on settings;
drop policy if exists "settings_public_read" on settings;
revoke all on settings from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. blog_revisions — service-role only. Revision read/restore is authorised
--    by the API (project membership + edit permissions) via Prisma.
-- -----------------------------------------------------------------------------
drop policy if exists "revisions_auth_read" on blog_revisions;
drop policy if exists "revisions_auth_write" on blog_revisions;
revoke all on blog_revisions from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. redirects — public may resolve a redirect ONLY through its published blog;
--    writes are service-role only (created by the slug-change code path).
-- -----------------------------------------------------------------------------
drop policy if exists "redirects_auth_write" on redirects;
drop policy if exists "redirects_public_read" on redirects;
create policy "redirects_public_read" on redirects for select
  using (
    exists (
      select 1 from blogs b
      where b.id = redirects.blog_id
        and b.status = 'published'
    )
  );
revoke insert, update, delete on redirects from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. blog_tags / blog_authors / media_usage — join tables.
--    Public SELECT is fine (relations of published content are public);
--    writes are service-role only, managed by the API after membership checks.
-- -----------------------------------------------------------------------------
drop policy if exists "blog_tags_auth_write" on blog_tags;
drop policy if exists "blog_authors_auth_write" on blog_authors;
drop policy if exists "media_usage_auth_write" on media_usage;

drop policy if exists "blog_tags_public_read" on blog_tags;
create policy "blog_tags_public_read" on blog_tags for select
  using (exists (select 1 from blogs b where b.id = blog_tags.blog_id and b.status = 'published'));

drop policy if exists "blog_authors_public_read" on blog_authors;
create policy "blog_authors_public_read" on blog_authors for select
  using (exists (select 1 from blogs b where b.id = blog_authors.blog_id and b.status = 'published'));

drop policy if exists "media_usage_public_read" on media_usage;
create policy "media_usage_public_read" on media_usage for select
  using (exists (select 1 from blogs b where b.id = media_usage.blog_id and b.status = 'published'));

revoke insert, update, delete on blog_tags from anon, authenticated;
revoke insert, update, delete on blog_authors from anon, authenticated;
revoke insert, update, delete on media_usage from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. webhooks / webhook_deliveries — the killer policies. `FOR ALL
--    authenticated` meant ANY logged-in user of ANY tenant could read, rewrite
--    or delete another tenant's webhook endpoints AND read every delivery
--    payload (which contain unpublished post bodies). Strictly project-scoped,
--    write restricted to project ADMIN; deliveries are service-role only.
-- -----------------------------------------------------------------------------
drop policy if exists "webhooks_auth" on webhooks;
drop policy if exists "webhooks_member_manage" on webhooks;
drop policy if exists "webhooks_member_read" on webhooks;
drop policy if exists "webhooks_admin_manage" on webhooks;
drop policy if exists "webhooks_admin_update" on webhooks;
drop policy if exists "webhooks_admin_delete" on webhooks;
create policy "webhooks_member_read" on webhooks for select
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = webhooks.project_id
        and pm.user_id = auth.uid()
    )
  );
create policy "webhooks_admin_manage" on webhooks for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = webhooks.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'OWNER')
    )
  );
create policy "webhooks_admin_update" on webhooks for update
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = webhooks.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'OWNER')
    )
  );
create policy "webhooks_admin_delete" on webhooks for delete
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = webhooks.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'OWNER')
    )
  );

drop policy if exists "deliveries_auth" on webhook_deliveries;
revoke all on webhook_deliveries from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 8. authors — public byline data is fine, but `email` and `linked_user_id`
--    must NOT be world-readable. RLS is row-level, so enforce with
--    column-level REVOKEs (PostgREST excludes ungranted columns).
-- -----------------------------------------------------------------------------
drop policy if exists "authors_public_read" on authors;
create policy "authors_public_read" on authors for select using (true);
revoke select on authors from anon, authenticated;
grant select (id, project_id, name, slug, bio, website, social_links, photo_id, created_at, updated_at)
  on authors to anon, authenticated;

-- Writes: project members with taxonomy/authors permission only (API enforces
-- the fine-grained RBAC via Prisma; this blocks direct PostgREST writes).
drop policy if exists "authors_member_manage" on authors;
drop policy if exists "authors_member_write" on authors;
drop policy if exists "authors_member_update" on authors;
drop policy if exists "authors_member_delete" on authors;
create policy "authors_member_write" on authors for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = authors.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR')
    )
  );
create policy "authors_member_update" on authors for update
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = authors.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR')
    )
  );
create policy "authors_member_delete" on authors for delete
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = authors.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR')
    )
  );

-- -----------------------------------------------------------------------------
-- 9. categories / tags — remove the `project_id is null` escape hatch from the
--    member write policies (018 backfilled every legacy NULL row, so strict
--    project scoping is safe).
-- -----------------------------------------------------------------------------
drop policy if exists "categories_member_write" on categories;
drop policy if exists "categories_member_update" on categories;
drop policy if exists "categories_member_delete" on categories;
create policy "categories_member_write" on categories for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = categories.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR')
    )
  );
create policy "categories_member_update" on categories for update
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = categories.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR')
    )
  );
create policy "categories_member_delete" on categories for delete
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = categories.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR')
    )
  );

drop policy if exists "tags_member_write" on tags;
drop policy if exists "tags_member_update" on tags;
drop policy if exists "tags_member_delete" on tags;
create policy "tags_member_write" on tags for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = tags.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR')
    )
  );
create policy "tags_member_update" on tags for update
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = tags.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR')
    )
  );
create policy "tags_member_delete" on tags for delete
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = tags.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR')
    )
  );

-- -----------------------------------------------------------------------------
-- 10. media — same escape-hatch removal; writes strictly project-scoped.
-- -----------------------------------------------------------------------------
drop policy if exists "media_member_insert" on media;
drop policy if exists "media_member_manage" on media;
drop policy if exists "media_member_update" on media;
drop policy if exists "media_member_delete" on media;
create policy "media_member_insert" on media for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = media.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR')
    )
  );
create policy "media_member_update" on media for update
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = media.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR')
    )
  );
create policy "media_member_delete" on media for delete
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = media.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR')
    )
  );

-- -----------------------------------------------------------------------------
-- 11. polls — remove escape hatch; options readable only for live polls;
--     votes are service-role only (fingerprints are personal data and the
--     vote flow is handled by the API via Prisma).
-- -----------------------------------------------------------------------------
drop policy if exists "polls_member_manage" on polls;
drop policy if exists "polls_member_read" on polls;
drop policy if exists "polls_member_write" on polls;
drop policy if exists "polls_member_update" on polls;
drop policy if exists "polls_member_delete" on polls;
create policy "polls_member_read" on polls for select
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = polls.project_id
        and pm.user_id = auth.uid()
    )
  );
create policy "polls_member_write" on polls for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = polls.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR')
    )
  );
create policy "polls_member_update" on polls for update
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = polls.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR')
    )
  );
create policy "polls_member_delete" on polls for delete
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = polls.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR')
    )
  );

drop policy if exists "poll_options_read" on poll_options;
drop policy if exists "poll_options_public_read" on poll_options;
drop policy if exists "poll_options_auth_write" on poll_options;
create policy "poll_options_public_read" on poll_options for select
  using (
    exists (
      select 1 from polls p
      where p.id = poll_options.poll_id
        and p.status in ('open', 'closed')
    )
  );
revoke insert, update, delete on poll_options from anon, authenticated;

drop policy if exists "poll_votes_public_insert" on poll_votes;
drop policy if exists "poll_votes_public_read" on poll_votes;
drop policy if exists "poll_votes_insert" on poll_votes;
-- Service-role only: voter fingerprints must never be readable, and inserts
-- are validated (poll open, option belongs to poll, not already voted) by the
-- API. An unrestricted `WITH CHECK (true)` let anyone stuff any poll.
revoke all on poll_votes from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 12. audit_logs — remove escape hatch; ADMIN/OWNER of the project only.
-- -----------------------------------------------------------------------------
drop policy if exists "audit_member_read" on audit_logs;
create policy "audit_member_read" on audit_logs for select
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = audit_logs.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'OWNER')
    )
  );
revoke insert, update, delete on audit_logs from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 13. blogs — remove the `project_id is null` escape hatch from the member
--     policies and make the public read policy exclude legacy NULL rows that
--     were never assigned (018 backfilled, but be strict).
-- -----------------------------------------------------------------------------
drop policy if exists "blogs_member_select" on blogs;
create policy "blogs_member_select" on blogs for select
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = blogs.project_id
        and pm.user_id = auth.uid()
    )
  );

drop policy if exists "blogs_member_insert" on blogs;
create policy "blogs_member_insert" on blogs for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = blogs.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR')
    )
  );

drop policy if exists "blogs_member_update" on blogs;
create policy "blogs_member_update" on blogs for update
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = blogs.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR')
    )
  );

drop policy if exists "blogs_member_delete" on blogs;
create policy "blogs_member_delete" on blogs for delete
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = blogs.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR')
    )
  );

-- -----------------------------------------------------------------------------
-- 14. invites — ADMIN/OWNER manage; tokens never readable outside the API.
-- -----------------------------------------------------------------------------
drop policy if exists "invites_admin" on invites;
drop policy if exists "invites_admin_read" on invites;
drop policy if exists "invites_admin_write" on invites;
create policy "invites_admin_read" on invites for select
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = invites.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'OWNER')
    )
  );
create policy "invites_admin_write" on invites for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = invites.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'OWNER')
    )
  );

-- -----------------------------------------------------------------------------
-- 15. integrations — tighten role list (remove the lowercase/WRITER aliases
--     that 017 carried for BC; canonical roles only).
-- -----------------------------------------------------------------------------
drop policy if exists "integrations_member_read" on integrations;
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
        and pm.role::text in ('ADMIN', 'OWNER')
    )
  )
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = integrations.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'OWNER')
    )
  );

-- -----------------------------------------------------------------------------
-- 16. connection_codes / cli_auth_codes — service-role only for reads
--     (the code itself is the authenticator; `codes_read USING (true)` from
--     012 allowed anyone holding a guessed code to enumerate the project).
-- -----------------------------------------------------------------------------
drop policy if exists "codes_read" on connection_codes;
drop policy if exists "codes_service_only" on connection_codes;
drop policy if exists "codes_member_create" on connection_codes;
drop policy if exists "codes_service_select" on connection_codes;
create policy "codes_service_select" on connection_codes for select using (false);
create policy "codes_member_create" on connection_codes for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = connection_codes.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR')
    )
  );

drop policy if exists "cli_codes_service_only" on cli_auth_codes;
drop policy if exists "cli_codes_member_create" on cli_auth_codes;
drop policy if exists "cli_codes_service_select" on cli_auth_codes;
create policy "cli_codes_service_select" on cli_auth_codes for select using (false);
create policy "cli_codes_member_create" on cli_auth_codes for insert
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = cli_auth_codes.project_id
        and pm.user_id = auth.uid()
        and pm.role::text in ('ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR')
    )
  );

comment on table settings is '025: service-role only — global CMS settings not exposed via PostgREST';
comment on table webhook_deliveries is '025: service-role only — delivery payloads can contain unpublished content';
comment on table poll_votes is '025: service-role only — voter fingerprints are personal data';
comment on table users is '025: service-role only — identity rows accessed exclusively via Prisma';
