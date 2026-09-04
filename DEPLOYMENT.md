# OpenPost Deployment Guide

Production-grade multi-tenant Blog CMS built with Next.js 16, Prisma, Supabase/PostgreSQL and Cloudflare R2.

## 1. Requirements

- Node.js >= 18 (check with `node -v`, tested 24.x)
- Supabase project (or self-hosted Postgres 15+)
- Cloudflare R2 bucket (or any S3-compatible bucket)
- Vercel / Docker / Fly.io / any Node host

## 2. Clone & Install

```bash
git clone https://github.com/OfficialOpenPost/OpenPost.git
cd OpenPost
npm ci
cp .env.example .env
# fill .env (see §3)
```

## 3. Environment Variables

Create `.env` from `.env.example`. Required vars:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
CRON_SECRET="openssl rand -hex 32"
# Optional hardening
REQUIRE_EMAIL_VERIFICATION="false"
# R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="openpost-media"
R2_PUBLIC_URL="https://media.yourdomain.com"
```

Never commit `.env`. Never prefix `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL` with `NEXT_PUBLIC_`.

## 4. Supabase Setup

1. Create project at https://supabase.com → SQL Editor
2. Enable email confirmations: Dashboard → Authentication → Providers → Email → Confirm email = ON (if you want verification flow)
3. Run migrations in order `001` → `019` inside `supabase/migrations/`:
   - Open SQL Editor → New Query → paste file → Run
   - Verify `Success` each file
4. Check RLS: `supabase/migrations/README.md` lists rules (public read only `status='published'`, members via `project_members.user_id = auth.uid()`)

## 5. Database — Prisma

```bash
npx prisma generate
npx prisma migrate deploy   # for managed Postgres / CI
# or for dev:
npx prisma migrate dev
```

Tables created: `profiles`, `projects`, `project_members`, `blogs`, `authors`, `media`, `audit_logs`, `invites`, `integrations`, etc.

Enum `user_role` must contain `OWNER, ADMIN, EDITOR, AUTHOR, CONTRIBUTOR` (canonical 5). `WRITER` is deprecated alias for `AUTHOR`. Migration `019_canonical_five_roles.sql` adds `AUTHOR` & `CONTRIBUTOR` if missing.

## 6. Storage (R2)

Create bucket `openpost-media`, enable public dev domain or custom `R2_PUBLIC_URL`. No manual code edit needed — all via env.

## 7. Bootstrap First Owner

No manual `INSERT INTO project_members` needed.

```bash
# via env vars
BOOTSTRAP_ADMIN_EMAIL=admin@example.com BOOTSTRAP_ADMIN_PASSWORD=StrongPass123 npm run cms:bootstrap

# or via flags
npm run cms:bootstrap -- --email admin@example.com --password StrongPass123 --name "Admin" --project "Main Publication" --slug main-publication

# idempotent: if OWNER already exists, use --force to re-bootstrap
```

What it does:
1. Verifies `DATABASE_URL` & `NEXT_PUBLIC_SUPABASE_URL`
2. Creates or finds Supabase user (via `SUPABASE_SERVICE_ROLE_KEY` admin API, email_confirm = true)
3. Upserts `profiles` with `status='approved'`
4. Creates `projects` + `project_members` with `role='OWNER'`
5. Writes `audit_logs` entry `bootstrap.owner_created`
6. Prevents silent takeover: requires `--force` if OWNER already exists.

Alternative: create Supabase user via Dashboard → Authentication → Add user, then run bootstrap with same email (it will find profile and promote).

## 8. Health Check

```bash
npm run cms:doctor
```

Checks:
```
✓ Node >=18
✓ DATABASE_URL, SUPABASE_URL, ANON_KEY, SERVICE_ROLE
✓ DB connection & required tables
✓ user_role enum contains OWNER/ADMIN/EDITOR/AUTHOR/CONTRIBUTOR
✓ R2 config (optional)
```

Also available at runtime: `/api/health` (no auth).

## 9. Build & Deploy

```bash
npm run test         # 30 vitest (rbac, api-token, storage, ssrf, slug)
npm run typecheck    # tsc --noEmit
npm run build        # next build
```

### Vercel (recommended)

```bash
vercel --prod
# 1. Set environment variables in Vercel Dashboard → Project Settings → Environment Variables
# 2. Vercel automatically detects Next.js framework and executes `postinstall` (prisma generate)
# 3. Scheduled publishing cron is pre-configured via `vercel.json` (runs every minute against /api/cron/publish)
```

### Docker

```bash
docker build -t openpost:latest .
docker run -p 3000:3000 --env-file .env openpost:latest
```

## 10. Cron — Scheduled Publishing

Set 1-minute trigger to:

```bash
curl -X POST https://yourdomain.com/api/cron/publish \
  -H "Authorization: Bearer $CRON_SECRET"
