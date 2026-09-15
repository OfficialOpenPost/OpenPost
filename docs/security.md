# Security & Access Control (RBAC)

OpenPost is architected with defense-in-depth security principles across the database, application layer, and network boundaries.

---

## 1. Row-Level Security (RLS) Deep Dive

OpenPost enforces Row-Level Security on every table in PostgreSQL via Supabase migrations. Even if an attacker executes raw SQL via the client Supabase library, RLS policies prevent unauthorized reads or writes:

- **Public Access**: Unauthenticated visitors can only read blog posts where `status = 'published'`. Drafts, revisions, and trash records cannot be queried by the public.
- **Authenticated Access**: Contributors can only edit their own drafts. Authors can edit and publish their own drafts. Editors and above can edit any post in their project.
- **Admin Access**: Only users with the `ADMIN` role or project `OWNER` can modify workspace settings, invite members, suspend users, or generate API keys.
- **Project Isolation**: Every query is scoped by `projectId`. A user in Project A cannot access data from Project B, even with a valid session.

### Key RLS Migrations

| Migration | Purpose |
|-----------|---------|
| `004_rls_policies.sql` | Base RLS on blogs, media, categories, tags |
| `014_project_rls.sql` | Project-scoped access for all tenant data |
| `017_rls_hardening.sql` | Strict role checks on write operations |
| `019_rls_final.sql` | Public read for published posts only |

---

## 2. Role-Based Access Control (RBAC) Matrix

OpenPost uses a 5-tier role hierarchy: `OWNER(5) > ADMIN(4) > EDITOR(3) > AUTHOR(2) > CONTRIBUTOR(1)`.

`WRITER` is a deprecated alias for `AUTHOR` — normalized via `normalizeRoleStrict()` in `src/lib/rbac.ts`.

### Permissions Matrix

| Permission | OWNER | ADMIN | EDITOR | AUTHOR | CONTRIBUTOR |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Project** | | | | | |
| `project.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `project.update` | ✅ | ✅ | — | — | — |
| `project.delete` | ✅ | — | — | — | — |
| **Members** | | | | | |
| `members.view` | ✅ | ✅ | ✅ | — | — |
| `members.invite` | ✅ | ✅ | — | — | — |
| `members.approve` | ✅ | ✅ | — | — | — |
| `members.suspend` | ✅ | ✅ | — | — | — |
| `members.update_role` | ✅ | ✅ | — | — | — |
| `members.remove` | ✅ | ✅ | — | — | — |
| **Authors** | | | | | |
| `authors.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `authors.create` | ✅ | ✅ | ✅ | — | — |
| `authors.update` | ✅ | ✅ | ✅ | — | — |
| `authors.delete` | ✅ | ✅ | — | — | — |
| `authors.link_user` | ✅ | ✅ | — | — | — |
| **Posts** | | | | | |
| `posts.create` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `posts.edit_own` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `posts.edit_others` | ✅ | ✅ | ✅ | — | — |
| `posts.delete_own` | ✅ | ✅ | ✅ | ✅ | — |
| `posts.delete_others` | ✅ | ✅ | ✅ | — | — |
| `posts.publish_own` | ✅ | ✅ | ✅ | ✅ | — |
| `posts.publish_others` | ✅ | ✅ | ✅ | — | — |
| `posts.schedule` | ✅ | ✅ | ✅ | — | — |
| `posts.unpublish` | ✅ | ✅ | ✅ | — | — |
| `posts.submit_review` | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Media** | | | | | |
| `media.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `media.upload` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `media.delete` | ✅ | ✅ | ✅ | — | — |
| **Settings** | | | | | |
| `settings.view` | ✅ | ✅ | — | — | — |
| `settings.update` | ✅ | ✅ | — | — | — |
| **Audit** | | | | | |
| `audit.view` | ✅ | ✅ | — | — | — |

### Critical Rules

1. **Never trust `role` from body/query/localStorage**. The server always verifies via `requireProjectMember(projectId)` which queries the database.
2. **ADMIN cannot promote to OWNER** nor demote the sole OWNER (`src/app/api/settings/users/route.ts:274`).
3. **CONTRIBUTOR** can only draft and submit for review — never publish directly.
4. **AUTHOR** can publish their own posts but cannot edit others' posts.
5. **EDITOR** can edit and publish any post in their project.
6. Every project-scoped query must include `WHERE projectId` + `requireProjectMember`.

### Source Code Reference

| File | Purpose |
|------|---------|
| `src/lib/rbac.ts` | Role hierarchy, `normalizeRoleStrict()`, permission checks |
| `src/lib/auth.ts` | `getCurrentUser()`, `requireAuthenticatedUser()`, `requireProjectMember()`, `requirePermission()` |
| `src/app/api/settings/users/route.ts` | Invite/status management with OWNER-only guards |

---

## 3. Server-Side Request Forgery (SSRF) Protection

When dispatching webhooks or resolving third-party embeds:

- **URL Validation**: `isAllowedWebhookUrl()` in `src/lib/webhooks.ts` blocks localhost, `127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, and `169.254.169.254` (AWS metadata).
- **DNS Rebinding Prevention**: Resolved IP addresses are re-verified before socket connection.
- **Timeout Enforcement**: All outbound HTTP requests use a 5-second timeout via `deliverWebhook()`.
- **Manual Redirect Check**: Webhook delivery follows redirects manually and re-validates each redirect target.

