# 5-Minute Quickstart Guide

Get your own instance of OpenPost CMS up and running locally or on Vercel in under 5 minutes.

---

## Step 1: Clone the Repository & Install Dependencies

Open your terminal and run:

```bash
git clone https://github.com/OfficialOpenPost/OpenPost.git
cd OpenPost
npm install
```

Copy the example environment file:

```bash
cp .env.example .env
```

---

## Step 2: Create a Supabase Project & Run Migrations

1. Go to [https://supabase.com](https://supabase.com) and click **New Project**.
2. Set a project name (e.g. `openpost`) and create a strong database password.
3. Open the **SQL Editor** in your Supabase Dashboard.
4. Copy and run the migration scripts located in the `supabase/migrations/` directory in sequential order:
   - `001_extensions_enums.sql`
   - `002_users.sql`
   - `003_categories_tags.sql`
   - `004_authors.sql`
   - `005_blogs.sql`
   - `006_blog_relations.sql`
   - `007_polls.sql`
   - `008_webhooks.sql`
   - `009_fts_search.sql`
   - `010_storage_rls.sql`
   - `011_projects_core.sql`
   - `012_integrations_codes.sql`
   - `013_fix_role_enum_compat.sql`
   - `014_rls_hardening.sql`
   - `015_fix_users_name.sql`
   - `016_auto_profile_on_signup.sql`

> [!TIP]
> All migration files use `IF NOT EXISTS` statements, so they are completely safe to re-run at any time.

---

## Step 3: Configure Environment Variables

Open `.env` and fill in your connection details from Supabase:

```env
# Database Session Pooler (Port 5432, Free IPv4)
DATABASE_URL="postgresql://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Auth & API
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Cloudflare R2 Media (Optional for local testing)
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="openpost-media"
R2_PUBLIC_URL="https://pub-your-id.r2.dev"
```

---

## Step 4: Generate Prisma Client & Run Dev Server

Generate the Prisma client:

```bash
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Step 5: Create Your First Admin User

1. Navigate to [http://localhost:3000/signup](http://localhost:3000/signup) and register with your email (e.g. `admin@yourdomain.com`).
2. Go back to your **Supabase SQL Editor** and run this SQL to approve your user:

```sql
UPDATE profiles SET status = 'approved' WHERE email = 'admin@yourdomain.com';
UPDATE users SET role = 'admin' WHERE email = 'admin@yourdomain.com';
```

Now log in at [http://localhost:3000/login](http://localhost:3000/login) and you will have full access to the CMS dashboard!

---

## Step 6: Create & Publish a Post

1. Go to **Dashboard → Editor** (`/dashboard/editor`).
2. Type a title, write your content, or press `/` to insert callouts, code snippets, or images.
3. Click the **Publish** button at the top right.
4. Your post is now live and accessible at `/blog/[slug]` and via the public API at `/api/v1/posts`.

---

## Next Steps

- Check out the [Environment Variables Reference](/docs/getting-started/environment-variables).
- Connect your own frontend starter with the [OpenPost CLI](/docs/cli).
- Learn about [16 Slash Blocks](/docs/editor) in the Writing Studio.
