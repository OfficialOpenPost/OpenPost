# Security & Access Control (RBAC)

OpenPost is architected with defense-in-depth security principles across the database, application layer, and network boundaries.

---

## 1. Row-Level Security (RLS) Deep Dive

OpenPost enforces Row-Level Security on every table in PostgreSQL. Even if an attacker executes raw SQL via the client Supabase library, RLS policies prevent unauthorized reads or writes:

- **Public Access**: Unauthenticated visitors can only read blog posts where `status = 'published'`. Drafts, revisions, and trash records cannot be queried by the public.
- **Authenticated Access**: Writers can only edit drafts belonging to their associated projects.
- **Admin Access**: Only users with the `admin` role or project `owner` can modify workspace settings, invite members, or generate API keys.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Capability | ADMIN / Owner | EDITOR | WRITER | CONTRIBUTOR | Public (Anon) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Read Published Posts** | Yes | Yes | Yes | Yes | Yes |
| **Read Draft Posts** | Yes | Yes | Own Drafts | Own Drafts | No |
| **Create / Edit Drafts** | Yes | Yes | Yes | Yes | No |
| **Publish Posts** | Yes | Yes | No | No | No |
| **Delete / Restore Posts**| Yes | Yes | No | No | No |
| **Manage Media Library** | Yes | Yes | Upload Only| Upload Only | No |
| **Manage Categories/Tags**| Yes | Yes | No | No | No |
| **Create Webhooks** | Yes | No | No | No | No |
| **Generate API Tokens** | Yes | No | No | No | No |
| **Invite Team Members** | Yes | No | No | No | No |

---

## 3. Server-Side Request Forgery (SSRF) Protection

When dispatching webhooks or resolving third-party embeds (e.g. YouTube, Twitter, OpenGraph previews):
- OpenPost validates destination URLs before initiating network requests.
- Requests to private IPv4/IPv6 ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254` AWS metadata) are strictly blocked.
- DNS rebinding attacks are prevented by re-verifying resolved IP addresses immediately prior to socket connection.

---

## 4. XSS Prevention with Structured JSON AST

Legacy CMS platforms store raw HTML in database text columns and render it using `dangerouslySetInnerHTML`, leaving frontends vulnerable to Cross-Site Scripting (XSS).

OpenPost eliminates this vulnerability:
- Articles are stored strictly as structured ProseMirror JSON nodes.
- When rendered by the frontend, React creates virtual DOM elements for each block.
- Text content is automatically HTML-escaped by React.

---

## 5. Voter Fraud Prevention (Polls)

Poll voting endpoints prevent ballot stuffing through a multi-factor fingerprint:
- SHA-256 hash of `client_ip + user_agent + project_salt`.
- Database unique constraint: `UNIQUE (poll_id, voter_fingerprint)`.
- Re-voting attempts trigger immediate `HTTP 409 Conflict`.
