<div align="center">

<p align="center">
  <img src="public/logo.svg" width="96" height="96" alt="OpenPost Logo" />
</p>

# ⚡ OpenPost

### The Modern, Multi-Tenant Headless CMS & Publishing Studio

**Write like WordPress &middot; Deliver like Sanity &middot; Own like Ghost**

<p align="center">
  <a href="https://github.com/OfficialOpenPost/OpenPost"><img src="https://img.shields.io/badge/tests-30%2F30%20passed-brightgreen.svg?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest Tests" /></a>
  <a href="https://github.com/OfficialOpenPost/OpenPost/releases"><img src="https://img.shields.io/badge/cli-openpost--cli%20v0.2.5-000000.svg?style=for-the-badge&logo=npm&logoColor=white" alt="openpost-cli v0.2.5" /></a>
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
| 🗑️ **Project Deletion & Cascade** | `OWNER` only can delete projects with full automatic database cascade deletion (blogs, revisions, taxonomies, media records, webhooks, audit logs). `ADMIN` cannot delete projects. | `src/app/api/projects/[id]/route.ts:175` |
| 🗑️ **Trash & Admin Purge** | Users move articles to trash with a deletion reason (audited). Only `ADMIN` and `OWNER` can permanently purge articles from the trash bin. | `src/app/api/blogs/[id]/route.ts:367`, `/dashboard/blogs` |
| ⏳ **User Approval Workflow** | Signup → `pending` → admin `Approve/Reject/Suspend/Reactivate` → `approved` only then access. Email verification required for non-owner users via `NEXT_PUBLIC_CMS_URL`. | `src/lib/auth.ts:160`, `/dashboard/team`, `supabase/migrations/016_auto_profile_on_signup.sql` |
| 👤 **Authors vs Users (strict)** | `Author` = public byline `name/slug/bio/photoId/socialLinks/website/email/linkedUserId/projectId` — guest `linkedUserId=null`, linked must be **approved member same project**, photo via `media` same project, slug `unique[projectId,slug]` → `409`, real `_count.blogs`, public `/authors/[slug]` only `published` | `src/app/api/v1/authors/route.ts:8`, `prisma/schema.prisma:82` |
| 👥 **Team & Invites** | `invites` `gen_random_bytes(32)` hex, 7-day expiry, `tokenPreview` masked, rate-limited `10/min/IP`, `OWNER` only for `OWNER` invites | `src/app/api/settings/users/route.ts:40`, `/dashboard/team` |
| 📝 **Blogs & Revisions** | Editor `Tiptap` JSON `type:"doc"`, `EDITOR`+ `publish/schedule`, `AUTHOR/CONTRIBUTOR` only own edit, `301` redirect on published slug change, `blogRevisions` audit | `src/app/api/blogs/route.ts:90`, `src/app/api/blogs/[id]/route.ts:7` |
| 🖼️ **Media Library** | R2 presigned `PUT` + `uploadBuffer`, `validateMagicBytes` PNG/JPEG/WebP/GIF/AVIF/PDF/SVG/MP4, key `openpost-media/<projectId>/<uuid>.<ext>` server-generated, SHA256 server-side, usage `media_usage` | `src/lib/storage.ts:44,108`, `src/app/api/media/route.ts:1`, `/api/media/upload` |
| 🔒 **Webhooks** | `isAllowedWebhookUrl` blocks localhost `10/192.168/172.16/169.254`, HMAC SHA256 `signPayload`, 5s timeout `manual` redirect check, secret masked `secretConfigured` | `src/lib/webhooks.ts:47`, `src/app/api/webhooks/route.ts:5` |
| 🕒 **Scheduled Publishing** | `POST /api/cron/publish` Bearer `CRON_SECRET` only (fail-closed 500), atomic `updateMany where scheduledAt<=now`, triggers webhooks | `src/app/api/cron/publish/route.ts:5` |
| 📊 **Polls** | `single/multiple` + `SHA256 voter fingerprint` dedup `unique[pollId,fingerprint]` `409 ALREADY_VOTED` | `prisma/schema.prisma:258`, `src/app/api/v1/polls/[id]/vote/route.ts` |
| 📡 **Headless API v1** | `GET /api/v1/posts?limit&category&cursor` caches `s-maxage=60`, `project` via `Bearer op_live_64hex` / `?project` / `X-OpenPost-Project` | `src/app/api/v1/posts/route.ts:6`, `src/lib/apiToken.ts:17` |
| 🧾 **Audit Logs** | `audit_logs` on `post.*, user.status_*, project.member_*, author.*, bootstrap.owner_created` | `GET /api/audit`, `/dashboard/audit` |
| 💻 **CLI `openpost-cli` v0.2.5** | **Single bin** `openpost-cli` (no `create-openpost` alias). Health check 8s abort, 3-retries exchange, template copy, `.env.local` + `git init` | `cli/src/index.ts:57`, `cli/package.json:5` |
| 🩺 **Doctor & Bootstrap** | `npm run cms:doctor` checks Node, env, DB, tables, `user_role` 5 roles; `npm run cms:bootstrap -- --email admin@example.com` creates `OWNER` | `scripts/cms.ts` |

