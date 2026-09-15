# OpenPost — Current Architecture Report

> Generated from full codebase audit. Last updated: September 2025.

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.3.3 |
| UI Library | React | 19.2.8 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| ORM | Prisma | 6.14 |
| Database | PostgreSQL (via Supabase) | - |
| Auth | Supabase Auth + SSR | 0.12.5 |
| Editor | Tiptap (ProseMirror) | 2.25+ |
| Storage | Cloudflare R2 (S3 API) | - |
| Icons | Lucide React | 1.38 |
| Animation | Framer Motion | 13.1 |
| Validation | Zod | 3.25 |
| Testing | Vitest | 4.1 |
| Package Manager | npm | - |

---

## 2. Directory Structure

```
D:/Openpost
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Auth pages (login/signup)
│   │   ├── (dashboard)/            # Dashboard layout + pages
│   │   │   └── dashboard/
│   │   │       ├── blogs/          # Blog list
│   │   │       ├── editor/         # Blog editor (NEW + EDIT)
│   │   │       ├── media/          # Media library
│   │   │       ├── categories/     # Category management
│   │   │       ├── tags/           # Tag management
│   │   │       ├── authors/        # Author management
│   │   │       ├── team/           # Team & Invites
│   │   │       ├── webhooks/       # Webhook management
│   │   │       ├── audit/          # Audit logs
│   │   │       └── settings/       # Project settings
│   │   ├── api/                    # API Route Handlers
│   │   │   ├── blogs/              # Blog CRUD
│   │   │   ├── media/              # Media upload/list
│   │   │   ├── v1/                 # Public API (posts, categories, tags, authors, polls, search)
│   │   │   ├── cron/               # Scheduled publishing
│   │   │   ├── webhooks/           # Webhook management
│   │   │   ├── cli/                # CLI auth exchange
│   │   │   └── ...
│   │   ├── blog/                   # Public blog pages
│   │   │   ├── page.tsx            # Blog listing
│   │   │   └── [slug]/page.tsx     # Individual post
│   │   ├── authors/                # Author pages
│   │   ├── setup/                  # Initial setup
│   │   ├── cli/                    # CLI connection page
│   │   ├── docs/                   # Documentation
│   │   └── ...
│   ├── components/
│   │   ├── editor/                 # Tiptap editor components
│   │   │   ├── Editor.tsx          # Base editor component
│   │   │   ├── extensions.ts       # Extension registry
│   │   │   ├── useOpenPostEditor.ts # Editor hook
│   │   │   ├── Toolbar.tsx         # Legacy toolbar
│   │   │   ├── BubbleMenus.tsx     # Selection bubble menu
│   │   │   ├── SlashMenu.tsx       # Slash command system
│   │   │   ├── InsertBlockModal.tsx # Block insertion modal
│   │   │   ├── Preview.tsx         # Editor preview
│   │   │   ├── RevisionHistory.tsx # Version history
│   │   │   ├── SeoPanel.tsx        # SEO settings panel
│   │   │   ├── StatusIndicator.tsx # Save status indicator
│   │   │   ├── TitleField.tsx      # Title input
│   │   │   ├── FeaturedImagePicker.tsx # Cover image picker
│   │   │   ├── editor-styles.ts    # Editor CSS styles
│   │   │   ├── blocks/             # Custom block extensions
│   │   │   │   ├── Callout.ts      # Callout/admonition block
│   │   │   │   ├── Gallery.ts      # Image gallery block
│   │   │   │   ├── Faq.ts          # FAQ block (with JSON-LD)
│   │   │   │   ├── Accordion.ts    # Accordion/collapsible block
│   │   │   │   ├── Button.ts       # CTA button block
│   │   │   │   ├── Download.ts     # File download block
│   │   │   │   ├── Embed.ts        # Generic embed block
│   │   │   │   ├── Video.ts        # Video block (YouTube/Vimeo)
│   │   │   │   ├── Poll.ts         # Interactive poll block
│   │   │   │   ├── SocialEmbed.ts  # Social media embed
│   │   │   │   └── Image.ts        # Image block (legacy)
│   │   │   ├── extensions/         # Custom extensions
│   │   │   │   ├── FontSize.ts     # Font size control
│   │   │   │   ├── LineHeight.ts   # Line height control
│   │   │   │   └── TrailingNode.ts # Trailing paragraph
│   │   │   ├── floating/           # Floating image system
│   │   │   │   ├── FloatingImageNode.ts # Image node definition
│   │   │   │   ├── FloatingImageView.tsx # Image node view
│   │   │   │   ├── FloatingTableView.tsx # Table controls
│   │   │   │   ├── FloatingResizeHandles.tsx
│   │   │   │   ├── FloatingLayoutPlugin.ts
│   │   │   │   └── editor-floating.css
│   │   │   ├── image/              # Image settings
│   │   │   │   ├── FloatingImageExtension.ts
│   │   │   │   ├── FloatingImageView.tsx
│   │   │   │   └── ImageSettingsPanel.tsx
│   │   │   ├── toolbar/            # Toolbar components
│   │   │   │   ├── EditorRibbon.tsx
│   │   │   │   ├── FindReplaceBar.tsx
│   │   │   │   ├── ColorPickerPopover.tsx
│   │   │   │   └── TableContextMenu.tsx
│   │   │   ├── panels/             # Side panels
│   │   │   │   └── EditorSidePanel.tsx
│   │   │   └── outline/            # Document outline
│   │   │       └── DocumentOutline.tsx
│   │   ├── render/
│   │   │   └── SharedRender.tsx    # Public blog renderer
│   │   ├── ui/                     # Reusable UI components
│   │   ├── project/
│   │   │   └── ProjectSwitcher.tsx # Multi-tenant project switcher
│   │   ├── home/                   # Landing page components
│   │   └── dashboard/              # Dashboard components
│   ├── lib/
│   │   ├── auth.ts                 # Authentication + RBAC enforcement
│   │   ├── rbac.ts                 # Role-Based Access Control (5-tier)
│   │   ├── db.ts                   # Prisma client singleton
│   │   ├── storage.ts              # Cloudflare R2 / S3 storage
│   │   ├── uploadMedia.ts          # Client-side media upload
│   │   ├── imageConvert.ts         # Image-to-WebP conversion
│   │   ├── editorDocument.ts       # EditorDocument model + converters
│   │   ├── publish.ts              # Word count + reading time
│   │   ├── slug.ts                 # Slug generation
│   │   ├── webhooks.ts             # Webhook delivery + SSRF protection
│   │   ├── rateLimit.ts            # Rate limiting
│   │   ├── redirects.ts            # URL redirect handling
│   │   ├── indexedDB.ts            # Local draft crash recovery
│   │   ├── polls.ts                # Poll logic
│   │   ├── email.ts                # Email (Resend integration)
│   │   ├── env.ts                  # Environment variable validation
│   │   ├── apiToken.ts             # API token management
│   │   ├── utils.ts                # General utilities
│   │   ├── validators/             # Zod validation schemas
│   │   │   └── blocks.ts
│   │   ├── supabase/
│   │   │   ├── server.ts           # Server-side Supabase client
│   │   │   └── client.ts           # Client-side Supabase client
│   │   └── ...
│   ├── hooks/
│   │   ├── useAutosave.ts          # Autosave hook
│   │   └── useDebounce.ts          # Debounce hook
│   └── types/
│       └── index.ts                # TypeScript type definitions
├── prisma/
│   └── schema.prisma               # Database schema
├── supabase/
│   └── migrations/                 # SQL migrations (001-021)
├── tests/                          # Vitest test suites
├── cli/                            # OpenPost CLI
├── templates/                      # Blog templates
├── scripts/                        # CMS scripts (doctor, bootstrap)
└── public/                         # Static assets
```

