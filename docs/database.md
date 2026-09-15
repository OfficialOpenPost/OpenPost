# Database Schema Reference

OpenPost uses **Prisma 6** with **Supabase-managed PostgreSQL**. The schema is defined in `prisma/schema.prisma`.

## Enums

| Enum | Values | Maps To |
|---|---|---|
| `UserRole` | `OWNER`, `ADMIN`, `EDITOR`, `AUTHOR`, `CONTRIBUTOR`, `WRITER` (deprecated) | `user_role` |
| `PostStatus` | `draft`, `published`, `scheduled`, `archived`, `trash` | `post_status` |
| `PollType` | `single`, `multiple` | `poll_type` |
| `PollStatus` | `draft`, `open`, `closed` | `poll_status` |
| `PollResultsVisibility` | `always`, `after_vote`, `after_close` | `poll_results_visibility` |
| `ProfileStatus` | `pending`, `approved`, `rejected`, `suspended` | `profile_status` |

`WRITER` is a deprecated alias for `AUTHOR`. Legacy lowercase variants (`owner`, `admin`, etc.) are also retained in the enum for backward compatibility.

## Models

### User

Login identity. Maps to Supabase Auth `users`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, matches Supabase Auth user ID |
| `email` | String | Unique |
| `name` | String | Display name |
| `passwordHash` | String | Mapped to `password_hash` |
| `role` | UserRole | Default `CONTRIBUTOR` |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Relations:** `blogs` (BlogAuthor), `revisions` (BlogRevision), `mediaUploads` (Media), `linkedAuthors` (Author)

**Table:** `users`

---

### Profile

Supabase-linked profile with approval status. Created automatically on first login.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, matches Supabase Auth user ID |
| `email` | String | Unique |
| `displayName` | String? | Mapped to `display_name` |
| `status` | ProfileStatus | Default `pending` |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Relations:** `memberships` (ProjectMember[]), `ownedProjects` (Project[])

**Table:** `profiles`

**Status workflow:** `pending` → `approved` (by admin) | `rejected` | `suspended`

---

### Project

Tenant boundary. All content is scoped to a project.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | |
| `slug` | String | Unique |
| `description` | String? | |
| `ownerId` | UUID | FK → Profile, mapped to `owner_id` |
| `settings` | JSON | Default `{}` |
| `siteName` | String? | Site config for CLI |
| `siteTagline` | String? | |
| `siteDescription` | String? | |
| `siteLogoUrl` | String? | |
| `siteFaviconUrl` | String? | |
| `sitePrimaryColor` | String? | Default `#FEA611` |
| `siteUrl` | String? | |
| `siteLanguage` | String? | Default `en` |
| `siteTimezone` | String? | Default `UTC` |
| `socialTwitter` | String? | |
| `socialGithub` | String? | |
| `socialLinkedin` | String? | |
| `socialYoutube` | String? | |
| `socialInstagram` | String? | |

**Relations:** `owner` (Profile), `members`, `blogs`, `categories`, `tags`, `authors`, `media`, `webhooks`, `polls`, `integrations`, `connectionCodes`, `cliCodes`, `invites`, `auditLogs`

**Indexes:** `[slug]`, `[ownerId]`

**Table:** `projects`

---

### ProjectMember

Links users to projects with role-based access.

| Column | Type | Notes |
|---|---|---|
| `projectId` | UUID | FK → Project, composite PK |
| `userId` | UUID | FK → Profile, composite PK |
| `role` | UserRole | |
| `createdAt` | DateTime | |

**Table:** `project_members`

**Indexes:** `[userId]`

---

### Blog

Core content model. Stores posts in three formats for different use cases.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `title` | String | |
| `slug` | String | Unique per project |
| `content` | JSON | Legacy content format, default `{}` |
| `schemaVersion` | Int | Default 1 |
| `editorDocument` | JsonB? | ProseMirror JSON AST (canonical) |
| `renderedHtml` | Text? | Pre-rendered HTML |
| `contentVersion` | Int | Default 1 |
| `status` | PostStatus | Default `draft` |
| `featuredImageId` | UUID? | FK → Media |
| `categoryId` | UUID? | FK → Category |
| `projectId` | UUID? | FK → Project |
| `publishedAt` | DateTime? | |
| `scheduledAt` | DateTime? | |
| `updatedAt` | DateTime | |
| `createdAt` | DateTime | |
| `createdBy` | UUID | FK → User |
| `seo` | JSON | SEO metadata, default `{}` |
| `wordCount` | Int | Default 0 |
| `readingTime` | Int | Default 0 (minutes) |