---

## 4. XSS Prevention with Structured JSON AST

OpenPost eliminates XSS vulnerabilities through its content architecture:

- **ProseMirror JSON Storage**: Articles are stored as structured JSON nodes, not raw HTML.
- **React DOM Rendering**: `SharedRender.tsx` creates virtual DOM elements for each block — text content is automatically HTML-escaped by React.
- **No Raw HTML Injection**: The public renderer never uses `dangerouslySetInnerHTML` for user content (only for controlled JSON-LD data and static editor styles).
- **SVG Sanitization**: Uploaded SVGs are scanned for `<script>`, `on*` event handlers, and `<foreignObject>` tags.

---

## 5. API Token Security

- **SHA-256 Hashing**: Tokens are hashed before storage via `hashToken()` in `src/lib/apiToken.ts`. Raw tokens are never stored in the database.
- **Token Prefix**: Only the first 6 characters (`op_live_...`) are stored for display/debugging.
- **Project Scoping**: Each token is bound to a single project. The `X-OpenPost-Project` header must match the token's project.
- **Bearer Authentication**: All v1 API requests require `Authorization: Bearer op_live_<64hex>`.

---

## 6. File Upload Security

- **MIME Allowlist**: Only PNG, JPEG, WebP, GIF, AVIF, PDF, SVG, and MP4 are accepted.
- **Magic Byte Validation**: `validateMagicBytes()` in `src/lib/storage.ts` verifies file content matches declared MIME type.
- **Server-Side Key Generation**: Upload keys are generated server-side as `openpost-media/<projectId>/<uuid>.<ext>` — prevents path traversal.
- **SHA-256 Checksum**: Computed server-side on the actual uploaded bytes.

---

## 7. Voter Fraud Prevention (Polls)

Poll voting prevents ballot stuffing through:

- **Fingerprint**: SHA-256 hash of `client_ip + user_agent + project_salt`.
- **Unique Constraint**: `UNIQUE (poll_id, voter_fingerprint)` in the database.
- **Rate Limiting**: 10 votes per minute per IP on `/api/v1/polls/[id]/vote`.
- **Conflict Response**: Re-voting triggers `HTTP 409 Conflict`.

---

## 8. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/settings/users` (invites) | 10 requests | 1 minute |
| `POST /api/cli/exchange` | 20 requests | 1 minute |
| `POST /api/v1/polls/[id]/vote` | 10 requests | 1 minute |
| `POST /api/settings/export` | 5 requests | 1 minute |

Supabase Auth handles rate limiting for login/signup endpoints.

---

## 9. Environment Variable Security

- **Never expose secrets client-side**: All `NEXT_PUBLIC_*` variables are legitimate public values (Supabase URL, anon key, app URL).
- **Secrets stay server-side**: `SUPABASE_SERVICE_ROLE_KEY`, `R2_SECRET_ACCESS_KEY`, `CRON_SECRET`, `DATABASE_URL` are never prefixed with `NEXT_PUBLIC_`.
- **CORS**: No `Access-Control-Allow-Origin: *` on authenticated routes.

---

## 10. Security Audit Results

| Check | Status | Notes |
|-------|--------|-------|
| API Authorization | ✅ PASS | All endpoints verify auth + project membership |
| Project Isolation | ✅ PASS | All queries scoped by `projectId` |
| File Uploads | ✅ PASS | MIME allowlist + magic byte validation |
| XSS Prevention | ✅ PASS | ProseMirror JSON AST, no raw HTML injection |
| API Tokens | ✅ PASS | SHA-256 hashed, never stored raw |
| Rate Limiting | ✅ PASS | Applied to sensitive endpoints |
| Secrets Exposure | ✅ PASS | No secrets in `NEXT_PUBLIC_*` variables |
| SSRF Protection | ✅ PASS | Private IP blocking, DNS rebinding prevention |

---

## 11. Responsible Disclosure

If you discover a security vulnerability:

- **Email:** [officialopenpost@outlook.com](mailto:officialopenpost@outlook.com)
- **Subject:** `[Security] OpenPost — brief description`
- Do **not** open a public GitHub issue for security reports.
- We aim to acknowledge within 24 hours and provide a fix timeline.

All reports are handled confidentially.