---

## 3. Database Architecture (Prisma Schema)

### 3.1 Core Models

#### User (profiles + auth)
```prisma
model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  name      String
  passwordHash String
  role      UserRole @default(contributor)
  // Relations: blogs, revisions, mediaUploads, linkedAuthors
}
```

#### Profile (Supabase Auth sync)
```prisma
model Profile {
  id          String        @id @db.Uuid
  email       String        @unique
  displayName String?
  status      ProfileStatus @default(pending)
  // Relations: memberships, ownedProjects
}
```

#### Project (Multi-tenancy)
```prisma
model Project {
  id, name, slug, description, ownerId, settings
  // Site config: siteName, siteTagline, siteDescription, siteLogoUrl, etc.
  // Relations: members, blogs, categories, tags, authors, media, webhooks, polls, etc.
}
```

#### Blog (Content)
```prisma
model Blog {
  id              String     @id @default(uuid())
  title           String
  slug            String
  content         Json       @default("{}")      // Tiptap ProseMirror JSON
  schemaVersion   Int        @default(1)
  editorDocument  Json?      @db.JsonB            // Structured EditorDocument
  renderedHtml    String?    @db.Text             // Pre-rendered HTML
  contentVersion  Int        @default(1)
  status          PostStatus @default(draft)
  featuredImageId String?
  categoryId      String?
  projectId       String?
  publishedAt     DateTime?
  scheduledAt     DateTime?
  updatedAt       DateTime
  createdAt       DateTime
  createdBy       String
  seo             Json       @default("{}")
  wordCount       Int        @default(0)
  readingTime     Int        @default(0)
  // Relations: author, featuredImage, category, project, revisions, tags, authors, mediaUsage, redirects, polls
  @@unique([projectId, slug])
}
```

