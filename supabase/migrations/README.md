# Supabase Migrations — Run in Sequential Order

1. Open **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Run each file **in sequential order** `001` → `021` (copy-paste, click **Run**)
3. Check for "Success", then proceed to the next file.

## Requirements

- **Supabase project** (recommended) — managed PostgreSQL + Auth + RLS + Edge Functions
- **Self-hosted PostgreSQL** — works but requires manual Supabase Auth setup or alternative auth provider; RLS policies assume `auth.uid()` function exists

| File | Purpose / Description |
|---|---|
| `001_extensions_enums.sql` | PostgreSQL extensions (`pgcrypto`, `uuid-ossp`) and base enums |
| `002_users.sql` | `users` table and `update_updated_at()` trigger function |
| `003_categories_tags.sql` | `categories` (parent-child hierarchy) and `tags` tables |
| `004_authors.sql` | `media` storage records and `authors` profile table |
| `005_blogs.sql` | `blogs`, `blog_revisions`, `redirects`, and `settings` tables |
| `006_blog_relations.sql` | Many-to-many junction tables (`blog_tags`, `blog_authors`, `media_usage`) |
| `007_polls.sql` | `polls`, `poll_options`, and `poll_votes` with voter fingerprint uniqueness |
| `008_webhooks.sql` | `webhooks` definition and `webhook_deliveries` audit logs |
| `009_fts_search.sql` | Full-text search tsvector column, GIN indexes, and `search_blogs()` helper |
| `010_storage_rls.sql` | Storage RLS policies and Cloudflare R2 presigned notes |
| `011_projects_core.sql` | Multi-tenant `projects` and `project_members` tables |
| `012_integrations_codes.sql` | API `integrations` tokens and `connection_codes` for CLI handshake |
| `013_fix_role_enum_compat.sql` | Role enum compatibility layer |
| `014_rls_hardening.sql` | Enterprise RLS hardening across project boundaries |
| `015_fix_users_name.sql` | Users display name compatibility |
| `016_auto_profile_on_signup.sql` | Supabase auth signup triggers and automated profile provisioning |
| `017_strict_rls_and_canonical_roles.sql` | Strict canonical roles (`ADMIN`, `EDITOR`, `WRITER`), composite indexes, and fail-closed RLS policies |
| `018_assign_legacy_blogs_to_default_project.sql` | Backfills any unassigned legacy posts/taxonomies (`project_id IS NULL`) to primary project |
| `019_canonical_five_roles.sql` | Canonical 5-role model `OWNER/ADMIN/EDITOR/AUTHOR/CONTRIBUTOR`, preserves `WRITER` as deprecated alias, adds indexes |
| `020_editor_document.sql` | Adds `editor_document` (JSONB), `rendered_html` (text), `content_version` (int) to `blogs` and `blog_revisions` |
| `021_site_config_and_cleanup.sql` | Adds site config columns to `projects` (site name, tagline, logo, social URLs, etc.); removes auto-created demo project |
| `022_upgrade_user_to_owner.sql` | Utility script to safely approve any user profile and upgrade them to `OWNER` role across workspace projects |

---

## Row Level Security (RLS) Policies by Table

| Table | Policy | Description |
|---|---|---|
| `blogs` | `blog_member_read` | Members can read all blogs in their project |
| `blogs` | `blog_member_insert` | Members can create blogs in their project |
| `blogs` | `blog_member_update` | Members can update blogs in their project |
| `blogs` | `blog_member_delete` | Members can delete blogs in their project |
| `blogs` | `blog_public_read` | Public can read `status = 'published'` blogs |
| `categories` | `cat_member_*` | CRUD scoped to project membership |
| `categories` | `cat_public_read` | Public read |
| `tags` | `tag_member_*` | CRUD scoped to project membership |
| `tags` | `tag_public_read` | Public read |
| `authors` | `author_member_*` | CRUD scoped to project membership |
| `authors` | `author_public_read` | Public read (`status = 'published'` only) |
| `media` | `media_member_*` | CRUD scoped to project membership |
| `polls` | `poll_member_*` | CRUD scoped to project membership |
| `polls` | `poll_public_read` | Public read |
| `webhooks` | `webhook_member_*` | CRUD scoped to project membership |
| `project_members` | `pm_member_read` | Members can view project members |
| `project_members` | `pm_admin_write` | Admins+ can invite/manage |
| `projects` | `project_owner_*` | Owner can update/delete |
| `projects` | `project_member_read` | Members can read |
| `integrations` | `int_member_read` | Members can read |
| `integrations` | `int_admin_write` | Admins+ can create/revoke |
| `connection_codes` | `codes_member_create` | Members can generate codes |
| `connection_codes` | `codes_service_only` | Service-role only (API reads) |
| `invites` | `invite_member_*` | Member CRUD scoped to project |
| `audit_logs` | `audit_member_read` | Members can view project audit logs |

> **Key principle:** Every project-scoped query includes `WHERE projectId` + `requireProjectMember(projectId)`. RLS is defense-in-depth, not the primary access control.
