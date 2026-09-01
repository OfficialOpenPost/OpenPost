# Writing Studio & Editor

The OpenPost Writing Studio (`/dashboard/editor`) is a distraction-free, block-based rich text editor built on **Tiptap (ProseMirror)**.

It pairs intuitive typography with a modular **Slash `/` block command engine**, real-time autosave with IndexedDB crash recovery, and a live SEO inspector.

---

## Editor Architecture

- **Canvas Width**: `960px` max reading container.
- **Adjustable Side Inspector**: Drag-to-resize sidebar between `260px` and `480px`.
- **Sticky Top Bar**: Top action header (`top-0`) and formatting toolbar (`top-14`) stay fixed without layout jumps.
- **Structured JSON AST**: All formatting is stored as structured ProseMirror nodes and marks, eliminating dirty HTML.

---

## The 16 Slash `/` Blocks

Type `/` anywhere on an empty line in the editor to open the block insertion menu:

| Block Type | Command | Description |
| :--- | :--- | :--- |
| **Heading 1 / 2 / 3** | `/h1`, `/h2`, `/h3` | Section headings with automatic anchor slug generation |
| **Callout Box** | `/callout` | Highlighted alert box with type switcher (Note, Tip, Warning, Important) |
| **Image Card** | `/image` | Image upload with 6 layout presets and drag-to-resize handles |
| **Image Gallery** | `/gallery` | Responsive multi-image grid with lightbox zoom |
| **Code Snippet** | `/code` | Monospace code block with syntax language selector |
| **Table** | `/table` | Multi-column table with add row/column controls |
| **FAQ Accordion** | `/faq` | Collapsible question & answer items with JSON-LD schema support |
| **Call-to-Action Button**| `/button` | Styled CTA button with custom URL, target, and color themes |
| **Download Card** | `/download` | Asset download card with file size and format badges |
| **Interactive Poll** | `/poll` | Single/multiple choice poll with live voting and results |
| **YouTube Video** | `/video` | Responsive YouTube video embed with aspect ratio preserve |
| **Tweet / Social** | `/tweet` | Privacy-focused social media post card |
| **Generic Iframe Embed** | `/embed` | Sandbox-protected iframe for CodePen, Figma, or Spotify |
| **Task List** | `/todo` | Interactive checkable task list items |
| **Blockquote** | `/quote` | Styled quotation block with author citation |
| **Divider** | `/divider` | Horizontal divider line separating sections |

---

## 6 Image Layout Presets & Resizing

Images in OpenPost can be customized using 6 layout modes:

1. **Inline**: Aligns directly within the paragraph flow.
2. **Left Aligned**: Floats left with text wrapping around the right side.
3. **Center**: Centered with standard prose width.
4. **Right Aligned**: Floats right with text wrapping around the left side.
5. **Wide**: Extends past standard text margins for high-impact photography.
6. **Full Bleed**: Spans edge-to-edge across the entire page container.

### Resize Handle
Click on any image card to reveal the bottom-right resize handle (`↘`). Drag horizontally to resize the image width dynamically from `200px` up to `100%`.

---

## Autosave Engine & Crash Recovery

Never lose your writing progress. OpenPost features a multi-tiered persistence layer:

```
┌─────────────────────────────────────────────────────────────┐
│                       Keystroke Input                       │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼ (Instant)                     ▼ (Debounced 2000ms)
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Browser IndexedDB       │ │       PostgreSQL DB        │
│   (Local Offline Storage)    │ │      (Server Revisions)    │
└──────────────────────────────┘ └────────────────────────────┘
```

1. **IndexedDB Local Storage**: Every keystroke is saved immediately to your browser's IndexedDB. If your browser crashes or your laptop battery dies, returning to the editor displays a **"Restore unsaved draft"** banner.
2. **Server Autosave (2s Debounce)**: After 2 seconds of inactivity, your draft is synced to the database with a toast notification in the bottom right corner.
3. **Revision History**: Every major edit creates a revision record in `blog_revisions`. You can view and restore past snapshots from the **Revisions** panel.

---

## SEO & Social Snippet Inspector

The right inspector panel gives you real-time feedback on your post's search engine and social media optimization:

- **Google SERP Snippet Preview**: Renders your title and description exactly as they appear on desktop and mobile search results, with pixel width limit warnings.
- **Character Counters**:
  - Title: Target `50–60` characters.
  - Meta Description: Target `120–155` characters.
- **Twitter & OpenGraph Card Previews**: Visual preview of your post card when shared on Twitter/X, LinkedIn, Slack, and Facebook.
- **Canonical URL & Redirects**: Automatic 301 redirect management if you edit an existing published post's slug.