#### BlogRevision (Version History)
```prisma
model BlogRevision {
  id             String   @id
  blogId         String
  content        Json                              // Full Tiptap JSON snapshot
  editorDocument Json?    @db.JsonB
  renderedHtml   String?  @db.Text
  contentVersion Int?
  wordCount      Int?
  readingTime    Int?
  createdAt      DateTime
  createdBy      String
  label          String?
  // Relations: blog, user
}
```

#### Media (Uploaded files)
```prisma
model Media {
  id               String @id
  originalFilename String
  mimeType         String
  sizeBytes        BigInt
  width            Int?
  height           Int?
  variants         Json   @default("{}")  // { publicUrl, key, webp: { url, key, size } }
  altTextDefault   String?
  checksum         String
  uploadedBy       String
  projectId        String?
  // Relations: uploader, project, authors, usage, blogs
}
```

### 3.2 Enums

```prisma
enum UserRole {
  OWNER | ADMIN | EDITOR | AUTHOR | CONTRIBUTOR
  WRITER (deprecated → AUTHOR)
}

enum PostStatus {
  draft | published | scheduled | archived | trash
}

enum ProfileStatus {
  pending | approved | rejected | suspended
}
```

### 3.3 Other Models

- **Author** — Public bylines (name, slug, bio, photoId, socialLinks, linkedUserId, projectId)
- **Category** — Hierarchical categories (name, slug, description, parentId, seo, projectId)
- **Tag** — Tags (name, slug, description, projectId)
- **BlogAuthor** — Many-to-many Blog↔Author
- **BlogTag** — Many-to-many Blog↔Tag
- **MediaUsage** — Tracks which blog uses which media
- **Poll / PollOption / PollVote** — Interactive polls
- **Redirect** — 301 redirect tracking (oldSlug → newSlug)
- **Webhook / WebhookDelivery** — Outgoing webhooks with delivery log
- **Integration** — API tokens for external integrations
- **Invite** — Team invite tokens
- **ProjectMember** — User↔Project role mapping
- **AuditLog** — Security audit trail
- **Setting** — Global key-value settings
- **ConnectionCode / CliAuthCode** — CLI authentication

---

## 4. Authentication & Authorization

### 4.1 Auth Flow
1. Supabase Auth handles login/signup (email/password, optional OAuth)
2. `getCurrentUser()` in `src/lib/auth.ts:74` resolves session from cookies
3. Profile auto-created on first login (pending status)
4. Session cached in-memory (15s TTL) + React.cache() deduplication
5. Email verification optional (`REQUIRE_EMAIL_VERIFICATION=true`)

