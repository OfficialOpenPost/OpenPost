# Supabase Migrations — Run in Sequential Order

1. Open **Supabase Dashboard** &rarr; **SQL Editor** &rarr; **New Query**
2. Run each file **in sequential order** `001` &rarr; `019` (copy-paste, click **Run**)
3. Check for “Success”, then proceed to the next file.

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

---

## Row Level Security (RLS) Rules

* **Public Read**: `blogs` (strictly `status = 'published'`), `categories`, `tags`, `authors`, `polls` & `options`.
* **Member Read / Write**: Full draft editing and creation scoped strictly to projects where `project_members.user_id = auth.uid()`.
* **Admin Governance**: Role permissions (`OWNER` > `ADMIN` > `EDITOR` > `AUTHOR` > `CONTRIBUTOR` hierarchy, `WRITER` deprecated alias for `AUTHOR`) enforced at both database RLS and API layer.
