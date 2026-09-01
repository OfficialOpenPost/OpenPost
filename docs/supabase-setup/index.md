# Supabase & Postgres Database Setup

OpenPost uses **Supabase PostgreSQL** for all structured data storage, Row-Level Security (RLS), full-text search (`tsvector`), JSONB document storage, and user authentication.

This guide walks you through creating a Supabase project, executing all SQL migrations, configuring the connection pooler, and approving your first admin user.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and click **New Project**.
2. Set the project name to `openpost` (or your company name).
3. Set a strong database password and save it securely.
4. Choose the region closest to your users (e.g. `ap-south-1`, `us-east-1`, `eu-central-1`).
5. Click **Create new project** and wait ~1 minute for provisioning.

---

## 2. Execute SQL Migrations (001 → 016)

Open your Supabase Dashboard → **SQL Editor** → **New query**.

Copy and run each migration file located in `supabase/migrations/` sequentially:

| Order | Migration File | Tables & Functions Created |
| :--- | :--- | :--- |
| **001** | `001_extensions_enums.sql` | `pgcrypto`, `uuid-ossp`, `user_role`, `post_status`, `poll_*` |
| **002** | `002_users.sql` | `users` table and `update_updated_at()` trigger |
| **003** | `003_categories_tags.sql` | `categories` (hierarchical) and `tags` tables |
| **004** | `004_authors.sql` | `media` and `authors` tables |
| **005** | `005_blogs.sql` | `blogs`, `blog_revisions`, `redirects`, and `settings` |
| **006** | `006_blog_relations.sql` | `blog_tags`, `blog_authors`, and `media_usage` |
| **007** | `007_polls.sql` | `polls`, `poll_options`, and `poll_votes` with fingerprinting |
| **008** | `008_webhooks.sql` | `webhooks` and `webhook_deliveries` with retry tracking |
| **009** | `009_fts_search.sql` | PostgreSQL GIN index on `tsvector` and `search_blogs()` function |
| **010** | `010_storage_rls.sql` | Storage RLS helper functions |
| **011** | `011_projects_core.sql` | `profiles`, `projects`, `project_members`, and `invites` |
| **012** | `012_integrations_codes.sql` | `integrations`, `connection_codes`, and `cli_auth_codes` |
| **013** | `013_fix_role_enum_compat.sql` | RBAC enum compatibility mapping (`ADMIN`, `EDITOR`, `WRITER`) |
| **014** | `014_rls_hardening.sql` | Multi-project isolation and uniqueness constraints |
| **015** | `015_fix_users_name.sql` | Name backfilling and constraint validation |
| **016** | `016_auto_profile_on_signup.sql` | Auth hook trigger: auto-creates `profiles` and `users` on signup |
| **017** | `017_strict_rls_and_canonical_roles.sql` | Strict multi-tenant RLS policies, canonical role normalization (`ADMIN`, `EDITOR`, `WRITER`), and composite indexes |

> [!TIP] Safe to Re-run
> All SQL migrations use `CREATE TABLE IF NOT EXISTS` and `DO $$ BEGIN ... END $$` guards. You can re-run them safely without data loss.

---

## 3. Copy Connection Strings

In your Supabase Dashboard:

1. Go to **Project Settings → Database → Connection String**.
2. Select **Session Pooler** (Port `5432`):
   ```
   postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public key**
   - **service_role secret key**

Add them to your `.env` file:

```env
DATABASE_URL="postgresql://postgres.yourref:yourpassword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://yourref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 4. Approve Your First Admin User

To prevent unauthorized public signups from writing content, OpenPost uses an approval workflow (`profiles.status = 'pending'`).

Follow these steps to approve your first admin user:

### Step A: Sign Up in the App
1. Start your local app (`npm run dev`).
2. Go to [http://localhost:3000/signup](http://localhost:3000/signup) and create an account (e.g. `admin@yourdomain.com`).

### Step B: Run the Admin SQL Query in Supabase
In the Supabase **SQL Editor**, run the following SQL query to approve the user and grant the `admin` role:

```sql
-- Approve profile
UPDATE profiles 
SET status = 'approved' 
WHERE email = 'admin@yourdomain.com';

-- Grant admin role
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@yourdomain.com';
```

---

## 5. Verify the Database Setup

Run the following query in the SQL Editor to ensure everything is initialized properly:

```sql
SELECT email, role, created_at FROM users;
SELECT email, status FROM profiles;
SELECT count(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
```

Now log in at [http://localhost:3000/login](http://localhost:3000/login). You will be directed straight into the OpenPost Dashboard!
