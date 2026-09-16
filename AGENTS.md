<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OpenPost — Agent Guide (AI Coding Agents)

> **Product:** Multi-tenant headless CMS & Publishing Studio (Next.js 16 App Router + Supabase + Prisma + R2 + Tiptap).
> **Package manager:** npm (no yarn/pnpm in repo). **CLI:** `openpost-cli` v0.2.5 only (bin `openpost-cli`, no `create-openpost` alias).
> **Database:** Supabase (managed PostgreSQL + Auth + RLS). Self-hosted PostgreSQL requires manual auth setup.
> **Read this before touching code.**

## 1) Stack & Structure

```
D:/Openpost
├── src/app/                 # Next.js App Router (/(dashboard), /api, /auth, /blog)
│   ├── api/                 # Route handlers: blogs, media, authors, projects, settings, v1, cli, cron, webhooks, audit
│   ├── (dashboard)/dashboard/ # Blogs, Media, Categories, Tags, Authors, Team, Webhooks, Audit, Settings, Editor
│   └── middleware.ts        # (proxy.ts in Next 16) — Supabase session refresh, auth guard
├── src/lib/                 # rbac.ts (5-tier), auth.ts (getCurrentUser, require*), db.ts, supabase/, storage.ts (R2), webhooks.ts, apiToken.ts, rateLimit.ts
├── src/components/project/  # ProjectSwitcher (localStorage openpost_active_project_id + projectChanged event)
├── prisma/schema.prisma     # UserRole enum OWNER/ADMIN/EDITOR/AUTHOR/CONTRIBUTOR (+ WRITER alias), Profile, Project, ProjectMember, Author, Blog, Media...
├── supabase/migrations/     # 001 → 021_site_config_and_cleanup.sql (run in order via SQL Editor)
├── cli/                     # openpost-cli v0.2.5 → dist/index.js (single bin openpost-cli)
├── templates/nextjs-blog/   # Next.js 15 blog starter copied by CLI
├── public/logo.svg          # Icon used in README & UI
├── scripts/cms.ts           # cms:doctor, cms:bootstrap (OWNER creation)
└── tests/                   # vitest: rbac, api-token, storage-security, ssrf-webhook, slug, webhook-signing
```

## 2) Canonical RBAC (5-tier, no collapse)

`OWNER(5) > ADMIN(4) > EDITOR(3) > AUTHOR(2) > CONTRIBUTOR(1)` — `WRITER` is deprecated alias → `AUTHOR` via `normalizeRoleStrict()` in `src/lib/rbac.ts:96`.

**Permissions:** `project.view/update/delete`, `members.view/invite/approve/reject/suspend/update_role/remove`, `authors.view/create/update/delete/link_user`, `posts.create/edit_own/edit_others/delete_own/delete_others/publish_own/publish_others/schedule/unpublish/submit_review`, `media.view/upload/delete`, `settings.view/update`, `audit.view` + legacy `post.*`, `taxonomy.manage` for BC.

Rules:
- **Never** trust `role` from body/query/localStorage. DB via `requireProjectMember(projectId)` is source.
- `CONTRIBUTOR` drafts only → `submit_review`; `AUTHOR` own drafts + `publish_own` gated; `EDITOR`+ can `edit_others/publish_others/schedule`; `ADMIN` invite/approve/suspend; `OWNER` delete project + manage OWNER.
- `ADMIN` cannot promote to `OWNER` nor demote sole `OWNER` (`src/app/api/settings/users/route.ts:274` guard).
- Every project-scoped query must `WHERE projectId` + `requireProjectMember` (see `src/app/api/blogs/route.ts:90`, `src/app/api/media/route.ts:5`, `src/app/api/webhooks/route.ts:5`).

## 3) Auth & Session

- **Source:** Supabase Auth (`src/lib/supabase/server.ts` + `client.ts`). `getCurrentUser()` in `src/lib/auth.ts:47` loads `profiles` + `project_members` (+ owned projects as `OWNER`), derives `role` via `ROLE_HIERARCHY`.
- **Status:** `pending/approved/rejected/suspended` (`ProfileStatus`), optional `REQUIRE_EMAIL_VERIFICATION=true` checks `email_confirmed_at`.
- **Enforce:** `requireAuthenticatedUser()` 401, `requireApprovedUser()` 403 `PENDING_APPROVAL/ACCOUNT_SUSPENDED`, `requireProjectMember(projectId, minRole)` 404 (hide existence).
- **Never** swallow with `.catch(()=>{})` on publish/role checks — must `throw AuthError` → 403 `FORBIDDEN`.

