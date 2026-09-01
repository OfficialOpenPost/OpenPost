# Stage 3 — V3: Advanced Content Blocks

## Goal

Move from "rich text with images" to a true block-based composition system. Each block is independently defined, validated, and rendered — rendering identically in editor, preview, and public frontend.

---

## Scope

### Slash Command Menu (`/`)
- Type `/` at start of empty line → opens searchable block-insertion menu
- Typing continues to filter (`/tab` → "Table")
- Arrow keys navigate, Enter inserts, Escape closes
- Grouped by category: Basic, Media, Interactive, Layout
- Min 2 images enforced for Gallery; removing down to 1 prompts conversion to Image block

### Block Types

| Block | Data Shape | Notes |
|---|---|---|
| **Text** | `{ type: "paragraph", content: RichTextNode[] }` | Default block |
| **Heading** | `{ type: "heading", attrs: { level: 2-4 } }` | H1 reserved for title; warn if level skipped (H2→H4) |
| **Image** | `{ type: "image", assetId, alt, caption, layout, width, link }` | V1 layouts + V3 expanded attrs |
| **Gallery** | `{ type: "gallery", items: [{assetId, alt, caption}], layout: "grid"\|"carousel" }` | Grid or carousel display |
| **Quote** | `{ type: "blockquote", content: RichTextNode[], attribution }` | Optional attribution field |
| **Callout** | `{ type: "callout", tone, icon, content: RichTextNode[] }` | Tones: info, warning, success, note |
| **Poll** | `{ type: "poll", pollId: "..." }` | See Poll System below |
| **Table** | `{ type: "table", content: [...] }` | Header row toggle, per-cell rich text only |
| **Video** | `{ type: "video", src, poster }` | Uploaded file or external link; 200MB cap; no transcoding |
| **YouTube/Vimeo Embed** | `{ type: "embed", provider, videoId }` | URL resolved server-side, never raw iframe HTML |
| **Divider** | `{ type: "horizontalRule" }` | Simple horizontal rule |
| **Button** | `{ type: "button", label, url, variant, openInNewTab }` | Variants: primary, secondary, outline |
| **FAQ** | `{ type: "faq", items: [{question, answer: RichTextNode[]}] }` | Accordion Q&A pairs; emit FAQPage JSON-LD on frontend |
| **Accordion** | `{ type: "accordion", items: [{title, content: RichTextNode[]}] }` | Generic collapsible sections |
| **Code Block** | `{ type: "codeBlock", language, content }` | Syntax-highlighted, language-selectable, copy button |
| **Download** | `{ type: "download", fileId, filename, size }` | Linked file from media library |
| **Social Embed** | `{ type: "socialEmbed", provider, postId }` | Twitter/X, Instagram via oEmbed; resolved server-side |

### Poll System (Complex Block)
- **Editor:** Insert via `/` menu. Configure: question, options (add/remove/reorder via drag), single vs multiple choice, anonymous voting toggle, results visibility (always/after voting/after close), optional vote limit, optional close date, explanation text after voting.
- **Database:** `polls`, `poll_options`, `poll_votes` tables
- **Vote dedup:** Hashed fingerprint (hashed IP + poll-scoped cookie). Not perfectly unspoofable — honest limitation disclosed in UI.
- **API:** `GET /api/v1/polls/{id}`, `POST /api/v1/polls/{id}/vote`
- **Security:** Rate limiting on vote endpoint; server-side tally computation; no individual voter identity exposed

### Extensibility Contract
Every block defined by:
1. Unique `type` string
2. JSON-serializable data shape
3. Zod server-side validation schema
4. Editor-side Tiptap node/extension
5. Public-render component

New blocks are additive — existing documents untouched when new block type introduced.

---

## Database Tables (New for V3)

```sql
-- polls: id, blog_id (fk, nullable until embedded), question, type (enum: single/multiple), allow_anonymous (bool), show_results (enum: always/after_vote/after_close), vote_limit_per_user, closes_at (nullable), status (enum: draft/open/closed)
-- poll_options: id, poll_id (fk), label, sort_order
-- poll_votes: id, poll_id (fk), option_id (fk), voter_fingerprint (hashed), voted_at. Unique on (poll_id, voter_fingerprint) for single-choice
```

---

## Screens

| Screen | New Components |
|---|---|
| Editor | Slash command menu, all block type editors, poll configuration modal |
| Preview | All block types render via shared render package |
| Public Frontend | All block types render identically to preview |

---

## Acceptance Criteria

1. Typing `/` opens a searchable block-insertion menu grouped by category.
2. All 16+ block types can be inserted via slash menu.
3. Each block renders identically in editor, preview, and public frontend.
4. Poll can be created with question, options, and voting rules.
5. Poll duplicate votes prevented (same fingerprint rejected server-side).
6. Poll results displayed per configured visibility rule.
7. Gallery displays images in grid or carousel mode.
8. FAQ/Accordion blocks render as expandable sections.
9. Video/Embed blocks resolve URLs server-side (no raw iframe HTML stored).
10. Social embeds (Twitter/X, Instagram) render via oEmbed resolution.
11. Code blocks support syntax highlighting with language selection.
12. Button blocks validate URL format and warn on non-https links.
13. New block types added later won't break existing documents.

---

## Technical Notes

- **Tiptap custom nodes:** Each block type requires a custom Tiptap extension (node definition, schema, commands, keyboard bindings)
- **Server-side validation:** Zod schemas for each block type; rejects unknown node types on save
- **Shared render package:** Single component library used by CMS preview + public frontend — guarantees visual parity
- **Poll fingerprint:** Combine hashed IP + first-party poll-scoped cookie; rate limit vote endpoint
- **Video:** 200MB cap; no transcoding/streaming pipeline in V1–V4 (future scope)

---

## Deliverables

- [ ] Slash command menu component
- [ ] Custom Tiptap extensions for all block types
- [ ] Server-side Zod validation schemas for all block types
- [ ] Shared render package (editor preview + public frontend)
- [ ] Poll system (editor config, database, API, voting, dedup)
- [ ] Gallery block (grid/carousel)
- [ ] FAQ/Accordion blocks
- [ ] Callout block with tones
- [ ] Embed blocks (YouTube/Vimeo, Social) with server-side resolution
- [ ] Code block with syntax highlighting
- [ ] Download block
- [ ] Button block
- [ ] Video block (basic upload/link)
- [ ] Schema versioning for V3 additions

---

## Dependencies

- Stage 2 (V2 Blog Management) complete
- Media library (V2) for image/file references in blocks
- Background worker for any async block processing
