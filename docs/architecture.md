# OpenPost Architecture

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.3 |
| UI | React | 19.2.8 |
| ORM | Prisma | 6.14.0 |
| Database | Supabase (managed PostgreSQL) | — |
| Auth | Supabase Auth (`@supabase/ssr`) | 0.12.5 |
| Editor | Tiptap (ProseMirror) | 2.25.0+ |
| Storage | Cloudflare R2 (S3-compatible) | AWS SDK v3 |
| Styling | Tailwind CSS | 4.x |
| Validation | Zod | 3.25.0 |
| Testing | Vitest | 4.1.11 |
| Language | TypeScript (strict) | 5.x |

## Directory Structure

```
D:/Openpost
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Route handlers
│   │   │   ├── blogs/route.ts        # CRUD for posts
│   │   │   ├── media/route.ts        # Upload, presigned URLs
│   │   │   ├── authors/route.ts      # Public bylines
│   │   │   ├── categories/route.ts   # Taxonomy
│   │   │   ├── tags/route.ts         # Taxonomy
│   │   │   ├── settings/             # Site & user management
│   │   │   ├── v1/                   # Public API (token-authed)
│   │   │   ├── cli/                  # CLI auth exchange
│   │   │   ├── cron/publish          # Scheduled publish worker
│   │   │   └── webhooks/             # Webhook management
│   │   ├── (dashboard)/dashboard/    # Admin UI pages
│   │   ├── auth/                     # Login/signup flows
│   │   ├── blog/                     # Public blog routes
│   │   └── middleware.ts             # Auth guard (proxy in Next 16)
│   ├── components/
│   │   ├── editor/                   # Tiptap editor + extensions
│   │   │   ├── extensions.ts         # Extension registry
│   │   │   ├── floating/             # FloatingImageNode + view
│   │   │   ├── blocks/               # Callout, Gallery, Faq, etc.
│   │   │   └── extensions/           # FontSize, LineHeight, TrailingNode
│   │   ├── render/SharedRender.tsx   # Public content renderer
│   │   └── project/                  # ProjectSwitcher
│   ├── lib/
│   │   ├── auth.ts                   # Session, RBAC guards
│   │   ├── rbac.ts                   # 5-tier role model
│   │   ├── db.ts                     # Prisma client + retry
│   │   ├── cache.ts                  # In-memory TTL query cache
│   │   ├── storage.ts                # R2 upload/delete/validate
│   │   ├── webhooks.ts               # HMAC signing, delivery, SSRF
│   │   ├── apiToken.ts               # Integration token auth
│   │   ├── rateLimit.ts              # In-memory rate limiter
│   │   ├── slug.ts                   # Slug generation
│   │   ├── publish.ts                # Word count, reading time
│   │   ├── env.ts                    # Environment validation
│   │   └── supabase/                 # Server + client Supabase
│   └── lib/prosemirror-patch.ts      # ProseMirror compatibility patch
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── seed.ts                       # Seed script
├── cli/                              # openpost-cli package
├── scripts/cms.ts                    # cms:doctor, cms:bootstrap
├── tests/                            # Vitest test suites
├── supabase/migrations/              # SQL migrations (001–024)
├── templates/nextjs-blog/            # Blog starter template
└── package.json
```

## Data Flow

```
Editor (Tiptap)                  API Layer                     Database              Public
─────────────────               ─────────────                  ────────              ──────
┌──────────────┐   POST JSON   ┌──────────────┐  Prisma ORM  ┌──────────────┐  GET /api/v1  ┌──────────────┐
│ ProseMirror  │ ──────────── │ /api/blogs   │ ─────────── │ blogs        │ ──────────── │ Public blog  │
│ JSON AST     │              │ route.ts     │              │ editor_doc   │              │ pages        │
│              │              │              │              │ rendered_html│              │              │
│ editorDoc    │              │ Zod validate │              │ content (JSON│              │ SharedRender │
│ renderedHtml │              │ RBAC check   │              │   legacy)    │              │ .tsx         │
│ content      │              │ slug resolve │              │              │              │              │
└──────────────┘              └──────────────┘              └──────────────┘              └──────────────┘
```

### Step-by-step

