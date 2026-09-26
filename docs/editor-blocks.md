# Editor Custom Blocks

OpenPost extends Tiptap with custom block nodes for rich content layouts. Each block is a Tiptap `Node` extension defined in `src/components/editor/blocks/`.

## How Blocks Are Defined

Every block follows the same pattern using `@tiptap/core`'s `Node.create()`:

```ts
import { Node, mergeAttributes } from "@tiptap/core";

export const MyBlock = Node.create({
  name: "myBlock",       // unique node type name
  group: "block",        // top-level block node
  atom: true,            // single atomic unit (no inline editing)
  draggable: true,       // can be dragged via block handle

  addAttributes() { ... },  // node attributes with defaults
  parseHTML() { ... },       // how to parse from HTML
  renderHTML({ HTMLAttributes, node }) { ... },  // how to serialize
  addCommands() { ... },     // editor commands (set, toggle, update)
  addNodeView() { ... },     // optional React component view
});
```

All blocks are registered in `src/components/editor/extensions.ts:27-36` via the `editorExtensions` array.

---

## Block Reference

### Callout (`src/components/editor/blocks/Callout.ts`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `tone` | `string` | `"info"` | Visual tone: `info`, `tip`, `warning`, `success`, `note` |

**Insert:** Slash menu → "Callout Box", or `editor.chain().setCallout({ tone: "info" }).run()`
**Edit:** Click the callout to edit its block content. Tone is set on creation.
**Renders:** `<div data-type="callout" data-tone="...">` with tone-specific border/background classes. Each tone gets a unique color (blue for info, amber for tip/warning, emerald for success, slate for note).

---

### Gallery (`src/components/editor/blocks/Gallery.ts`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `layout` | `string` | `"grid"` | `"grid"` or `"carousel"` |
| `images` | `Array<{src}>` | 2 placeholder images | Array of image objects with `src` |

**Insert:** Via commands only — `editor.chain().setGallery({ images: [...], layout: "grid" }).run()`
**Edit:** ReactNodeViewRenderer renders `GalleryBlockView` — interactive UI for adding/removing images and switching layout.
**Renders:** Grid layout → 2-column CSS grid with rounded images. Carousel → horizontal scroll with snap. Falls back to single `<img>` if <2 images.

---

### FAQ (`src/components/editor/blocks/Faq.ts`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `items` | `Array<{question, answer}>` | 2 sample Q&A | Array of question/answer pairs |

**Insert:** Slash menu → "FAQ Section", or `editor.chain().setFaq({ items: [...] }).run()`
**Edit:** Atomic node — edit via the block's React UI or update attributes programmatically.
**Renders:** `<div data-type="faq">` with a navy header bar "FAQ" and expandable `<details>` elements for each Q&A item. Auto-generates `FAQPage` JSON-LD schema.org structured data via `SharedRender` (`src/components/render/SharedRender.tsx:362-371`).

---

### Accordion (`src/components/editor/blocks/Accordion.ts`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `items` | `Array<{title, content}>` | 2 sample sections | Array of title/content pairs |

**Insert:** Via commands — `editor.chain().setAccordion({ items: [...] }).run()`
**Edit:** Atomic node — edit content via programmatic `updateAccordion` command.
**Renders:** `<div data-type="accordion">` with `<details>/<summary>` elements for collapsible sections. First section opens by default. Divided by borders between items.

---

### Button (`src/components/editor/blocks/Button.ts`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | `string` | `"Click me"` | Button text |
| `url` | `string` | `"#"` | Link destination |
| `variant` | `string` | `"primary"` | `"primary"`, `"secondary"`, or `"outline"` |

**Insert:** Via commands — `editor.chain().setButton({ label: "Learn More", url: "/pricing", variant: "primary" }).run()`
**Edit:** Atomic node — update via `editor.chain().updateAttributes("buttonBlock", { ... }).run()`
**Renders:** Centered `<div>` with styled `<a>` tag. Primary = brand bg, secondary = navy bg, outline = border only.

---

### Download (`src/components/editor/blocks/Download.ts`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `fileName` | `string` | `"file.pdf"` | Display filename |
| `fileSize` | `string` | `"1.2 MB"` | Display file size |
| `url` | `string` | `"#"` | Download URL |

**Insert:** Via commands — `editor.chain().setDownload({ fileName: "Guide.pdf", fileSize: "2.4 MB", url: "/files/guide.pdf" }).run()`
**Edit:** Atomic node — update attributes.
**Renders:** Horizontal card with file icon, filename/size info, and a navy "Download" button link.

---

### SocialEmbed (`src/components/editor/blocks/SocialEmbed.ts`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `provider` | `string` | `"twitter"` | Social platform |
| `postId` | `string` | `""` | Post identifier |
| `url` | `string` | `""` | Full social post URL |

**Insert:** Via commands — `editor.chain().setSocialEmbed({ provider: "twitter", url: "..." }).run()`
**Edit:** Atomic node — set attributes on creation.
**Renders:** Server-side oEmbed resolution — no raw HTML is injected. Displays provider name and resolves via trusted template to prevent XSS.

---

### Poll (`src/components/editor/blocks/Poll.ts`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `pollId` | `string` | `null` | Database poll ID |
| `question` | `string` | `"What do you think?"` | Poll question |
| `description` | `string` | `""` | Optional description |
| `options` | `Array<{id, label}>` | `[{id:"1",label:"Option A"},...]` | Poll options |
| `type` | `string` | `"single"` | Vote type |
| `showResults` | `string` | `"always"` | When to show results |
| `allowAnonymous` | `boolean` | `true` | Allow anonymous votes |
| `themeColor` | `string` | `"#FEA611"` | Theme accent color |

