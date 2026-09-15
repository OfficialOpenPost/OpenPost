# Content Format Specification

OpenPost stores blog content as **ProseMirror JSON AST** (Abstract Syntax Tree). This is the canonical format used by the Tiptap editor, stored in the `editor_document` (JsonB) column, and rendered by `SharedRender.tsx`.

## Top-Level Structure

```json
{
  "type": "doc",
  "content": [
    { "type": "heading", "attrs": { "level": 2 }, "content": [...] },
    { "type": "paragraph", "content": [...] },
    ...
  ]
}
```

The root node is always `type: "doc"`. Its `content` array contains block-level nodes.

## Block Types

### paragraph

Standard text paragraph.

```json
{
  "type": "paragraph",
  "attrs": { "textAlign": "left", "lineHeight": "1.8" },
  "content": [
    { "type": "text", "text": "Hello world", "marks": [...] }
  ]
}
```

**Attrs:** `textAlign` (left/center/right/justify), `lineHeight` (CSS value)

---

### heading

Section headings, levels 1–6.

```json
{
  "type": "heading",
  "attrs": { "level": 2, "textAlign": "left" },
  "content": [{ "type": "text", "text": "My Heading" }]
}
```

**Attrs:** `level` (1–6), `textAlign`

---

### image

Floating image with extensive layout and styling attributes. Defined in `src/components/editor/floating/FloatingImageNode.ts`.

```json
{
  "type": "image",
  "attrs": {
    "src": "https://cdn.example.com/photo.webp",
    "alt": "A descriptive alt text",
    "title": "Optional title tooltip",
    "caption": "Optional image caption",
    "width": 380,
    "height": null,
    "naturalWidth": 1200,
    "naturalHeight": 800,
    "aspectRatio": 1.5,
    "lockAspectRatio": true,
    "layout": "center",
    "float": "none",
    "wrapMode": "square",
    "marginTop": 6,
    "marginRight": 20,
    "marginBottom": 12,
    "marginLeft": 20,
    "borderWidth": 0,
    "borderStyle": "solid",
    "borderColor": "#E2E8F0",
    "borderRadius": 12,
    "shadow": "sm",
    "opacity": 1,
    "rotation": 0,
    "link": null,
    "openLinkInNewTab": true,
    "isDecorative": false
  }
}
```

**Layout modes:** `inline`, `left`, `right`, `center`, `wide`

**Float positions:** `none`, `left`, `right`

**Shadow levels:** `none`, `sm`, `md`, `lg`, `xl`

**Border styles:** `solid`, `dashed`, `dotted`, `none`

**Wrap modes:** `square`, `tight`, `top-bottom`

---

### callout

Highlighted information box with tone-based styling.

```json
{
  "type": "callout",
  "attrs": { "tone": "tip" },
  "content": [{ "type": "text", "text": "This is a pro tip." }]
}
```

**Tones:** `tip` (amber), `info` (blue), `warning` (amber-dark), `success` (emerald), `note` (slate)

---

### gallery

Image grid or carousel.

```json
{
  "type": "gallery",
  "attrs": {
    "layout": "grid",
    "images": [
      { "src": "https://...", "alt": "Image 1" },
      { "src": "https://...", "alt": "Image 2" }
    ]
  }
}
```

**Layouts:** `grid` (2-column CSS grid), `carousel` (horizontal scroll)

---

### faq

FAQ block with JSON-LD structured data output.

```json
{
  "type": "faq",
  "attrs": {
    "items": [
      { "question": "What is OpenPost?", "answer": "A headless CMS." },
      { "question": "Is it free?", "answer": "Yes, open source." }
    ]
  }
}
```

Renders as collapsible `<details>` elements. Automatically generates `FAQPage` JSON-LD in `SharedRender.tsx:362-371`.

---

### accordion

Generic collapsible sections.

```json
{
  "type": "accordion",
  "attrs": {
    "items": [
      { "title": "Section 1", "content": "Content here..." },
      { "title": "Section 2", "content": "More content..." }
    ]
  }
}
```

---

### buttonBlock

Call-to-action button.