1. **Editor** produces ProseMirror JSON (`editorDocument`) and optional pre-rendered HTML (`renderedHtml`).
2. **API route** (`src/app/api/blogs/route.ts`) validates via Zod, checks RBAC (`requireApprovedUser`, `requireProjectMember`, `hasPermission`).
3. **Slug resolution** ensures uniqueness within the project; creates `Redirect` record on published slug change.
4. **Prisma** writes to `blogs` table (JSON columns `editor_document`, `content`, `rendered_html`).
5. **BlogRevision** is created on every save for version history.
6. **Webhooks** fire asynchronously on `post.published`, `post.created`, etc.
7. **Public API** (`/api/v1/*`) serves content using integration token auth (`op_live_*`).
8. **SharedRender** (`src/components/render/SharedRender.tsx`) renders ProseMirror JSON to React components for both preview and public views.

## Multi-Tenancy Model

OpenPost uses a **project-based multi-tenancy** model:

- **Project** (`prisma/schema.prisma:384`) is the tenant boundary. All content (blogs, media, authors, categories, tags, webhooks) is scoped to a project via `projectId`.
- **ProjectMember** (`schema.prisma:431`) links users to projects with a role.
- **ProjectSwitcher** stores the active project in `localStorage` as `openpost_active_project_id` — this is a UI preference only. Server always re-validates membership.
- Every API query includes `WHERE projectId = ?` to enforce isolation.
- Cross-tenant access returns **404** (not 403) to avoid leaking project existence.

```typescript
// src/app/api/blogs/route.ts:256 — strict project scoping
await requireProjectMember(targetProjectId, "CONTRIBUTOR");
```

## Content Storage Format

Content is stored in three formats for different purposes:

| Column | Type | Purpose |
|---|---|---|
| `editor_document` | `JsonB` | ProseMirror JSON AST — canonical source of truth |
| `content` | `Json` | Legacy JSON content — backward compatibility |
| `rendered_html` | `Text` | Pre-rendered HTML for fast public serving |

The **editor** writes `editorDocument` (ProseMirror JSON). On save, the API also stores the same JSON in `content` for backward compatibility. `rendered_html` is optionally pre-computed by the client before save.

## Authentication Flow

```
Browser → Supabase Auth (cookies: sb-*) → getCurrentUser() → profiles + project_members → AuthUser
```

1. User authenticates via Supabase Auth (email/password or OAuth).
2. `getCurrentUser()` (`src/lib/auth.ts:74`) reads Supabase session cookies, fetches user from Supabase Auth.
3. Looks up `profiles` record (auto-creates with `pending` status if missing).
4. Loads `project_memberships` + owned projects (OWNER role auto-inferred from `projects.ownerId`).
5. Caches result in-memory for 15 seconds to reduce external calls.
6. Guards: `requireAuthenticatedUser()` (401), `requireApprovedUser()` (403), `requireProjectMember()` (404).

## RBAC Model

Five-tier role hierarchy: **OWNER(5) > ADMIN(4) > EDITOR(3) > AUTHOR(2) > CONTRIBUTOR(1)**

```
┌─────────────────────────────────────────────────────────────┐
│  OWNER  → Full control: delete project, manage all roles   │
│  ADMIN  → Invite/remove members, manage settings, all CRUD │
│  EDITOR → Edit any post, publish/unpublish, manage media   │
│  AUTHOR → Create posts, edit/publish own, upload media     │
│  CONTRIBUTOR → Create drafts only, submit for review       │
└─────────────────────────────────────────────────────────────┘
```

Key rules enforced server-side (`src/lib/rbac.ts`):
- `ADMIN` cannot promote to `OWNER` or demote sole `OWNER`
- `WRITER` is deprecated alias → normalized to `AUTHOR` via `normalizeRoleStrict()`
- Permissions are checked via `hasPermission(role, permission)` against `ROLE_PERMISSIONS` map
- Never trust client-side role — always verify via `requireProjectMember(projectId)` from DB

See [rbac.md](./rbac.md) for the full permissions matrix.

## Key Source References

| Concern | File | Line |
|---|---|---|
| Database schema | `prisma/schema.prisma` | 1–531 |
| Auth + session | `src/lib/auth.ts` | 74–237 |
| RBAC roles/permissions | `src/lib/rbac.ts` | 1–216 |
| Editor extensions | `src/components/editor/extensions.ts` | 1–184 |
| Content renderer | `src/components/render/SharedRender.tsx` | 356–865 |
| R2 storage | `src/lib/storage.ts` | 1–190 |
| Blog CRUD API | `src/app/api/blogs/route.ts` | 1–872 |
| Webhook delivery | `src/lib/webhooks.ts` | 130–277 |
| API token auth | `src/lib/apiToken.ts` | 1–148 |
