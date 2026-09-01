# Stage 1 — V1: Core Blog Editor

## Goal

A reliable, professional writing experience. Ship a usable (if minimal) product where a user can write a formatted post with images and tables, autosave, preview, and publish — with zero technical knowledge.

---

## Scope

### Editor Foundation
- **Tiptap (ProseMirror)** integration into Next.js
- Schema-enforced structured JSON document output (not raw HTML)
- Undo/redo, keyboard shortcuts, copy/paste, drag-and-drop

### Rich Text Formatting
- Bold, Italic, Underline, Strikethrough
- Headings (H1–H3; H1 reserved for post title)
- Ordered list, Unordered list, Checklist
- Blockquote
- Links (Cmd/Ctrl + K)
- Inline code, Code block
- Horizontal rule (divider)
- Text alignment (left, center, right)

### Image Handling (Basic)
- Insert image via toolbar
- Resize (drag handle, maintains aspect ratio)
- Alignment modes: Inline, Left, Centered, Right, Wide, Full-bleed
- Caption and alt text fields
- Per-image floating toolbar (replace, delete, alt, align)

### Tables
- Insert table via toolbar
- Header row toggle
- Per-cell rich text (bold/italic/link only, no nested blocks)
- Horizontal scroll on mobile (never column-squish)

### Autosave
- Debounced save-on-change (2s after typing pauses)
- Save-on-blur
- Save-before-unload (`beforeunload` + `sendBeacon`)
- Periodic safety-net save every 30s
- Status indicator: `Saved ✓` → `Saving…` → `Unsaved changes` → `Unable to save`
- IndexedDB local cache for crash recovery
- Conflict detection: stale base revision → non-destructive merge prompt

### Draft / Preview / Publish (Single-Step)
- Create draft with auto-generated placeholder slug
- Title input (slug live-updates until manually overridden)
- Preview: desktop/tablet/mobile viewport toggle
- Publish button → status changes to Published
- `published_at` timestamp recorded

### Toolbar
- Sticky (pinned top while scrolling)
- Responsive: below ~900px, low-frequency groups collapse into overflow menu
- Contextual floating mini-toolbar on text selection (bold/italic/link)
- Contextual floating toolbar on image selection

### Keyboard Shortcuts
| Action | Shortcut |
|---|---|
| Bold / Italic / Underline | Cmd/Ctrl + B / I / U |
| Insert link | Cmd/Ctrl + K |
| Undo / Redo | Cmd/Ctrl + Z / Shift+Z |
| Save (force) | Cmd/Ctrl + S |
| Heading 1/2/3 | Cmd/Ctrl + Alt + 1/2/3 |

---

## Database Tables (Minimal for V1)

```sql
-- users (auth already exists from Phase 2)
-- blogs: id, title, slug (unique), content (jsonb), schema_version, status (enum: draft/published), featured_image_id, published_at, updated_at, created_by, seo (jsonb), word_count, reading_time
-- blog_revisions: id, blog_id, content (jsonb), created_at, created_by, label
```

No categories, tags, authors join, polls, media_usage, redirects yet.

---

## Screens

| Screen | State |
|---|---|
| Login | Phase 2 deliverable (prerequisite) |
| Editor (Create/Edit) | Toolbar + Canvas + Title + Publish button |
| Preview | Desktop / Tablet / Mobile toggle, renders same block components as public frontend |

---

## Acceptance Criteria

1. A user can create a draft by entering a title and writing content.
2. Formatting shortcuts (Ctrl+B, Ctrl+I, etc.) work as expected.
3. Images can be inserted, resized, aligned, captioned, and given alt text.
4. Tables can be inserted and edited with header row toggle.
5. Autosave triggers silently within 2s of typing pause; status indicator reflects current state.
6. If browser crashes, unsaved changes are recoverable from IndexedDB on reopen.
7. Preview renders the document identically to how the public frontend will display it.
8. Publish changes status to Published and records published_at timestamp.
9. Editor stays responsive on documents up to 10,000 words (input latency < 50ms).
10. All toolbar controls are keyboard-reachable with visible focus states.

---

## Technical Notes

- **Stack:** Next.js + React + TypeScript + Tailwind CSS + Tiptap + PostgreSQL
- **Content format:** Structured JSON (ProseMirror document tree), validated server-side on save
- **Schema versioning:** Each document carries `schemaVersion`; additive-by-default evolution
- **No raw HTML storage** — eliminates XSS surface, enables multi-target rendering
- **IndexedDB** (not localStorage) for local draft cache — handles larger structured content

---

## Deliverables

- [ ] Next.js app scaffolding with TypeScript + Tailwind
- [ ] PostgreSQL database with `users`, `blogs`, `blog_revisions` tables
- [ ] Tiptap editor integrated with custom schema
- [ ] All formatting extensions configured
- [ ] Image upload + resize + alignment
- [ ] Table extension
- [ ] Autosave manager (debounce + blur + beforeunload + periodic)
- [ ] IndexedDB crash recovery
- [ ] Preview page with viewport toggle
- [ ] Publish flow (single-step)
- [ ] Slug auto-generation from title
- [ ] Toolbar (sticky, responsive, contextual menus)
- [ ] Keyboard shortcuts
- [ ] Status indicator (Saved/Saving/Unsaved/Unable)
- [ ] Conflict detection on save

---

## Dependencies

- Phase 2 (Authentication) must be complete before this stage
- PostgreSQL database provisioned
- Object storage (R2/S3) configured for image uploads