## 4) Multi-tenancy

- `openpost_active_project_id` in localStorage is **UI preference only**. Server re-validates `authenticated user + project + membership + role + permission` per request (`src/lib/auth.ts:181`).
- `ProjectSwitcher.tsx:72` writes localStorage + `dispatchEvent('projectChanged')`; dashboards (`blogs, media, categories, tags, authors, team`) refetch on that event and send `?projectId` + `X-OpenPost-Project`.
- Fallback `resolveProjectContext()` in `src/lib/apiToken.ts` for public `v1` (Bearer `op_live_64hex`, then `?project`, then `X-OpenPost-Project`, then first project).

## 5) Authors vs Users (strict)

- `User` = login identity (`profiles` + `users`). `Author` = public byline (`authors` table `src/app/api/v1/authors/route.ts:8`): `name/slug/bio/photoId/socialLinks/website/email/linkedUserId/projectId`. Guest `linkedUserId=null`, linked must be approved member same `projectId` (`route.ts:90`). Photo via `media` same project. Slug `unique [projectId,slug]` → 409 `SLUG_EXISTS`. Post count real `_count.blogs` (not hardcoded). Public `/authors/[slug]` only `status=published`.

## 6) Team & Invites

- `invites` table `encode(gen_random_bytes(32),'hex')` 7-day expiry, masked `tokenPreview` in `GET /api/settings/users`.
- `POST /api/settings/users` rate-limited 10/min/IP (`src/lib/rateLimit.ts`), `OWNER`-only for `OWNER` invites.
- UI: `Team & Invites` (`/dashboard/team`) pending queue, invite form, role select 5 roles, status `Approve/Reject/Suspend/Reactivate`, audit `project.member_added/invite_created/user.status_*`.

## 7) Content & Media

- **Blogs:** `src/app/api/blogs/route.ts` create/update strictly project-scoped, `EDITOR`+ to `publish/schedule`, `AUTHOR/CONTRIBUTOR` only own edit, `301` redirect on slug change if published, revision via `blogRevisions`.
- **Media:** `R2` presigned `PUT` `src/lib/storage.ts:44` + `uploadBuffer`, `validateMagicBytes` PNG/JPEG/WebP/GIF/AVIF/PDF/SVG/MP4, key `openpost-media/<projectId>/<uuid>.<ext>` server-generated, checksum SHA256 server-side (`src/app/api/media/route.ts:1`, `/upload`).
- **Webhooks:** `isAllowedWebhookUrl` blocks localhost/10/192.168/172.16/169.254, `HMAC SHA256` `signPayload`, `deliverWebhook` 5s timeout, `manual` redirect check, secret masked `secretConfigured` (`src/app/api/webhooks/route.ts`).

## 8) Cron & Audit

- `POST /api/cron/publish` requires `Authorization: Bearer CRON_SECRET` (fail-closed 500 if missing in prod), no `?secret=`, atomic `updateMany where status=scheduled`.
- `audit_logs` via `createAuditLog()` on `post.*, user.status_*, project.member_*, author.*, bootstrap.owner_created` → `GET /api/audit` + UI `/dashboard/audit`.

## 9) CLI (`openpost-cli` v0.2.5, single bin)

```
npx openpost-cli [init|dev|build|start|status|upgrade|reconnect|doctor|login|logout|help|version] [--cms-url URL] [--code OP-XXXX] [--project dir] [--port N] [--template-only] [--skip-health] [--yes]
```