**Relations:** `author` (User), `featuredImage` (Media), `category` (Category), `project` (Project), `revisions` (BlogRevision[]), `tags` (BlogTag[]), `authors` (BlogAuthor[]), `mediaUsage` (MediaUsage[]), `redirects` (Redirect[]), `polls` (Poll[])

**Unique:** `[projectId, slug]`

**Indexes:** `[projectId, slug]`, `[projectId, status, updatedAt(desc)]`, `[status]`, `[publishedAt]`, `[createdBy]`

**Table:** `blogs`

---

### BlogRevision

Version history for blog content.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `blogId` | String | FK → Blog |
| `content` | JSON | Snapshot of content |
| `editorDocument` | JsonB? | Snapshot of ProseMirror AST |
| `renderedHtml` | Text? | |
| `contentVersion` | Int? | |
| `wordCount` | Int? | |
| `readingTime` | Int? | |
| `createdAt` | DateTime | |
| `createdBy` | String | FK → User |
| `label` | String? | e.g. "Published update", "Autosave" |

**Indexes:** `[blogId, createdAt]`

**Table:** `blog_revisions`

---

### BlogAuthor

Many-to-many: blogs ↔ authors (public bylines, not login users).

| Column | Type | Notes |
|---|---|---|
| `blogId` | String | FK → Blog, composite PK |
| `authorId` | String | FK → Author, composite PK |
| `sortOrder` | Int | Default 0 |

**Table:** `blog_authors`

---

### Author

Public byline entity. Separate from User/login identity.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | Display name |
| `slug` | String | URL-safe, unique per project |
| `bio` | String? | |
| `photoId` | UUID? | FK → Media |
| `socialLinks` | JSON | Default `{}` |
| `website` | String? | |
| `email` | String? | |
| `linkedUserId` | UUID? | FK → User (must be approved member of same project) |
| `projectId` | UUID? | FK → Project |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Unique:** `[projectId, slug]`

**Table:** `authors`

---

### Category

Hierarchical taxonomy.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | |
| `slug` | String | Unique per project |
| `description` | String? | |
| `parentId` | UUID? | FK → Category (self-referential) |
| `seo` | JSON | |
| `projectId` | UUID? | FK → Project |

**Unique:** `[projectId, slug]`

**Table:** `categories`

---

### Tag

Flat taxonomy.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | |
| `slug` | String | Unique per project |
| `description` | String? | |
| `projectId` | UUID? | FK → Project |

**Unique:** `[projectId, slug]`

**Table:** `tags`

---

### Media

R2-hosted file assets.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `originalFilename` | String | |
| `mimeType` | String | Validated via magic bytes |
| `sizeBytes` | BigInt | |
| `width` | Int? | |
| `height` | Int? | |
| `variants` | JSON | Derived sizes (webp, etc.) |
| `altTextDefault` | String? | |
| `checksum` | String | SHA-256, server-generated |
| `uploadedBy` | UUID | FK → User |
| `projectId` | UUID? | FK → Project |
| `createdAt` | DateTime | |

**Indexes:** `[checksum]`, `[projectId, createdAt(desc)]`

**Table:** `media`

---

### MediaUsage

Tracks which blogs use which media files.

| Column | Type | Notes |
|---|---|---|
| `mediaId` | String | FK → Media, composite PK |
| `blogId` | String | FK → Blog, composite PK |

**Table:** `media_usage`

---

### Poll / PollOption / PollVote

Interactive polls embedded in blog content.