```json
{
  "type": "buttonBlock",
  "attrs": {
    "label": "Learn More",
    "url": "https://example.com",
    "variant": "primary"
  }
}
```

**Variants:** `primary` (brand color), `secondary` (navy), `outline` (border only)

---

### downloadBlock

File download card.

```json
{
  "type": "downloadBlock",
  "attrs": {
    "url": "https://example.com/file.pdf",
    "fileName": "Report.pdf",
    "fileSize": "2.4 MB"
  }
}
```

---

### poll / pollBlock

Interactive poll with voting.

```json
{
  "type": "poll",
  "attrs": {
    "pollId": "uuid-here",
    "question": "What feature should we build next?",
    "description": "Vote for the next priority.",
    "options": [
      { "id": "opt_1", "label": "Dark Mode", "votes": 42 },
      { "id": "opt_2", "label": "API v2", "votes": 38 }
    ],
    "type": "single",
    "showResults": "always",
    "allowAnonymous": true,
    "layout": "center",
    "themeColor": "#FEA611",
    "width": "100%"
  }
}
```

Polls sync with the `polls`/`poll_options`/`poll_votes` tables via `syncPolls()` in `src/app/api/blogs/route.ts:116`.

---

### videoBlock

Video embed (YouTube, Vimeo, or direct URL).

```json
{
  "type": "videoBlock",
  "attrs": {
    "src": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "title": "Demo Video",
    "caption": "Video caption",
    "layout": "center",
    "aspectRatio": "16:9",
    "startTime": 0,
    "autoplay": false,
    "controls": true,
    "privacyEnhanced": true
  }
}
```

YouTube privacy-enhanced mode uses `youtube-nocookie.com`. Vimeo uses `player.vimeo.com`.

---

### embedBlock

Generic oEmbed-style embed.

```json
{
  "type": "embedBlock",
  "attrs": {
    "provider": "youtube",
    "videoId": "dQw4w9WgXcQ",
    "url": "https://youtube.com/watch?v=..."
  }
}
```

**Providers:** `youtube`, `vimeo`, generic fallback (link to URL).

---

### codeBlock

Syntax-highlighted code block.

```json
{
  "type": "codeBlock",
  "attrs": { "language": "typescript" },
  "content": [{ "type": "text", "text": "const x = 42;" }]
}
```

Rendered with a copy button and monospace font in `SharedRender.tsx:667-662`.

---

### table

Data table with resizable columns.

```json
{
  "type": "table",
  "content": [
    {
      "type": "tableRow",
      "content": [
        {
          "type": "tableHeader",
          "attrs": { "colwidth": [200] },
          "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Name" }] }]
        }
      ]
    },
    {
      "type": "tableRow",
      "content": [
        {
          "type": "tableCell",
          "attrs": { "colspan": 1, "rowspan": 1, "colwidth": [200] },
          "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Value" }] }]
        }
      ]
    }
  ]
}
```

---

### Other Block Types

| Type | Description |
|---|---|
| `bulletList` | Unordered list with `listItem` children |
| `orderedList` | Ordered list with `listItem` children |
| `blockquote` | Styled blockquote |
| `horizontalRule` | Horizontal divider |
| `taskList` | Checkbox list with `taskItem` children |
| `youtube` | YouTube video (Tiptap built-in) |

## Mark Types

Marks are inline formatting applied to text nodes.

### bold

```json
{ "type": "bold" }
```

### italic

```json
{ "type": "italic" }
```

### underline

```json
{ "type": "underline" }
```

### strike

```json
{ "type": "strike" }
```

### code

Inline code. Rendered with monospace font and dark background.

```json
{ "type": "code" }
```

### link

Hyperlink with target control.

```json
{
  "type": "link",
  "attrs": {
    "href": "https://example.com",
    "target": "_blank"
  }
}
```

### highlight

Colored text highlight.

```json
{
  "type": "highlight",
  "attrs": { "color": "rgba(254,166,17,0.28)" }
}
```

`multicolor: true` — any hex/rgba color is supported.

### superscript / subscript

```json
{ "type": "superscript" }
{ "type": "subscript" }
```