### 🔐 RBAC Permissions Matrix

| Permission | OWNER | ADMIN | EDITOR | AUTHOR | CONTRIBUTOR |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Project View & Update** | ✅ | ✅ | ✅ (View) | — | — |
| **Project Cascade Delete** | ✅ | — | — | — | — |
| **Team Management & Invites** | ✅ | ✅ | — | — | — |
| **Manage OWNER Roles** | ✅ | — | — | — | — |
| **Create & Edit Own Posts** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Others' Posts** | ✅ | ✅ | ✅ | — | — |
| **Publish & Schedule Posts** | ✅ | ✅ | ✅ | ✅ (Own) | — (Submit Review) |
| **Move Posts to Trash (with Reason)**| ✅ | ✅ | ✅ | ✅ (Own) | — |
| **Permanently Purge Trashed Posts** | ✅ | ✅ | — | — | — |
| **Media Upload & Management** | ✅ | ✅ | ✅ | ✅ | — |
| **Taxonomies (Categories/Tags)** | ✅ | ✅ | ✅ | — | — |
| **Webhooks & API Tokens** | ✅ | ✅ | — | — | — |
| **Audit Logs Inspection** | ✅ | ✅ | — | — | — |

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
| **CLI** | `openpost-cli` v0.2.5 | `prompts` + `open` + `chalk` |
| **Test** | Vitest 33/33 | rbac 8, api-token 3, storage 7, ssrf 6, slug 3, webhook 3, cron 3 |

### Architecture: Supabase vs Self-Hosted

OpenPost uses **Supabase** as its recommended backend platform, which provides managed PostgreSQL, Auth, and Row Level Security out of the box. The codebase is designed around Supabase's `auth.uid()` function and RLS policies.

**Self-hosted PostgreSQL:** You can run OpenPost with plain PostgreSQL, but you must:
1. Implement `auth.uid()` as a PostgreSQL function (returns the current user ID)
2. Set up an authentication provider that issues JWTs compatible with Supabase's format
3. Manually apply all 24 migrations — they assume `auth.uid()` exists for RLS policies
4. Disable RLS or replicate the policies if your auth differs

**Recommended path:** Use Supabase (free tier works) for auth + RLS. The Docker/self-hosted PostgreSQL path works for the database but requires supplementary auth infrastructure.

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
│   │   ├── projects/         # GET my projects, POST create (OWNER), PATCH (ADMIN), DELETE (OWNER only)
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
├── supabase/migrations/      # 001 → 024_performance_indexes.sql (run in order)
├── cli/                      # openpost-cli v0.2.5 → dist/index.js (single bin)
│   ├── src/index.ts          # init/doctor/login/logout/help/version, healthCheck 8s, 3-retries exchange, copy template, .env.local
│   └── package.json          # bin: openpost-cli only, v0.2.5
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
2. Run `supabase/migrations/` **001 → 024** sequentially (paste → Run → Success)
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
NEXT_PUBLIC_CMS_URL="https://your-cms-domain.vercel.app"
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

## 💻 CLI — `openpost-cli` v0.2.5 (single bin)

> **Always use `openpost-cli`**. The legacy alias `create-openpost` is **removed** (v0.2.5). Use `npx openpost-cli` everywhere.

```bash
npx openpost-cli --help
npx openpost-cli --version   # → openpost-cli v0.2.5
npx openpost-cli doctor --cms-url http://localhost:3000
npx openpost-cli init my-blog
npx openpost-cli init my-blog --cms-url https://cms.example.com --yes
```