**Poll:**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `blogId` | String? | FK → Blog |
| `projectId` | UUID? | FK → Project |
| `question` | String | |
| `type` | PollType | `single` or `multiple` |
| `allowAnonymous` | Boolean | Default true |
| `showResults` | PollResultsVisibility | Default `always` |
| `voteLimitPerUser` | Int | Default 1 |
| `closesAt` | DateTime? | |
| `status` | PollStatus | Default `draft` |

**PollOption:** `id`, `pollId`, `label`, `sortOrder`

**PollVote:** `id`, `pollId`, `optionId`, `voterFingerprint`, `votedAt` — unique on `[pollId, voterFingerprint]`

---

### Redirect

301 redirects created when a published post's slug changes.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `oldSlug` | String | |
| `newSlug` | String | |
| `blogId` | UUID | FK → Blog |
| `createdAt` | DateTime | |

**Index:** `[oldSlug]`

**Table:** `redirects`

---

### Webhook / WebhookDelivery

Event-driven integrations.

**Webhook:**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | |
| `url` | String | Target URL (SSRF-validated) |
| `events` | String[] | e.g. `["post.publish"]`, `["*"]` |
| `secret` | String? | HMAC signing secret |
| `isActive` | Boolean | Default true |
| `filter` | String? | GROQ-like filter expression |
| `retryCount` | Int | Default 3 |
| `projectId` | UUID? | FK → Project |

**WebhookDelivery:** `id`, `webhookId`, `event`, `payload`, `status` (pending/success/failed), `attempts`, `lastError`, `createdAt`

---

### Invite

Time-limited invitation tokens.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `email` | String | Invitee email |
| `projectId` | UUID | FK → Project |
| `role` | UserRole | Assigned role |
| `token` | String | Unique, `encode(gen_random_bytes(32),'hex')` |
| `createdBy` | UUID | Inviter |
| `createdAt` | DateTime | |
| `expiresAt` | DateTime | Default `now() + 7 days` |
| `usedAt` | DateTime? | |

**Table:** `invites`

---

### Integration

API tokens for headless access.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `projectId` | UUID | FK → Project |
| `name` | String | |
| `tokenHash` | String | SHA-256 of raw token |
| `tokenPrefix` | String | Visible prefix `op_live_abcdef...` |
| `permissions` | String[] | Default: read-only + webhooks |
| `createdBy` | UUID | |
| `createdAt` | DateTime | |
| `lastUsedAt` | DateTime? | |
| `revokedAt` | DateTime? | Null = active |

**Table:** `integrations`

---

### AuditLog

Security and admin action tracking.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `projectId` | UUID? | FK → Project |
| `actorId` | UUID? | Who performed the action |
| `action` | String | e.g. `post.created`, `user.status_approved` |
| `targetId` | String? | ID of affected entity |
| `metadata` | JSON | Additional context |
| `createdAt` | DateTime | |

**Index:** `[projectId, createdAt]`

**Table:** `audit_logs`

---

### Setting

Global key-value settings.

| Column | Type | Notes |
|---|---|---|
| `key` | String | PK |
| `value` | JSON | |
| `updatedAt` | DateTime | |

**Table:** `settings`

---

### ConnectionCode / CliAuthCode

Short-lived codes for CLI authentication flow.

Both share: `code` (PK), `projectId`, `createdBy`, `createdAt`, `expiresAt` (10 minutes), `usedAt`

**Tables:** `connection_codes`, `cli_auth_codes`

## Key Relationships

```
Profile ──1:N── ProjectMember ──N:1── Project
Profile ──1:N── Project (owner)
Project ──1:N── Blog
Project ──1:N── Author
Project ──1:N── Media
Project ──1:N── Category
Project ──1:N── Tag
Project ──1:N── Webhook
Project ──1:N── Poll
Project ──1:N── AuditLog
Project ──1:N── Invite
Project ──1:N── Integration

Blog ──N:M── Author (via BlogAuthor)
Blog ──N:M── Tag (via BlogTag)
Blog ──1:N── BlogRevision
Blog ──1:N── Redirect
Blog ──1:N── Poll
Blog ──N:M── Media (via MediaUsage)

Media ──1:N── Author (photoId)
Media ──1:N── Blog (featuredImageId)
```
