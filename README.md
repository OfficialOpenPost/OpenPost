<div align="center">

<p align="center">
  <img src="public/logo.svg" width="96" height="96" alt="OpenPost Logo" />
</p>

# ⚡ OpenPost

### The Modern, Multi-Tenant Headless CMS & Publishing Studio

**Write like WordPress &middot; Deliver like Sanity &middot; Own like Ghost**

<p align="center">
  <a href="https://github.com/OfficialOpenPost/OpenPost/actions"><img src="https://img.shields.io/badge/build-passing-2ea44f.svg?style=for-the-badge&logo=github-actions&logoColor=white" alt="Build Status" /></a>
  <a href="https://github.com/OfficialOpenPost/OpenPost"><img src="https://img.shields.io/badge/tests-30%2F30%20passed-brightgreen.svg?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest Tests" /></a>
  <a href="https://github.com/OfficialOpenPost/OpenPost/releases"><img src="https://img.shields.io/badge/cli-openpost--cli%20v0.1.2-000000.svg?style=for-the-badge&logo=npm&logoColor=white" alt="openpost-cli v0.1.2" /></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.3%20(App%20Router)-000000.svg?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://developers.cloudflare.com/r2"><img src="https://img.shields.io/badge/Storage-Cloudflare%20R2-F38020.svg?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare R2" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-CSS%204.0-06B6D4.svg?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="License MIT" /></a>
</p>

<p align="center">
  <a href="#-quickstart-in-3-minutes"><strong>Quickstart</strong></a> &bull;
  <a href="#-key-features-audited"><strong>Key Features</strong></a> &bull;
  <a href="#-tech-stack"><strong>Tech Stack</strong></a> &bull;
  <a href="#-architecture--project-structure"><strong>Architecture</strong></a> &bull;
  <a href="#-cli--openpost-cli-v012"><strong>CLI</strong></a> &bull;
  <a href="#-rbac-5-tier-permission-matrix"><strong>RBAC</strong></a> &bull;
  <a href="#-public-api-reference"><strong>API</strong></a> &bull;
  <a href="#-environment-variables"><strong>Env</strong></a> &bull;
  <a href="#-production-deployment"><strong>Deployment</strong></a>
</p>

</div>

---

## 🌟 Overview

**OpenPost** is an open-source, enterprise-ready **multi-tenant headless CMS** and collaborative writing studio. It gives you **100% data ownership**, strict **project isolation** at the Postgres/RLS layer, **cryptographically hashed** API tokens (`op_live_64hex`), **direct R2** media streaming with browser WebP, and an **instant Next.js blog generator** via a single binary `openpost-cli`.

> **Icon:** [`public/logo.svg`](public/logo.svg) — the orange “OP” mark used across README, favicon, and dashboard header. Keep it as the single source of truth for branding.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           OpenPost Architecture                         │
├───────────────────┬───────────────────────────────┬─────────────────────┤
│  Studio Layer     │      Core Engine & APIs       │  Frontend Delivery  │
│  - Tiptap Editor  │      - Project-Scoped RLS     │  - Next.js Starter  │
│  - Revision Logs  │      - REST API v1 Caching    │  - openpost-cli     │
│  - User Approvals │      - SSRF Webhooks Engine   │  - RSS / Sitemaps   │
│  - 5-Tier Roles   │      - Magic Byte S3 Storage  │  - On-Demand ISR    │
│  - Team & Authors │      - Audit Logs             │  - Authors Archive  │
└───────────────────┴───────────────────────────────┴─────────────────────┘