### textStyle

Inline style overrides for color, font family, and font size.

```json
{
  "type": "textStyle",
  "attrs": {
    "color": "#FF0000",
    "fontFamily": "Georgia, serif",
    "fontSize": "18px"
  }
}
```

Processed by `SharedRender.tsx:29-34` — applies inline CSS `color`, `fontFamily`, `fontSize`.

## Content Flow

```
1. EDITOR produces ProseMirror JSON
       ↓
2. Client-side: JSON stored in editor state
       ↓
3. SAVE: POST /api/blogs { editorDocument, content, renderedHtml }
       ↓
4. API: Zod validate → RBAC check → Prisma write
   ├── editor_document (JsonB) — canonical
   ├── content (Json) — legacy compatibility
   └── rendered_html (Text) — pre-rendered (optional)
       ↓
5. LOAD: GET /api/blogs?id=... → returns editor_document
       ↓
6. RENDER: SharedRender({ content: editorDocument })
   └── Maps each node type → React component
       ↓
7. PUBLIC: /blog/[slug] uses same SharedRender
```

### Backward Compatibility

Old content may exist in the `content` (Json) column as HTML strings or older JSON formats. The editor handles this via Tiptap's `parseHTML` methods — each node defines how to parse from HTML (`src/components/editor/floating/FloatingImageNode.ts:191-197`):

```typescript
parseHTML() {
  return [
    { tag: "figure[data-floating-image]" },
    { tag: "figure[data-float]" },
    { tag: "img[src]" },  // Fallback: plain <img> tags
  ];
}
```

This ensures legacy HTML content loads correctly into the editor without data loss.

## Editor Extensions

All registered in `src/components/editor/extensions.ts`:

| Extension | Source | Purpose |
|---|---|---|
| StarterKit | `@tiptap/starter-kit` | Core nodes + marks |
| Underline | `@tiptap/extension-underline` | Underline mark |
| Link | `@tiptap/extension-link` | Hyperlinks |
| Placeholder | `@tiptap/extension-placeholder` | Ghost text |
| Subscript / Superscript | `@tiptap/extension-subscript/superscript` | |
| CharacterCount | `@tiptap/extension-character-count` | Word/char limits |
| FontFamily | `@tiptap/extension-font-family` | Font family picker |
| TextStyle + Color | `@tiptap/extension-text-style` + `color` | Inline colors |
| Highlight | `@tiptap/extension-highlight` | Multicolor highlight |
| TextAlign | `@tiptap/extension-text-align` | left/center/right/justify |
| Table + TableRow/Cell/Header | `@tiptap/extension-table*` | Resizable tables |
| TaskList + TaskItem | `@tiptap/extension-task-list` | Checkboxes |
| Youtube | `@tiptap/extension-youtube` | YouTube embeds |
| FloatingImageNode | Custom (`floating/FloatingImageNode.ts`) | Rich image node |
| FontSize | Custom (`extensions/FontSize`) | Size picker |
| LineHeight | Custom (`extensions/LineHeight`) | Line height control |
| Callout | Custom (`blocks/Callout`) | Info boxes |
| Gallery | Custom (`blocks/Gallery`) | Image grids |
| Faq | Custom (`blocks/Faq`) | FAQ with JSON-LD |
| Accordion | Custom (`blocks/Accordion`) | Collapsible sections |
| ButtonBlock | Custom (`blocks/Button`) | CTA buttons |
| DownloadBlock | Custom (`blocks/Download`) | File downloads |
| SocialEmbed | Custom (`blocks/SocialEmbed`) | Social media embeds |
| PollBlock | Custom (`blocks/Poll`) | Interactive polls |
| VideoBlock | Custom (`blocks/Video`) | Video embeds |
| EmbedBlock | Custom (`blocks/Embed`) | Generic embeds |
| TrailingNode | Custom (`extensions/TrailingNode`) | Ensures trailing paragraph |
| HeadingShortcuts | Inline (`extensions.ts:39`) | Mod-Alt-1..4 shortcuts |
| SlashExtension | Custom (`SlashMenu`) | `/` command menu |