**Insert:** Slash menu → "Reader Poll", or `editor.chain().setPoll({...}).run()`
**Edit:** ReactNodeViewRenderer renders `PollBlockView` — interactive editor for question, options, and settings.
**Renders:** Full interactive poll card in `SharedRender` (`src/components/render/SharedRender.tsx:64-353`) with vote buttons, animated progress bars, localStorage-based fraud protection, and API vote submission.

---

### Video (`src/components/editor/blocks/Video.ts`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` / `url` | `string` | `""` | Video URL |
| `provider` | `string` | `"youtube"` | Video provider |
| `caption` | `string` | `""` | Video caption |
| `title` | `string` | `""` | Video title |
| `align` | `string` | `"center"` | `"left"`, `"center"`, `"right"`, `"wide"` |
| `aspectRatio` | `string` | `"16:9"` | `"16:9"`, `"9:16"`, `"1:1"`, `"4:3"` |
| `autoplay` | `boolean` | `false` | Autoplay on load |
| `controls` | `boolean` | `true` | Show player controls |
| `privacyEnhanced` | `boolean` | `true` | Use youtube-nocookie.com |

**Insert:** Slash menu → "YouTube / Video" — prompts for URL.
**Edit:** ReactNodeViewRenderer renders `YouTubeBlockView` — visual configuration UI.
**Renders:** `<iframe>` with smart URL parsing (YouTube, Shorts, Vimeo). Privacy-enhanced mode uses `youtube-nocookie.com` by default. Caption displayed below the player.

---

### Embed (`src/components/editor/blocks/Embed.ts`)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `provider` | `string` | `null` | Detected provider (`youtube`, `vimeo`) |
| `videoId` | `string` | `null` | Extracted video ID |
| `url` | `string` | `null` | Original URL |

**Insert:** Via commands — `editor.chain().setEmbed({ url: "https://youtube.com/watch?v=..." }).run()`
**Edit:** The `parseEmbedUrl()` function auto-detects YouTube/Vimeo URLs and extracts provider + ID.
**Renders:** If provider is known, renders `<iframe>` via trusted template. Otherwise shows a link to the external content. No raw HTML injection.

---

### Image (`src/components/editor/blocks/Image.ts`)

Extended from `@tiptap/extension-image` with additional attributes:

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `alt` | `string` | `null` | Alt text |
| `caption` | `string` | `null` | Image caption |
| `align` | `string` | `"center"` | Alignment |
| `layout` | `string` | `"center"` | `"center"`, `"left"`, `"right"`, `"wide"`, `"inline"` |
| `width` | `string` | `"85%"` | CSS width |

**Insert:** Slash menu → "Floating Image" or drag & drop onto canvas.
**Edit:** ReactNodeViewRenderer renders `ImageCardView` — full image configuration UI with 30+ attributes for border, shadow, opacity, rotation, float, link, etc.

---

## Slash Menu Commands

The slash menu is defined in `src/components/editor/SlashMenu.tsx:42-212`. Type `/` in the editor to open it. Available commands:

| Category | Command | Action |
|----------|---------|--------|
| **Basic** | Text | Sets paragraph node |
| **Basic** | Heading 1/2/3 | Sets heading level |
| **Basic** | Bullet List | Toggles bullet list |
| **Basic** | Numbered List | Toggles ordered list |
| **Basic** | Task Checklist | Toggles task list |
| **Basic** | Quote | Toggles blockquote |
| **Basic** | Code Block | Toggles code block |
| **Media** | Floating Image | Prompts for image URL |
| **Media** | YouTube / Video | Prompts for video URL |
| **Interactive** | Reader Poll | Inserts poll with 2 options |
| **Interactive** | FAQ Section | Inserts FAQ with 1 Q&A |
| **Layout** | Table (3x3) | Inserts 3x3 table with header |
| **Layout** | Callout Box | Inserts info callout |
| **Layout** | Divider | Inserts horizontal rule |

Items are grouped by category and filterable by title/keyword search. Keyboard navigation: ↑↓ to move, Enter to select, Esc to close.

---

## Block Controls

Block actions live inside the selection bubble menu — the dark pill toolbar that appears above a text selection (`src/components/editor/BubbleMenus.tsx`). Select some text and press the **⋯** button on the right of the pill:

- The header shows the block type of the block that contains the selection (`src/components/editor/block-controls/block-utils.ts`).
- **Add Block Below** opens a grid of block types (`ADD_BLOCK_OPTIONS` in `src/components/editor/block-controls/block-operations.ts`) and moves the caret into the new block.

### Block Actions Menu

| Action | Shortcut | Description |
|--------|----------|-------------|
| Duplicate | `Ctrl+D` | Clones the current block below |
| Move Up | `Ctrl+Shift+↑` | Swaps with the block above |
| Move Down | `Ctrl+Shift+↓` | Swaps with the block below |
| Add Block Below | — | Opens the add-block grid menu |
| Delete | — | Removes the block (prevents deleting the last block) |

All actions operate on the top-level block that contains the start of the selection and are implemented in `src/components/editor/block-controls/block-operations.ts`.

### Keyboard Shortcuts (`extensions.ts:40-53`)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+1` / `Cmd+Alt+1` | Toggle Heading 1 |
| `Ctrl+Alt+2` / `Cmd+Alt+2` | Toggle Heading 2 |
| `Ctrl+Alt+3` / `Cmd+Alt+3` | Toggle Heading 3 |
| `Ctrl+Alt+4` / `Cmd+Alt+4` | Toggle Heading 4 |
| `Ctrl+D` | Duplicate block |
| `Ctrl+Shift+↑` | Move block up |
| `Ctrl+Shift+↓` | Move block down |

Block shortcuts only fire while the editor has focus.

