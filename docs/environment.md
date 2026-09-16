# Environment Variables Reference

All environment variables are defined in `.env.local` (for development) or your hosting platform's environment settings. See `.env.example` for the template.

## Core

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string (Supabase format: `postgresql://...?sslmode=require`) |
| `DIRECT_URL` | | Direct database URL for migrations (bypasses connection pooler) |
| `NEXT_PUBLIC_APP_URL` | ✓ | Application base URL (e.g. `http://localhost:3000` or `https://your-domain.com`) |

## Supabase Auth

| Variable | Required | Description |
|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Supabase service role key (server-side only, never exposed to client) |

## Cloudflare R2 Storage

| Variable | Required | Description |
|---|:---:|---|
| `R2_ACCOUNT_ID` | ✓ | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | ✓ | R2 API access key ID |
| `R2_SECRET_ACCESS_KEY` | ✓ | R2 API secret access key |
| `R2_BUCKET_NAME` | ✓ | R2 bucket name (e.g. `openpost-media`) |
| `R2_PUBLIC_URL` | | Public URL for serving assets (e.g. `https://pub-xxx.r2.dev`). Falls back to `https://{bucket}.r2.dev` |
| `R2_ENDPOINT` | | Custom R2 endpoint URL. Defaults to `https://{accountId}.r2.cloudflarestorage.com` |

## Cron & Scheduled Publishing

| Variable | Required | Description |
|---|:---:|---|
| `CRON_SECRET` | ✓ (prod) | Bearer token for `/api/cron/publish` endpoint. Fail-closed in production if missing |

## Authentication

| Variable | Required | Description |
|---|:---:|---|
| `NEXT_PUBLIC_CMS_URL` | Yes | Deployed CMS domain for email verification redirects (e.g. `https://your-cms-domain.vercel.app`) |

## Bootstrap / Admin Setup

| Variable | Required | Description |
|---|:---:|---|
| `BOOTSTRAP_ADMIN_EMAIL` | | Email for `cms:bootstrap` script (creates initial OWNER) |
| `BOOTSTRAP_ADMIN_PASSWORD` | | Password for `cms:bootstrap` script |

## Public vs Private Variables

**IMPORTANT:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never use this prefix for secrets.

| Prefix | Exposed To | Safe For |
|---|---|---|
| `NEXT_PUBLIC_` | Browser (client + server) | Public URLs, anon keys |
| (no prefix) | Server only | Secrets, service keys, passwords |

```
✓ NEXT_PUBLIC_SUPABASE_URL     → Public, safe
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY → Public, safe
✗ NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY → NEVER DO THIS
✗ NEXT_PUBLIC_R2_SECRET_ACCESS_KEY      → NEVER DO THIS
```

## Environment Validation

OpenPost validates environment variables at startup via `src/lib/env.ts`. Missing required variables cause build failures or runtime errors with descriptive messages.

## Setup Instructions

### Development

```bash
# 1. Copy template
cp .env.example .env.local

# 2. Fill in values
# Edit .env.local with your Supabase + R2 credentials

# 3. Install dependencies
npm ci

# 4. Generate Prisma client
npx prisma generate

# 5. Push schema to database
npx prisma db push

# 6. Start dev server
npm run dev
```

### Production (Vercel)

```bash
# Set environment variables in Vercel dashboard
# Then deploy:
vercel --prod
```

### Bootstrap First Admin

```bash
npm run cms:bootstrap -- --email admin@example.com --password StrongPass123
```

This creates an OWNER profile and project. The admin user must exist in Supabase Auth first (sign up via the web UI).

### Health Check

```bash
npm run cms:doctor
```

Checks: Node.js version (≥18), environment variables, database connection, table existence, `user_role` enum (5 roles).