Flow: Supabase Auth → Profile (pending/approved) → ProjectMember (OWNER>ADMIN>EDITOR>AUTHOR>CONTRIBUTOR) → requirePermission → Prisma → RLS
```

**Who is it for?** Indie bloggers, editorial teams, agencies managing multiple client sites — anyone who wants Sanity’s headless ergonomics without vendor lock-in.

---

## ✨ Key Features — Audited

| Capability | What it does | Where to verify |
| :--- | :--- | :--- |
| 🛡️ **Multi-Tenant Isolation** | Every query scoped `WHERE projectId` + `requireProjectMember(projectId)`; RLS `project_members.user_id = auth.uid()`; composite indexes `019`. IDOR `Project A → Project B` → `404/403` | `src/app/api/blogs/route.ts:90`, `src/app/api/media/route.ts:5`, `supabase/migrations/019_canonical_five_roles.sql` |
| 👥 **Canonical 5-Tier RBAC** | `OWNER(5) > ADMIN(4) > EDITOR(3) > AUTHOR(2) > CONTRIBUTOR(1)` — `WRITER` deprecated → `AUTHOR`. Explicit perms `posts.edit_others/publish_others`, `members.invite/approve` etc. | `src/lib/rbac.ts:83`, `AGENTS.md:14` |
| ⏳ **User Approval Workflow** | Signup → `pending` → admin `Approve/Reject/Suspend/Reactivate` → `approved` only then access. `REQUIRE_EMAIL_VERIFICATION=true` checks `email_confirmed_at`. | `src/lib/auth.ts:160`, `/dashboard/team`, `supabase/migrations/016_auto_profile_on_signup.sql` |
| 👤 **Authors vs Users (strict)** | `Author` = public byline `name/slug/bio/photoId/socialLinks/website/email/linkedUserId/projectId` — guest `linkedUserId=null`, linked must be **approved member same project**, photo via `media` same project, slug `unique[projectId,slug]` → `409`, real `_count.blogs`, public `/authors/[slug]` only `published` | `src/app/api/v1/authors/route.ts:8`, `prisma/schema.prisma:82` |
| 👥 **Team & Invites** | `invites` `gen_random_bytes(32)` hex, 7-day expiry, `tokenPreview` masked, rate-limited `10/min/IP`, `OWNER` only for `OWNER` invites | `src/app/api/settings/users/route.ts:40`, `/dashboard/team` |
| 📝 **Blogs & Revisions** | Editor `Tiptap` JSON `type:"doc"`, `EDITOR`+ `publish/schedule`, `AUTHOR/CONTRIBUTOR` only own edit, `301` redirect on published slug change, `blogRevisions` audit | `src/app/api/blogs/route.ts:90`, `src/app/api/blogs/[id]/route.ts:7` |
| 🖼️ **Media Library** | R2 presigned `PUT` + `uploadBuffer`, `validateMagicBytes` PNG/JPEG/WebP/GIF/AVIF/PDF/SVG/MP4, key `openpost-media/<projectId>/<uuid>.<ext>` server-generated, SHA256 server-side, usage `media_usage` | `src/lib/storage.ts:44,108`, `src/app/api/media/route.ts:1`, `/api/media/upload` |
| 🔒 **Webhooks** | `isAllowedWebhookUrl` blocks localhost `10/192.168/172.16/169.254`, HMAC SHA256 `signPayload`, 5s timeout `manual` redirect check, secret masked `secretConfigured` | `src/lib/webhooks.ts:47`, `src/app/api/webhooks/route.ts:5` |
| 🕒 **Scheduled Publishing** | `POST /api/cron/publish` Bearer `CRON_SECRET` only (fail-closed 500), atomic `updateMany where scheduledAt<=now`, triggers webhooks | `src/app/api/cron/publish/route.ts:5` |
| 📊 **Polls** | `single/multiple` + `SHA256 voter fingerprint` dedup `unique[pollId,fingerprint]` `409 ALREADY_VOTED` | `prisma/schema.prisma:258`, `src/app/api/v1/polls/[id]/vote/route.ts` |
| 📡 **Headless API v1** | `GET /api/v1/posts?limit&category&cursor` caches `s-maxage=60`, `project` via `Bearer op_live_64hex` / `?project` / `X-OpenPost-Project` | `src/app/api/v1/posts/route.ts:6`, `src/lib/apiToken.ts:17` |
| 🧾 **Audit Logs** | `audit_logs` on `post.*, user.status_*, project.member_*, author.*, bootstrap.owner_created` | `GET /api/audit`, `/dashboard/audit` |
| 💻 **CLI `openpost-cli` v0.1.2** | **Single bin** `openpost-cli` (no `create-openpost` alias). Health check 8s abort, 3-retries exchange, template copy, `.env.local` + `git init` | `cli/src/index.ts:57`, `cli/package.json:5` |
| 🩺 **Doctor & Bootstrap** | `npm run cms:doctor` checks Node, env, DB, tables, `user_role` 5 roles; `npm run cms:bootstrap -- --email admin@example.com` creates `OWNER` | `scripts/cms.ts` |

> **All features have a `UI → API → authz → DB → validation → audit → UI` path — no mock buttons.**

---

## 🧱 Tech Stack

| Layer | Choice | Why |
| :--- | :--- | :--- |
| **App** | Next.js 16 App Router, Turbopack | SSR, streaming, `proxy.ts` (Next 16) auth |
| **Language** | TypeScript 5, Zod | `docSchema` validation, no `any` trust |
| **DB** | PostgreSQL (Supabase) + Prisma 6 | JSONB `content`, RLS, composite indexes |
| **Auth** | Supabase Auth (`@supabase/ssr`) | `getCurrentUser()`, `requireProjectMember` |
| **Storage** | Cloudflare R2 (S3 compat) | zero egress, presigned `PUT`, `validateMagicBytes` |
| **Editor** | Tiptap (ProseMirror) | block JSON, `countWords`/`readingTime` |
| **UI** | Tailwind 4, lucide-react, framer-motion | dashboard, editor, authors, team |
| **CLI** | `openpost-cli` v0.1.2 | `prompts` + `open` + `chalk` |
| **Test** | Vitest 30/30 | rbac 8, api-token 3, storage 7, ssrf 6, slug 3, webhook 3 |

---

## 📁 Architecture & Project Structure

```
D:/Openpost
├── src/app/
│   ├── api/
│   │   ├── blogs/            # GET project-scoped list, POST create/update (publish gated)
│   │   ├── blogs/[id]/       # GET/PUT/DELETE single, /restore, /revisions
│   │   ├── media/            # GET list (project-scoped), POST metadata (server key), /presign, /upload (magic bytes)
│   │   ├── v1/posts                 # public cached, project via token/?project/header
│   │   ├── v1/authors|tags|categories|polls  # authors: guest+linked, slug unique per project
│   │   ├── projects/         # GET my projects, POST create (OWNER), PATCH/DELETE (ADMIN)
│   │   ├── settings/users    # GET users+invites (masked), POST invite (rate-limited), PATCH status/role, DELETE remove
│   │   ├── settings/tokens   # integrations op_live_ hash
│   │   ├── webhooks/         # GET masked, POST SSRF-checked + HMAC
│   │   ├── cli/auth|exchange # OP-XXXX 10-min single-use → op_live_ token
│   │   ├── cron/publish      # Bearer CRON_SECRET, atomic publish
│   │   ├── audit/            # GET audit logs (ADMIN/OWNER)
│   │   └── health/           # GET health (no auth)
│   ├── (dashboard)/dashboard/
│   │   ├── page.tsx          # overview counts
│   │   ├── blogs/            # Articles & Posts (search/status/category/sort, projectChanged)
│   │   ├── media/            # grid/list, drag-drop WebP convert, projectChanged
│   │   ├── categories|tags/  # single-level, projectChanged
│   │   ├── authors/          # grid, New/Edit modal: Name/Slug/Bio/Email/Website/Twitter/LinkedIn + Photo picker (Upload/Choose) + Linked User picker (approved same-project)
│   │   ├── team/             # ⭐ NEW: pending queue, invite, filters role/status/search, Approve/Reject/Suspend/Reactivate/Role→OWNER guard
│   │   ├── webhooks/         # list masked, create
│   │   ├── audit/            # search/action filter, pagination
│   │   ├── settings/         # General, Team & Users, Media, SEO, Publishing, API Keys, Security
│   │   └── editor/[id]/      # Tiptap, autosave 2s+blur+beacon+30s → IndexedDB recovery, preview parity
│   ├── blog/[slug]/          # public render
│   ├── authors/[slug]/       # public archive (photo/bio/social + published posts 12/page)
│   ├── cli/connect/          # shows OP-XXXX for CLI
│   ├── pending-approval/     # pending/suspended UI
│   └── middleware.ts         # Supabase session refresh, auth guard (redirect /dashboard → /login)
├── src/lib/
│   ├── rbac.ts               # 5-tier hierarchy + 40+ permissions, normalizeRoleStrict
│   ├── auth.ts               # getCurrentUser (profiles+members+owned as OWNER), requireApprovedUser, requireProjectMember, requirePermission, requireAdmin, requireOwner, createAuditLog
│   ├── db.ts                 # Prisma client + withDbRetry
│   ├── supabase/server|client.ts
│   ├── storage.ts            # getS3Client, getSignedUploadUrl, uploadBuffer, deleteObject, validateMagicBytes
│   ├── webhooks.ts           # signPayload, isAllowedWebhookUrl, deliverWebhook 5s, triggerWebhooks
│   ├── apiToken.ts           # generateApiToken op_live_64hex SHA256, resolveProjectContext
│   ├── rateLimit.ts          # 10/min invite
│   └── slug.ts / publish.ts
├── prisma/schema.prisma      # UserRole OWNER/ADMIN/EDITOR/AUTHOR/CONTRIBUTOR (+WRITER alias), Profile, Project, ProjectMember, Author, Blog, Media, Poll, Webhook, Invite, Integration, AuditLog
├── supabase/migrations/      # 001 → 019_canonical_five_roles.sql (run in order)
├── cli/                      # openpost-cli v0.1.2 → dist/index.js (single bin)
│   ├── src/index.ts          # init/doctor/login/logout/help/version, healthCheck 8s, 3-retries exchange, copy template, .env.local
│   └── package.json          # bin: openpost-cli only, v0.1.2
├── templates/nextjs-blog/    # starter copied by CLI (Next 15, /api/revalidate)
├── public/logo.svg           # icon (see top) — single brand source
├── scripts/cms.ts            # cms:doctor, cms:bootstrap (OWNER)
├── tests/                    # rbac 8, api-token 3, storage 7, ssrf 6, slug 3, webhook 3 = 30
└── AGENTS.md                 # agent guide (keep nextjs-agent-rules block)
```

---

## 🚀 Quickstart in 3 Minutes

### Step 1: Clone & Install
```bash
git clone https://github.com/OfficialOpenPost/OpenPost.git
cd OpenPost
npm ci
cp .env.example .env
```

### Step 2: Configure Supabase Database
1. Create project at [Supabase](https://supabase.com) → **SQL Editor**
2. Run `supabase/migrations/` **001 → 019** sequentially (paste → Run → Success)
3. Fill `.env`:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="openpost-media"
R2_PUBLIC_URL="https://media.yourdomain.com"
CRON_SECRET="openssl rand -hex 32"
REQUIRE_EMAIL_VERIFICATION="false"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Bootstrap & Launch
```bash
npx prisma generate
npm run test         # 30/30
npm run cms:doctor   # Node, env, DB, tables, user_role 5 roles
npm run cms:bootstrap -- --email admin@example.com --password StrongPass123  # → OWNER
npm run dev          # http://localhost:3000
```

Signup → `pending` → Admin `/dashboard/team` **Approve** → access granted. Or bootstrap creates the first `OWNER` directly (approved).

---

## 💻 CLI — `openpost-cli` v0.1.2 (single bin)

> **Always use `openpost-cli`**. The legacy alias `create-openpost` is **removed** (v0.1.2). Use `npx openpost-cli` everywhere.

```bash
npx openpost-cli --help
npx openpost-cli --version   # → openpost-cli v0.1.2
npx openpost-cli doctor --cms-url http://localhost:3000
npx openpost-cli init my-blog
npx openpost-cli init my-blog --cms-url https://cms.example.com --yes
```

**Workflow (Sanity-like):**
```
? CMS URL: http://localhost:3000  → healthCheck /api/health (8s, fail-fast)
✓ Connected → open /cli/connect → paste OP-XXXX-YYYY-ZZZZ (10-min single-use)
→ POST /api/cli/exchange (3 retries, op_live_64hex)
? Project dir: my-blog → copy templates/nextjs-blog → .env.local + git init

