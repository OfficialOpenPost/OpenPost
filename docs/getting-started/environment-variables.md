# Environment Variables Reference

This page lists all the environment variables used by OpenPost CMS, their purpose, default values, and example configurations for local development and production.

---

## Example `.env` File

Copy this template to `.env` in the root of your project:

```env
# ==========================================
# 1. DATABASE CONFIGURATION (Supabase)
# ==========================================
# Use the Session Pooler connection string (Port 5432)
DATABASE_URL="postgresql://postgres.yourprojectref:yourpassword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# ==========================================
# 2. SUPABASE AUTH & CLIENT
# ==========================================
NEXT_PUBLIC_SUPABASE_URL="https://yourprojectref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ==========================================
# 3. CLOUDFLARE R2 MEDIA STORAGE
# ==========================================
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="openpost-media"
R2_PUBLIC_URL="https://media.yourdomain.com"

# ==========================================
# 4. SECURITY & AUTOMATION (Optional)
# ==========================================
# Secret token for triggering the scheduled publishing cron
CRON_SECRET="your-random-32-char-cron-secret"

# Public site URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Deployed CMS domain (for email verification redirects)
NEXT_PUBLIC_CMS_URL="https://your-cms-domain.vercel.app"
```

---

## Variables Breakdown

### Database (PostgreSQL / Supabase)

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | Postgres connection URL used by Prisma ORM. For Supabase, always use the **Session Pooler** on port `5432` to avoid IPv4 purchase fees. | `postgresql://postgres.ref:pass@aws-0-us-east-1.pooler.supabase.com:5432/postgres` |

> [!WARNING] Special Characters in Database Password
> If your database password contains characters like `@`, `#`, `$`, `%`, or `/`, you must URL-encode them:
> - `@` → `%40`
> - `#` → `%23`
> - `$` → `%24`
> - `%` → `%25`

---

### Supabase Authentication & Admin Keys

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase project REST API endpoint. | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Public Supabase anon key safe to expose in the browser. Used for user login and signup. | `eyJhbGciOiJI...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service role key with full admin privileges. **Never expose this to the frontend!** | `eyJhbGciOiJI...` |

---

### Cloudflare R2 Media Storage

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `R2_ACCOUNT_ID` | Optional in dev | 32-character hexadecimal Cloudflare account identifier. | `your-r2-account-id` |
| `R2_ACCESS_KEY_ID` | Optional in dev | S3-compatible Access Key ID generated from R2 API Tokens. | `your-r2-access-key-id` |
| `R2_SECRET_ACCESS_KEY` | Optional in dev | S3-compatible Secret Access Key generated from R2 API Tokens. | `your-r2-secret-access-key` |
| `R2_BUCKET_NAME` | Optional in dev | Name of the R2 bucket. | `openpost-media` |
| `R2_PUBLIC_URL` | Optional in dev | Custom domain or public development URL (`pub-*.r2.dev`) for serving images. No trailing slash. | `https://media.yourdomain.com` |

> [!NOTE] Mock Media in Development
> If `R2_*` variables are not provided during local development, OpenPost will gracefully fall back to mock image placeholders, allowing you to test the editor without setting up Cloudflare R2 immediately.

---

### Security & Automation

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `CRON_SECRET` | Recommended | Bearer authorization token used to protect `GET /api/cron/publish`. | `op_cron_8f93a1c890...` |
| `NEXT_PUBLIC_APP_URL` | Recommended | Canonical base URL used for generating OpenGraph URLs and sitemaps. | `https://cms.yourdomain.com` |
| `NEXT_PUBLIC_CMS_URL` | **Yes** (production) | Deployed CMS domain used for email verification redirects. Supabase sends verification emails with a link back to this URL. Must match the **Site URL** and **Redirect URLs** configured in your Supabase Dashboard. | `https://your-cms-domain.vercel.app` |

---

## Verifying Your Environment

To verify that your environment variables are configured correctly, start the development server:

```bash
npm run dev
```

Then visit the system health endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected JSON response:

```json
{
  "status": "healthy",
  "timestamp": "2026-09-01T15:30:00.000Z",
  "version": "1.0.0"
}
```