### 4.2 RBAC (5-tier Model)
```
OWNER(5) > ADMIN(4) > EDITOR(3) > AUTHOR(2) > CONTRIBUTOR(1)
```

**Permission Matrix:**
| Action | OWNER | ADMIN | EDITOR | AUTHOR | CONTRIBUTOR |
|--------|-------|-------|--------|--------|-------------|
| Create post | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit own post | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit others' posts | ✓ | ✓ | ✓ | ✗ | ✗ |
| Publish own | ✓ | ✓ | ✓ | ✓ | ✗ |
| Publish others | ✓ | ✓ | ✓ | ✗ | ✗ |
| Delete own | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete others | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage members | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage settings | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete project | ✓ | ✗ | ✗ | ✗ | ✗ |

### 4.3 Enforcement
- Every project-scoped API call uses `requireProjectMember(projectId)`
- `requirePermission(projectId, 'posts.publish_own')` for fine-grained control
- Client-side `projectId` from localStorage is NEVER trusted — server re-validates
- Owner cannot be demoted by non-OWNER

---

## 5. Editor Architecture (Tiptap)

### 5.1 Editor Engine
- **Package:** `@tiptap/core` 2.25+ with React bindings (`@tiptap/react`)
- **Base:** `@tiptap/starter-kit` (includes Paragraph, Heading, Bold, Italic, Strike, Code, CodeBlock, Blockquote, BulletList, OrderedList, ListItem, HardBreak, HorizontalRule, History)
- **Content Format:** Tiptap ProseMirror JSON (`{ type: "doc", content: [...] }`)

### 5.2 Installed Tiptap Extensions

**Core Extensions (from package.json):**
- StarterKit (paragraph, heading, lists, blockquote, code, history, etc.)
- Underline
- Link (autolink, linkOnPaste)
- Placeholder
- Subscript / Superscript
- CharacterCount
- FontFamily
- TextStyle + Color
- Highlight (multicolor)
- TextAlign (left, center, right, justify)
- Table + TableRow + TableCell + TableHeader (resizable)
- TaskList + TaskItem (nested)
- YouTube embed

**Custom Extensions:**
- `FontSize` — Font size control
- `LineHeight` — Line height control
- `TrailingNode` — Auto-inserts empty paragraph at end
- `SlashExtension` — Slash command menu
- `FloatingImageNode` — Advanced image handling

### 5.3 Custom Block Types

| Block | File | Description |
|-------|------|-------------|
| Callout | `blocks/Callout.ts` | Admonition box (tip/info/warning/success/note) |
| Gallery | `blocks/Gallery.ts` | Image gallery (grid/carousel) |
| FAQ | `blocks/Faq.ts` | FAQ with JSON-LD structured data |
| Accordion | `blocks/Accordion.ts` | Collapsible content sections |
| Button | `blocks/Button.ts` | CTA button block |
| Download | `blocks/Download.ts` | File download card |
| Embed | `blocks/Embed.ts` | Generic embed (YouTube, Vimeo, etc.) |
| Video | `blocks/Video.ts` | Video embed block |
| Poll | `blocks/Poll.ts` | Interactive reader poll |
| SocialEmbed | `blocks/SocialEmbed.ts` | Social media embed |

### 5.4 Image System
- **FloatingImageNode** — Custom ProseMirror node replacing default image
- **Attributes:** src, alt, title, caption, width, height, naturalWidth/Height, aspectRatio, layout (left/center/right/wide/inline), float, borderWidth/Style/Color, borderRadius, shadow, opacity, rotation, link, openLinkInNewTab, isDecorative
- **NodeView:** `FloatingImageView.tsx` — Full interactive UI with resize handles, layout controls, style popover, SEO popover, link popover, caption input, replace/delete
- **Upload:** Drag & drop + paste + URL input → WebP conversion → R2 upload → background URL swap
- **Resize:** 8-handle resize (4 corners + 4 edges) with live width preview