→ cd my-blog && npm install && npm run dev -p 3001
```

**Generated `.env.local`:**
```env
OPENPOST_URL=http://localhost:3000
OPENPOST_PROJECT_ID=uuid
OPENPOST_TOKEN=op_live_64hex
SITE_URL=http://localhost:3001
```

**Build CLI:** `cd cli && npm run build` → `dist/index.js` (shebang, bin `openpost-cli` only). See `cli/README.md`.

---

## 🔐 RBAC — 5-Tier Permission Matrix

`OWNER(5) > ADMIN(4) > EDITOR(3) > AUTHOR(2) > CONTRIBUTOR(1)` — `WRITER` deprecated → `AUTHOR`.

| Capability | OWNER | ADMIN | EDITOR | AUTHOR | CONTRIBUTOR |
| :--- | :---: | :---: | :---: | :---: | :---: |
| View project | ✅ | ✅ | ✅ | ✅ | ✅ |
| Invite / Approve / Reject / Suspend members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change role (not to OWNER) | ✅ | ✅* | ❌ | ❌ | ❌ |
| Promote to OWNER / demote sole OWNER | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage authors + link user | ✅ | ✅ | ✅ | view | ❌ |
| Create / Edit own draft | ✅ | ✅ | ✅ | ✅ | ✅ (draft) |
| Edit others post | ✅ | ✅ | ✅ | ❌ | ❌ |
| Publish / Schedule | ✅ | ✅ | ✅ | ❌ `submit_review` | ❌ `submit_review` |
| Delete own / others | ✅ | ✅ | ✅ | own only | ❌ |
| Manage media | ✅ | ✅ | ✅ | upload own | upload own |
| Manage webhooks / API tokens | ✅ | ✅ | ❌ | ❌ | ❌ |
| View audit / update settings / delete project | ✅ | ✅/✅/❌ | ❌ | ❌ | ❌ |

*`ADMIN` cannot promote to `OWNER` nor demote sole `OWNER` — `src/app/api/settings/users/route.ts:274` guard.

**Enforcement:** `src/lib/rbac.ts:83` `ROLE_HIERARCHY` + `ROLE_PERMISSIONS` (40+ perms). Every API uses `requireProjectMember(projectId, minRole)` or `requirePermission(projectId, perm)` — never trust client `role`.

---

## 📡 Public API Reference (`/api/v1/*`, cached)

Project scoping: `Authorization: Bearer op_live_...` (hashed SHA256 `integrations.tokenHash`) → `?project=<slug|id>` → `X-OpenPost-Project: <id>` → first project. `resolveProjectContext` in `src/lib/apiToken.ts:103`.

### List Published Articles
```http
GET /api/v1/posts?limit=10&category=engineering&cursor=eyJ...
```
```json
{
  "data": [{ "id": "...", "title": "Scaling PostgreSQL with RLS", "slug": "...", "publishedAt": "2026-09-01T12:00:00Z", "readingTime": 5, "wordCount": 1150, "coverImage": "https://media.yourdomain.com/openpost-media/...webp", "category": {"name":"Engineering","slug":"engineering"}, "authors":[{"name":"Alex","slug":"alex"}], "tags":[{"name":"PostgreSQL","slug":"postgresql"}] }],
  "meta": {"hasMore": false, "cursor": null}
}
```

### Fetch Single Article (301 if slug changed)
```http
GET /api/v1/posts/scaling-postgresql-with-rls
```

### Authors
```http
GET /api/v1/authors?project=<id>&search=alex
POST /api/v1/authors  {name, slug, bio, photoId(same project), linkedUserId(same project approved), socialLinks}
```
Public archive `GET /authors/[slug]` — only `published` posts, 12/page, SEO canonical `public/logo.svg` icon.

### Poll Vote
```http
POST /api/v1/polls/<id>/vote { "optionId": "opt_..." }  # 409 ALREADY_VOTED via fingerprint unique
```

---

## 🧪 Automated Test Suite — 30 tests

```bash
npm run test
```
```text
 RUN  v4.1.11

 ✓ tests/rbac.test.ts              (8 tests)  — 5-tier, AUTHOR/CONTRIBUTOR split, WRITER alias
 ✓ tests/api-token.test.ts         (3 tests)  — op_live_64hex + SHA256
 ✓ tests/storage-security.test.ts  (7 tests)  — magic bytes, mime
 ✓ tests/ssrf-webhook.test.ts      (6 tests)  — private IP / metadata / https
 ✓ tests/slug-reading-time.test.ts (3 tests)
 ✓ tests/webhook-signing.test.ts   (3 tests)

 Test Files  6 passed (6)
      Tests  30 passed (30)
```

---

## 🚢 Production Deployment

### Vercel (recommended)
```bash
npm i -g vercel
vercel --prod   # set env from .env.example in Vercel dashboard
```
Cron: Vercel Cron or EventBridge every 60s → `POST https://yourdomain.com/api/cron/publish` `Authorization: Bearer $CRON_SECRET`

### Docker
```bash
docker build -t openpost:latest .
docker run -p 3000:3000 --env-file .env openpost:latest
```

---

## 🔧 Environment Variables

See `.env.example` — never commit secrets.

| Var | Required | Where | Notes |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | ✅ | server | Supabase pooler `5432/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | client | `https://[ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | client | anon |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | server | never `NEXT_PUBLIC` |
| `R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME` | ⚠️ for media | server | R2, key `openpost-media/<projectId>/<uuid>.<ext>` |
| `R2_PUBLIC_URL` |  | server | `https://media.yourdomain.com` |
| `CRON_SECRET` | ✅ prod | server | `Bearer` for `/api/cron/publish` |
| `REQUIRE_EMAIL_VERIFICATION` |  | server | `true` → block unverified |
| `NEXT_PUBLIC_APP_URL` |  | client | `https://yourdomain.com` |
| `BOOTSTRAP_ADMIN_EMAIL / PASSWORD / NAME` | bootstrap | server | `npm run cms:bootstrap` |

---

## 🩺 Doctor & Bootstrap

```bash
npm run cms:doctor
# ✓ Node≥18, env, DB, tables (profiles/projects/project_members/blogs/authors/media/audit_logs/invites), user_role 5 roles, Supabase, R2

npm run cms:bootstrap -- --email admin@example.com --password StrongPass123 --name "Admin"
# → approved profile + OWNER membership + project; audit bootstrap.owner_created; --force to re-bootstrap
```

---

## 🛡️ Security & Responsible Disclosure

- **Project isolation** `WHERE projectId` + `requireProjectMember` → `404` (hide existence).
- **Publish gated** `EDITOR`+ only, never swallowed `.catch(()=>{})` → `403 FORBIDDEN`.
- **Invite** 10/min/IP, 7-day expiry, masked `tokenPreview`.
- **Media** server-generated key/checksum, `validateMagicBytes`.
- **Webhooks** SSRF block + HMAC `timingSafeEqual` + 5s timeout + secret masked.
- **Cron** `Bearer` only, atomic `updateMany`.
- **Audit** `createAuditLog` on all sensitive actions.

Report: `officialopenpost@outlook.com`. See `supabase/migrations/README.md` `001→019` RLS docs + `DEPLOYMENT.md`.

---

## 📄 License

MIT — `LICENSE`. Keep `public/logo.svg` as brand icon.

<div align="center">
  <sub>Built with ❤️ by the OpenPost Community. <code>openpost-cli v0.1.2</code> — single bin <code>openpost-cli</code> only. Empowering independent writing worldwide.</sub>
</div>