```

- Fails closed if `CRON_SECRET` missing in production (`500 CONFIG_ERROR`)
- No `?secret=` query param accepted (only `Authorization: Bearer`)
- Atomic `updateMany` where `status='scheduled'` prevents double publish race
- Triggers `post.published` webhooks

## 11. Security Checklist

- [x] `SUPABASE_SERVICE_ROLE_KEY` never exposed to client
- [x] No `role=admin` trust from body/query/localStorage
- [x] Every `projectId` validated via `requireProjectMember(projectId)` server-side
- [x] Publish/schedule/editOthers/deleteOthers gated via `requirePermission` (never swallowed with `.catch(()=>{})`)
- [x] `WRITER/CONTRIBUTOR/AUTHOR` cannot bypass review (`403 FORBIDDEN`)
- [x] `OWNER` protected from demotion if sole owner
- [x] `ADMIN` cannot promote to `OWNER`
- [x] Project isolation enforced on `blogs`, `media`, `authors`, `webhooks`, `invites`, `audit_logs` (see `src/app/api/*`)
- [x] RLS policies + composite indexes (`019`)
- [x] Webhook SSRF blocked via `isAllowedWebhookUrl` (private IP, localhost, metadata, https-only in prod)
- [x] Media magic-byte validated (`src/lib/storage.ts:validateMagicBytes`), presigned keys server-generated (`openpost-media/<projectId>/<uuid>.<ext>`)
- [x] Invite tokens masked in GET, rate-limited (10/min/IP)
- [x] Audit logging on all sensitive actions (`user.status_*`, `project.member_*`, `author.*`, `post.*`, `bootstrap.owner_created`)
- [x] Security headers via `next.config.ts` (HSTS, nosniff, SAMEORIGIN, CSP-ready)

Run regression tests:

```bash
npm run test           # includes RBAC 5-role matrix, SSRF, storage, api-token
# manual IDOR test:
# login as Project A user → curl -H Cookie ... /api/blogs/<ProjectB-id> → 404/403
# login as AUTHOR → POST /api/blogs {status: "published"} → 403
# login as CONTRIBUTOR → PATCH /api/settings/users {role:"OWNER"} → 403
```

## 12. Roles (Canonical 5)

`OWNER(5) > ADMIN(4) > EDITOR(3) > AUTHOR(2) > CONTRIBUTOR(1)` — `WRITER` alias → `AUTHOR`.

| Permission | OWNER | ADMIN | EDITOR | AUTHOR | CONTRIBUTOR |
|---|:---:|:---:|:---:|:---:|:---:|
| view project | ✓ | ✓ | ✓ | ✓ | ✓ |
| manage members/invites/approve/suspend | ✓ | ✓ | ✗ | ✗ | ✗ |
| change role (except OWNER) | ✓ | ✓* | ✗ | ✗ | ✗ |
| manage authors/link | ✓ | ✓ | ✓ | ✓(own view) | ✗ |
| create/edit own post | ✓ | ✓ | ✓ | ✓ | ✓ draft |
| edit others post | ✓ | ✓ | ✓ | ✗ | ✗ |
| publish/schedule | ✓ | ✓ | ✓ | ✗ submit review | ✗ submit review |
| delete others | ✓ | ✓ | ✓ | ✗ | ✗ |
| audit.view | ✓ | ✓ | ✗ | ✗ | ✗ |

*ADMIN cannot promote to OWNER nor demote sole OWNER.

## 13. Authors

- Create via Dashboard → Authors → New Author (photo picker: Upload or Choose from Media, linked user picker: searchable approved members same project, guest allowed)
- Slug unique per `projectId + slug` (`409 SLUG_EXISTS`)
- Post count real via `_count.blogs`, not hardcoded
- Public archive: `/authors/[slug]` (SEO: title, description, canonical, OG) shows only `status='published'` posts, paginated 12/page
- Delete protection: `409 IN_USE` with 5 example post titles if still linked

## 14. Troubleshooting

| Symptom | Fix |
|---|---|
| `PENDING_APPROVAL` on login | Admin → Settings → Team → Approve user |
| `ACCOUNT_SUSPENDED` | Same panel → Reactivate |
| `Project not found` | User not in `project_members`; invite via Settings → Team → Invite |
| `FORBIDDEN post.publish` | User is AUTHOR/CONTRIBUTOR; needs EDITOR+; admin changes role |
| `CRON_SECRET not configured` | Set `CRON_SECRET` in env & redeploy |
| `user_role enum missing AUTHOR` | Run `018` → `019` migrations |
| R2 upload falls back to data URL | Check `R2_*` env, bucket exists, CORS allows POST |
| Build fails on `WRITER` type | Update code to `CONTRIBUTOR`/`AUTHOR`; `WRITER` deprecated |

## 15. Production Checklist Before Go-Live

- [ ] `npm run cms:doctor` green
- [ ] `npm run test` 30/30 green
- [ ] `npm run build` green
- [ ] Created first OWNER via `cms:bootstrap`
- [ ] Email verification ON if required (`REQUIRE_EMAIL_VERIFICATION=true`)
- [ ] `CRON_SECRET` set & cron job hitting `/api/cron/publish` with Bearer
- [ ] R2 bucket & `R2_PUBLIC_URL` correct
- [ ] HTTPS enforced (Vercel auto, else reverse proxy)
- [ ] No secrets in git history (`git log --all --full-history -- "*env*"`)

## 16. Support

- Issues: https://github.com/OfficialOpenPost/OpenPost/issues
- Audit: `GET /api/audit?projectId=...` (ADMIN/OWNER only) or Dashboard → Audit Logs