### 5.5 Toolbar System
- **EditorRibbon** — Main toolbar (replacing legacy Toolbar.tsx)
- **SelectionBubbleMenu** — Contextual toolbar on text selection (Bold, Italic, Underline, Link)
- **ImageBubbleMenu** — (Currently returns null, handled by FloatingImageView)
- **InsertBlockModal** — Modal for inserting blocks (Image, Poll, Callout, Table, FAQ, Video, Button, Download)
- **FindReplaceBar** — Find & replace overlay (Ctrl+F)

### 5.6 Slash Command Menu
- Triggered by typing `/` in the editor
- Categories: Basic, Media, Interactive, Layout
- Items: Text, Heading 1-4, Bullet List, Numbered List, Task Checklist, Floating Image, Table, Callout, Quote, Code Block, Divider, Reader Poll, FAQ, YouTube/Video
- Keyboard navigation (↑↓) + Enter to select + Esc to close
- Searchable by title and keywords

### 5.7 Side Panel (Inspector)
- **EditorSidePanel** — Right sidebar with:
  - Slug editing
  - Category selection
  - Tag management
  - Featured image picker
  - SEO settings (title, description, canonical, OG tags)
  - Revision history
  - Status management
  - Scheduled publishing

### 5.8 EditorDocument Model
Defined in `src/lib/editorDocument.ts` — a structured article model:

```typescript
interface EditorDocument {
  version: 1;
  type: "article";
  content: EditorBlock[];
}
```

Block types: Paragraph, Heading, Image, Gallery, Quote, Callout, List, Checklist, Table, CodeBlock, Divider, Embed, Button, Faq, Accordion, Poll

Conversion functions:
- `tiptapToEditorDocument()` — Tiptap JSON → EditorDocument
- `editorDocumentToHtml()` — EditorDocument → HTML
- `countDocumentWords()` — Word count
- `normalizeToEditorDocument()` — Normalize any format

---

## 6. Content Storage Format

### 6.1 Primary Format: Tiptap ProseMirror JSON