- **init** prompts `cmsUrl` → health check → open `${cmsUrl}/cli/connect` → paste `OP-XXXX` → `POST /api/cli/exchange` (3 retries, hashed token, 10-min single-use) → receives `siteConfig` → prompt `projectName` → `templates/nextjs-blog` → `.env.local` → customizes `layout.tsx`, `Header.tsx`, `Footer.tsx`, `page.tsx` → `git init`.
- **dev** finds project root (`.env.local`), validates CMS connection, runs `npm run dev -- -p PORT`.
- **build** validates `.env.local`, installs deps if missing, runs `npm run build`.
- **start** checks `.next` build exists, runs `npm run start -- -p PORT`.
- **status** shows project config, Node/npm/CLI versions, `node_modules`/`.next` status, CMS health.
- **upgrade** copies latest template (preserves `.env.local`/`node_modules`/`.next`/`.git`), shows dep changes, runs `npm install`.
- **reconnect** switches CMS URL in `.env.local`, re-authorizes via browser flow.
- **doctor** checks `/api/health` + template.
- Build: `cd cli && npm run build` → `dist/index.js` (shebang, `openpost-cli` bin only).

## 10) Commands to Verify (run in order)

```bash
npm ci
npx prisma generate
npm run typecheck   # tsc --noEmit → 0 errors
npm run test        # vitest 30/30 (rbac 8, api-token 3, storage 7, ssrf 6, slug 3, webhook-signing 3)
npm run build       # next build (Turbopack) → 67 pages incl. /dashboard/team + /authors/[slug]
npm run cms:doctor  # checks Node≥18, env, DB connection, tables, user_role enum 5 roles
npm run cms:bootstrap -- --email admin@example.com --password StrongPass123  # creates OWNER
cd cli && npm run build && node dist/index.js --help  # → openpost-cli v0.2.5
node dist/index.js doctor --cms-url http://localhost:3000  # health
```

## 11) Editor & Frontend Contract

- Tiptap editor outputs `{type:"doc",content:[...]}` JSON, validated `z.any().passthrough()` → `docSchema` strict in future; always `countWords` + `readingTime`.
- Preview parity: editor preview uses same render as public `/blog/[slug]` (shared package ideal).
- Autosave: debounce 2s + blur + beforeunload `sendBeacon` + 30s fallback → `IndexedDB` recovery offer.
- Project-scoped fetches must include `projectId` + header; never `using(true)` for tenant data (RLS `014/017/019`).

## 12) Env & Deployment

- `.env.example` lists `DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, R2_* , NEXT_PUBLIC_APP_URL, CRON_SECRET, REQUIRE_EMAIL_VERIFICATION, BOOTSTRAP_ADMIN_*`. Never `NEXT_PUBLIC_` for secrets.
- Migrations `supabase/migrations/README.md` 001→021. `018` backfills `projectId IS NULL` to default project.
- Vercel: `vercel --prod` + env + cron `POST /api/cron/publish` `Authorization: Bearer CRON_SECRET` every minute.
- `public/logo.svg` is icon for README & UI.

## 13) Do / Don’t

- **Do:** reuse `requirePermission(projectId, perm)`, `hasPermission`, `hasMinimumRole`, `withDbRetry`, `createAuditLog`, `slugify`, `validateMagicBytes`, `isAllowedWebhookUrl`.
- **Don’t:** add `create-openpost` bin, expose `secret/token` in GET, trust client `projectId` without check, add `Access-Control-Allow-Origin: *` on auth routes, swallow auth errors, create `ADMIN` via public signup.

## 14) Definition of Done (check before PR)

- [ ] `OWNER/ADMIN/EDITOR/AUTHOR/CONTRIBUTOR` matrix enforced server-side (author cannot publish, contributor cannot edit others, admin cannot demote sole owner)
- [ ] Invite → masked token, rate-limited, 7-day expiry, same-project link
- [ ] Author `photoId/linkedUserId` same-project validated, guest allowed, slug unique per project, postCount real
- [ ] Project isolation: `Project A user → Project B id` returns 404/403 (test `blogs, media, authors, webhooks, invites`)
- [ ] Media `key`/`checksum` server-generated, `validateMagicBytes` on upload
- [ ] Webhook SSRF + HMAC + timeout + secret masked
- [ ] Cron Bearer-only + atomic
- [ ] `Team & Invites` + `Authors` + `Audit Logs` visible in `/dashboard` nav
- [ ] `openpost-cli` help/version/doctor work, `npx openpost-cli init my-blog` scaffolds `.env.local`
- [ ] `npm run typecheck/test/build/cms:doctor` green, no `WRITER` collapse