**Workflow (Sanity-like):**
```
? CMS URL: http://localhost:3000  → healthCheck /api/health (8s, fail-fast)
✓ Connected → open /cli/connect → paste OP-XXXX (10-min single-use)
→ POST /api/cli/exchange (3 retries, op_live_64hex, returns siteConfig)
? Project dir: my-blog → copy templates/nextjs-blog → .env.local (with site config env vars)
→ customizes layout.tsx, Header.tsx, Footer.tsx, page.tsx with project name/tagline
→ git init

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

### Roles & Legacy Compatibility

OpenPost uses a **canonical 5-role model** in the `user_role` PostgreSQL enum: `OWNER`, `ADMIN`, `EDITOR`, `AUTHOR`, `CONTRIBUTOR`. The legacy alias `WRITER` is preserved in the enum for backward compatibility but is automatically normalized to `AUTHOR` via `normalizeRoleStrict()` in `src/lib/rbac.ts:96`. All API endpoints and RLS policies operate on the canonical 5-role set. The `profiles.role` column (Supabase-level) is separate from `project_members.role` (project-scoped RBAC) — the project role is authoritative for permission checks.

---

## 📡 Public API Reference (`/api/v1/*`, cached)

### Authentication Contract

All `/api/v1/*` endpoints use a single canonical auth method: **`Authorization: Bearer op_live_<64hex>`**. The project is resolved in this priority order (`resolveProjectContext` in `src/lib/apiToken.ts:103`):

1. `Authorization: Bearer op_live_...` header (project derived from token)
2. `?project=<slug|id>` query parameter
3. `X-OpenPost-Project: <id>` header
4. First project in database (fallback)

**Which endpoints need a token?**

| Endpoint | Auth Required | Notes |
|---|---|---|
| `GET /api/v1/posts` | ✅ Bearer token | Published posts, project-scoped |
| `GET /api/v1/posts/[slug]` | ✅ Bearer token | Single published post |
| `GET /api/v1/authors` | ✅ Bearer token | Authors, project-scoped |
| `GET /api/v1/tags` | ✅ Bearer token | Tags, project-scoped |
| `GET /api/v1/categories` | ✅ Bearer token | Categories, project-scoped |
| `GET /api/v1/polls` | ✅ Bearer token | Polls, project-scoped |
| `POST /api/v1/polls/[id]/vote` | ✅ Bearer token | Vote, fingerprint dedup |
| `POST /api/v1/authors` | ✅ Bearer token | Create author |
| `GET /api/health` | ❌ None | Public health check |
| `GET /blog/[slug]` | ❌ None | Public blog render |
| `GET /authors/[slug]` | ❌ None | Public author archive |
| Dashboard `/api/blogs`, `/api/media`, etc. | 🔒 Supabase session | Admin API, requires login + project membership |

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
- **Prisma Integration:** Automatically triggers `postinstall: "prisma generate"` during deployment.
- **Cron Scheduler:** Pre-configured in `vercel.json` to trigger `/api/cron/publish` every 60s with `Authorization: Bearer $CRON_SECRET`.

> **Note:** Publishing precision depends on your cron frequency. Posts scheduled for a specific time will be published on the next cron run after their `scheduledAt` time. With a 60s cron interval, posts may publish up to 60 seconds late.

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
| `NEXT_PUBLIC_CMS_URL` | ✅ prod | client | `https://your-cms-domain.vercel.app` |
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

**Bootstrap creates:** A user profile with `approved` status, a default project, and `OWNER` membership. The first admin is immediately able to access the dashboard and invite team members.

---

## 🛡️ Security & Responsible Disclosure

- **Project isolation** `WHERE projectId` + `requireProjectMember` → `404` (hide existence).
- **Publish gated** `EDITOR`+ only, never swallowed `.catch(()=>{})` → `403 FORBIDDEN`.
- **Invite** 10/min/IP, 7-day expiry, masked `tokenPreview`.
- **Media** server-generated key/checksum, `validateMagicBytes`.
- **Webhooks** SSRF block + HMAC `timingSafeEqual` + 5s timeout + secret masked.
- **Cron** `Bearer` only, atomic `updateMany`.
- **Audit** `createAuditLog` on all sensitive actions.

### Webhook Delivery Behavior

Webhooks are delivered with a **5-second timeout** per attempt. Each webhook event is delivered **once** — there is no automatic retry on failure. The delivery is logged to `webhook_deliveries` with status (`success`/`failed`), response code, and error message. For critical workflows, implement retry logic in your webhook receiver or poll the CMS API as a fallback.

**Supported events:** `post.created`, `post.updated`, `post.published`, `post.scheduled`, `post.deleted`, `post.untrashed`, `category.created`, `category.updated`, `category.deleted`, `tag.created`, `media.uploaded`.

**Security:** All payloads are signed with HMAC-SHA256 (`X-Webhook-Signature` header). Verify using your webhook secret. SSRF protection blocks `localhost`, `10.x`, `192.168.x`, `172.16.x`, `169.254.x`.

Report: `officialopenpost@outlook.com`. See [SECURITY.md](SECURITY.md) and `supabase/migrations/README.md` `001→024` RLS docs + `DEPLOYMENT.md`.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

```bash
git clone https://github.com/your-username/OpenPost.git
cd OpenPost
npm ci
cp .env.example .env  # configure
npm run dev
```

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📄 License

MIT — `LICENSE`. Keep `public/logo.svg` as brand icon.

<div align="center">
  <sub>Built with ❤️ by the OpenPost Community. <code>openpost-cli v0.2.5</code> — single bin <code>openpost-cli</code> only. Empowering independent writing worldwide.</sub>
</div>