Content is stored in the `content` column as JSON:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "My Article Title" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Hello world" }]
    }
  ]
}
```

### 6.2 Secondary Format: EditorDocument

Stored in `editorDocument` column — a normalized, platform-agnostic block model.

### 6.3 Rendered HTML

Stored in `renderedHtml` column — pre-rendered HTML for fast public display.

### 6.4 Backward Compatibility

- Existing posts with HTML strings are auto-detected and rendered via `dangerouslySetInnerHTML`
- Existing posts with Tiptap JSON (`{ type: "doc" }`) are rendered via `SharedRender`
- No migration required — both formats work simultaneously

---

## 7. Public Blog Rendering

### 7.1 Entry Point
`src/app/blog/[slug]/page.tsx` — Server component that:
1. Checks for redirects (301 tracking)
2. Fetches post from DB by slug
3. Detects content format (JSON vs HTML)
4. Renders via `SharedRender` (JSON) or `dangerouslySetInnerHTML` (HTML)

### 7.2 SharedRender Component
`src/components/render/SharedRender.tsx` — Client component that renders all block types:
- Paragraph (with text alignment)
- Heading (h1-h6, with sizing)
- Image (with float, layout, caption, border, shadow, opacity, rotation, link)
- Callout (tip/info/warning/success/note with icons)
- Poll (interactive with voting, localStorage persistence, API sync)
- Gallery (grid/carousel layouts)
- FAQ (with JSON-LD schema generation)
- Accordion
- Button (CTA)
- Download (file card)
- YouTube/Video (with aspect ratios, privacy-enhanced mode)
- Embed (YouTube, Vimeo, generic)
- Code block (with copy button)
- Blockquote
- Horizontal rule
- Bullet/Ordered lists
- Task/check lists
- Tables (with colgroup widths, header row, cell styling)

### 7.3 Responsive Behavior
- Mobile: All floated images become full-width centered
- Tablet: Float widths capped at 38%
- Desktop: Full float wrapping support
- Mobile preview mode available in editor

---

## 8. Media/Storage Architecture

### 8.1 Upload Flow
1. Client: `uploadImageWithWebP()` in `src/lib/uploadMedia.ts`
2. Client: Image converted to WebP via `convertToWebP()` in `src/lib/imageConvert.ts`
3. Client: FormData sent to `/api/media/upload`
4. Server: File uploaded to Cloudflare R2 via S3 PutObject
5. Server: Returns `{ key, publicUrl }`
6. Client: Background metadata save to `/api/media`

### 8.2 Storage Key Format
```
openpost-media/<projectId>/<timestamp>-<uuid>.<ext>
```

### 8.3 Supported Formats
- Images: JPEG, PNG, WebP, GIF, SVG, AVIF
- Documents: PDF
- Video: MP4
- All validated via magic bytes (`validateMagicBytes()`)

### 8.4 R2 Configuration
- `R2_ACCOUNT_ID` — Cloudflare account
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — API credentials
- `R2_BUCKET_NAME` — Storage bucket
- `R2_PUBLIC_URL` — Public CDN URL

---

## 9. Autosave & Draft System

### 9.1 Autosave Architecture
- **Debounce:** 15 seconds after last edit
- **Safety interval:** 60 seconds (if dirty)
- **Blur save:** Saves when window loses focus
- **Before unload:** Saves via IndexedDB on page close
- **Empty detection:** Skips save for empty untitled drafts

### 9.2 Local Crash Recovery
- `src/lib/indexedDB.ts` — IndexedDB wrapper
- Saves draft to local DB on every server save
- Recovery prompt on reload if local draft is newer

### 9.3 Save Flow
1. Editor state changes → `setIsDirty(true)`
2. Autosave timer triggers
3. Tiptap JSON → `tiptapToEditorDocument()` → `editorDocumentToHtml()`
4. POST/PUT to `/api/blogs` with `{ content, editorDocument, renderedHtml }`
5. Server creates `BlogRevision` snapshot
6. Status updated to "saved"

---

## 10. Revision History

### 10.1 How It Works
- Every save (autosave, manual, publish) creates a `BlogRevision` record
- Revision stores full `content` (Tiptap JSON), `editorDocument`, `renderedHtml`
- Optional `label` (e.g., "Published update", "Autosave", "Created")
- Revisions viewable in `RevisionHistory.tsx` component

### 10.2 Restore Flow
1. User clicks "Restore this version" in revision panel
2. POST to `/api/blogs/<id>/restore` with `{ revisionId }`
3. Server loads revision content
4. Editor calls `editor.commands.setContent(revisionContent)`
5. User can then save as new revision or publish

---

## 11. SEO System

### 11.1 Per-Post SEO
Stored in `Blog.seo` JSON field:
- `title` — SEO title
- `description` — Meta description
- `canonical` — Canonical URL
- `ogTitle` / `ogDesc` / `ogImage` — Open Graph
- `twitterCard` / `twitterTitle` / `twitterDescription`

### 11.2 Global SEO
- `src/app/sitemap.ts` — Dynamic sitemap generation
- `src/app/robots.ts` — Robots.txt
- `src/app/feed.xml/route.ts` — RSS/Atom feed
- `src/app/rss.xml/route.ts` — RSS feed

### 11.3 Structured Data
- FAQ blocks generate `FAQPage` JSON-LD automatically
- Article metadata available for schema.org integration

---

## 12. Webhook System

### 12.1 Events
```
post.created, post.updated, post.published, post.scheduled, post.deleted
category.created, category.updated, category.deleted
tag.created, media.uploaded
```

### 12.2 Security
- SSRF protection (blocks localhost, private IPs, cloud metadata)
- HMAC SHA256 signing with per-webhook secrets
- DNS resolution validation
- Redirect chain validation
- 5-second timeout

### 12.3 Delivery
- Async delivery with retry support
- `WebhookDelivery` audit trail
- Status: pending → success/failed

---

## 13. API Routes

### 13.1 Internal (Authenticated)
- `GET/POST /api/blogs` — Blog list/create
- `GET/PUT/DELETE /api/blogs/[id]` — Blog read/update/delete
- `GET /api/blogs/[id]/revisions` — Revision list
- `POST /api/blogs/[id]/restore` — Restore revision
- `GET/POST /api/media` — Media list/create
- `POST /api/media/upload` — File upload to R2
- `GET/POST/PUT/DELETE /api/settings/*` — Project settings
- `POST /api/cron/publish` — Scheduled publishing (Bearer auth)

### 13.2 Public (v1 API)
- `GET /api/v1/posts` — Published posts
- `GET /api/v1/posts/[slug]` — Single post by slug
- `GET /api/v1/categories` — Categories
- `GET /api/v1/tags` — Tags
- `GET /api/v1/authors` — Authors
- `GET /api/v1/polls/[id]` — Poll data
- `POST /api/v1/polls/[id]/vote` — Vote on poll
- `GET /api/v1/search` — Search posts

### 13.3 Authentication
- Internal routes: Supabase session cookies
- v1 API: Bearer token (`op_live_64hex`) or `X-OpenPost-Project` header
- CLI: One-time code exchange via `/api/cli/exchange`

---

## 14. Environment Variables

### Required
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection (migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public CDN URL for media |
| `NEXT_PUBLIC_APP_URL` | Application base URL |
| `CRON_SECRET` | Secret for cron job auth |

### Optional
| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Transactional email |
| `EMAIL_FROM_ADDRESS` | Sender email |
| `REQUIRE_EMAIL_VERIFICATION` | Enforce email verification |
| `NEXT_PUBLIC_APP_NAME` | Application name |
| `BOOTSTRAP_ADMIN_*` | Initial admin setup |

---

## 15. Existing Features vs WordPress/Sanity Parity

### Already Implemented (WordPress-level)
| Feature | Status | Notes |
|---------|--------|-------|
| Rich text editor | ✅ | Tiptap with 20+ extensions |
| Headings (H1-H6) | ✅ | Keyboard shortcuts Mod+Alt+1-6 |
| Bold, Italic, Underline | ✅ | Toolbar + bubble menu |
| Strikethrough | ✅ | Via StarterKit |
| Inline code | ✅ | Via StarterKit |
| Code blocks | ✅ | With syntax styling |
| Blockquotes | ✅ | Styled with brand accent |
| Bullet/Numbered lists | ✅ | Nested support |
| Task/checklists | ✅ | With TaskList extension |
| Links | ✅ | Autolink, toolbar, bubble menu |
| Images | ✅ | Upload, drag-drop, paste, URL |
| Image float/wrap | ✅ | Left, right, center, wide |
| Image resize | ✅ | 8-handle real-time resize |
| Image caption | ✅ | Inline editable |
| Image alt text | ✅ | SEO panel |
| Image styling | ✅ | Border, radius, shadow, opacity, rotation |
| Tables | ✅ | Resizable columns, header row |
| Galleries | ✅ | Grid and carousel |
| YouTube/Video embed | ✅ | With aspect ratios |
| Callouts/Admonitions | ✅ | 5 tones (tip/info/warning/success/note) |
| FAQ blocks | ✅ | With JSON-LD schema |
| Accordion/collapsible | ✅ | |
| CTA buttons | ✅ | 3 variants |
| Download blocks | ✅ | File cards |
| Social embeds | ✅ | |
| Polls | ✅ | Interactive with voting |
| Slash commands | ✅ | Searchable menu |
| Text alignment | ✅ | Left, center, right, justify |
| Font family | ✅ | |
| Font size | ✅ | Custom extension |
| Text color | ✅ | |
| Highlight/marking | ✅ | Multicolor |
| Superscript/Subscript | ✅ | |
| Undo/Redo | ✅ | History extension |
| Autosave | ✅ | 15s debounce + safety interval |
| Revision history | ✅ | Auto-snapshots + restore |
| Draft/publish workflow | ✅ | Draft, scheduled, published, archived, trash |
| SEO per post | ✅ | Title, description, canonical, OG, Twitter |
| Sitemap | ✅ | Dynamic generation |
| RSS feed | ✅ | |
| Categories | ✅ | Hierarchical |
| Tags | ✅ | Many-to-many |
| Authors | ✅ | Multiple per post, bylines |
| Featured image | ✅ | Cover image |
| Media library | ✅ | Search, project-scoped |
| WebP conversion | ✅ | Client-side |
| Multi-tenancy | ✅ | Project-based isolation |
| RBAC | ✅ | 5-tier role system |
| Team management | ✅ | Invites, roles, status |
| Webhooks | ✅ | SSRF-protected, HMAC signed |
| Audit logging | ✅ | Full action trail |
| API tokens | ✅ | For external integrations |
| CLI | ✅ | Init, doctor, login |
| Preview | ✅ | Desktop, tablet, mobile viewports |
| Find & Replace | ✅ | Ctrl+F overlay |
| Fullscreen mode | ✅ | F11 toggle |
| Responsive design | ✅ | Mobile, tablet, desktop |

### Partially Implemented / Could Improve
| Feature | Status | Notes |
|---------|--------|-------|
| Drag & drop block reordering | ⚠️ | Image drag exists, no full block DnD |
| Block duplication | ❌ | Not implemented |
| Block move up/down | ❌ | Not implemented |
| Markdown shortcuts | ⚠️ | Limited (bold/italic from MD) |
| Word count display | ✅ | In header |
| Character count | ✅ | Via extension |
| Reading time | ✅ | Auto-calculated |
| Focus mode | ❌ | Not implemented |
| Collaborative editing | ❌ | Not implemented |
| Image optimization | ⚠️ | WebP only, no responsive srcset |
| Table merge cells | ❌ | Not implemented |
| Table cell alignment | ⚠️ | Basic only |
| Syntax highlighting | ⚠️ | Basic code block, no highlight.js |
| Footnotes | ❌ | Not implemented |
| Math/LaTeX | ❌ | Not implemented |
| Custom CSS per post | ❌ | Not implemented |
| Post templates | ❌ | Not implemented |
| Excerpt/custom fields | ❌ | Not implemented |
| Post ordering | ❌ | Manual sort not supported |
| Multi-author selection UI | ⚠️ | Backend supports, UI limited |

---

## 16. Potential Breaking Points

1. **Content format migration** — Posts stored as HTML strings need to work alongside Tiptap JSON
2. **Image URLs** — Existing image URLs must remain valid after any storage changes
3. **Slug changes** — 301 redirect tracking exists but must be preserved
4. **Project isolation** — All queries must include projectId filter
5. **Auth session** — Supabase cookie format changes could break session resolution
6. **Prisma migrations** — Must be additive, never destructive
7. **R2 bucket** — Changing storage provider requires URL migration
8. **Webhook HMAC** — Changing secret invalidates existing integrations
9. **CLI compatibility** — Template changes must remain backward-compatible

---

## 17. Recommended Upgrade Architecture

### What Already Exists (Don't Replace)
- Tiptap editor engine — keep it
- All existing extensions — keep them
- FloatingImageNode — keep it (already WordPress-level)
- SlashMenu — keep it
- SharedRender — keep it (the public renderer)
- All custom blocks — keep them
- Autosave system — keep it
- Revision history — keep it
- Media upload pipeline — keep it
- RBAC system — keep it
- Multi-tenancy — keep it

### What to Add/Improve
1. **Block management** — Add block drag handle, move up/down, duplicate, delete
2. **Table improvements** — Cell merge, alignment, responsive overflow
3. **Image optimization** — Responsive srcset generation on upload
4. **Focus mode** — Distraction-free writing
5. **Markdown shortcuts** — Type `# ` for heading, `- ` for list, etc.
6. **Code syntax highlighting** — Add language-aware highlighting
7. **Enhanced slash menu** — More block types, better categories
8. **Block-level formatting** — Background color, padding per block
9. **Post templates** — Save/load content templates
10. **Excerpt field** — Manual excerpt for post previews

### Migration Safety
- **No database migration required** for editor improvements
- All new blocks use Tiptap's extension system (backward-compatible)
- `SharedRender` already handles unknown block types gracefully
- Existing content formats (JSON + HTML) continue to work
- No changes to `content` column format

---

*This report represents the state of the codebase as of September 2025. The OpenPost CMS already has a mature, production-ready editor with features comparable to WordPress/Gutenberg and Sanity's block editor.*
