# Editor Extensions Reference

All editor extensions are loaded in `src/components/editor/extensions.ts` and exported as `editorExtensions` — an array passed to the Tiptap editor instance.

## StarterKit Configuration

`@tiptap/starter-kit` provides the foundation. Configured at `extensions.ts:56-95`:

```ts
StarterKit.configure({
  heading: { levels: [1, 2, 3, 4, 5, 6] },
  codeBlock: { HTMLAttributes: { class: "rounded-2xl bg-navy ..." } },
  blockquote: { HTMLAttributes: { class: "border-l-4 border-brand ..." } },
  horizontalRule: { HTMLAttributes: { class: "my-10 border-border/80" } },
  bulletList: { HTMLAttributes: { class: "list-disc pl-6 my-4 ..." } },
  orderedList: { HTMLAttributes: { class: "list-decimal pl-6 my-4 ..." } },
  paragraph: { HTMLAttributes: { class: "leading-relaxed text-text-primary my-3.5" } },
  dropcursor: { color: "#FEA611", width: 3 },
})
```

**Included by default:** Bold, Italic, Strike, Code, CodeBlock, Blockquote, BulletList, OrderedList, Heading, HorizontalRule, HardBreak, Paragraph, Document.

---

## Custom Extensions

### FontSize (`src/components/editor/extensions/FontSize.ts`)

Extends `textStyle` marks with a `fontSize` attribute.

| Command | Args | Description |
|---------|------|-------------|
| `setFontSize` | `size: string` (e.g. `"18px"`, `"1.2rem"`) | Applies font size to selection |
| `unsetFontSize` | — | Removes font size from selection |

Applied via `textStyle` mark — the extension adds a global `fontSize` attribute to all `textStyle` nodes. Parsed from inline `style="font-size: ..."`, rendered as `style: "font-size: <value>"`.

### LineHeight (`src/components/editor/extensions/LineHeight.ts`)

Adds `lineHeight` attribute to `paragraph` and `heading` nodes.

| Command | Args | Description |
|---------|------|-------------|
| `setLineHeight` | `lineHeight: string` (e.g. `"1.8"`, `"2em"`) | Sets line height on paragraph/heading |
| `unsetLineHeight` | — | Removes line height |

Applied globally to `paragraph` and `heading` node types. Parsed from inline `style="line-height: ..."`. Used in `SharedRender` (`src/components/render/SharedRender.tsx:382`) to render paragraph-level line-height styles.

### TrailingNode (`src/components/editor/extensions/TrailingNode.ts`)

Ensures the document always ends with a paragraph node. Uses a ProseMirror plugin with `appendTransaction` — after every transaction, checks if the last child is not a paragraph, and inserts one if needed.

**Why it matters:** Users can always click below tables, images, code blocks, or embeds to continue writing. Without this, the cursor would get stuck at the end of non-text blocks.

### SlashExtension (`src/components/editor/SlashMenu.tsx:304-367`)

Custom extension wrapping `@tiptap/suggestion` for the `/` slash command menu.

- **Trigger character:** `/`
- **Plugin key:** `"slash"` (dedicated `PluginKey`)
- **Rendering:** Uses `ReactRenderer` + `tippy.js` for positioning the popup
- **Items:** `slashItems` array from `SlashMenu.tsx:42-212` — 15 commands across Basic, Media, Interactive, Layout categories
- **Keyboard:** Arrow keys navigate, Enter selects, Escape closes

### HeadingShortcuts (`extensions.ts:39-52`)

Inline extension adding `Mod-Alt-{1-4}` and `Ctrl-Alt-{1-3}` shortcuts for heading levels. Maps to `editor.chain().focus().toggleHeading({ level })`.

---

## Third-Party Extensions

### Underline (`@tiptap/extension-underline`)

Adds underline mark. Toggle via `editor.chain().toggleUnderline().run()` or `Ctrl+U`.

### Link (`@tiptap/extension-link`)

Configured at `extensions.ts:109-116`:
- `openOnClick: false` — links don't navigate on click in editor
- `autolink: true` — auto-detects URLs while typing
- `linkOnPaste: true` — paste a URL on selected text to create link
- Styled with `text-flame underline underline-offset-4` classes

### Highlight (`@tiptap/extension-highlight`)

Configured with `multicolor: true` for custom highlight colors. Adds `<mark>` with `px-1 rounded-sm` classes. Used in `SharedRender` for inline highlighted text with dynamic background color.

### Color (`@tiptap/extension-color`)

Adds foreground text color via `textStyle` mark. Works with `TextStyle` extension. Sets `color` attribute on `textStyle`, rendered as `style: "color: <value>"`.

### TextStyle (`@tiptap/extension-text-style`)

Required by Color and FontSize extensions. Provides the `textStyle` mark that carries `color`, `fontSize`, and `fontFamily` attributes.

### TextAlign (`@tiptap/extension-text-align`)

Configured at `extensions.ts:155-159`:
- **Types:** `heading`, `paragraph`, `blockquote`
- **Alignments:** `left`, `center`, `right`, `justify`
- **Default:** `left`

Applied via `textAlign` attribute on nodes, rendered in `SharedRender` as Tailwind alignment classes.

### FontFamily (`@tiptap/extension-font-family`)

Adds `fontFamily` attribute to `textStyle` mark. Rendered as inline `style: "font-family: ..."` in `SharedRender`.

### TaskList + TaskItem (`@tiptap/extension-task-list`, `@tiptap/extension-task-item`)

TaskChecklist with checkboxes. `TaskList` configured with `list-none` class, `TaskItem` with `nested: true` for sub-tasks. Rendered as `<input type="checkbox">` + text in `SharedRender`.

### Youtube (`@tiptap/extension-youtube`)

YouTube embed with `aspect-video w-full rounded-2xl my-6` classes. Used as a fallback alongside the custom `VideoBlock` for basic YouTube pasting.

### Table + TableRow + TableCell + TableHeader (`@tiptap/extension-table*`)

Full table support:
- **Table:** `resizable: true` — columns are draggable. Classes: `w-full my-6 border-collapse border border-border`
- **TableRow:** `border-b border-border`
- **TableHeader:** `bg-navy text-white font-bold` — dark header row
- **TableCell:** `p-3.5 border-r border-border bg-surface`

Rendered in `SharedRender` with `<colgroup>` for explicit column widths, colspan/rowspan support, and inline style parsing for background-color and vertical-align.

### Subscript (`@tiptap/extension-subscript`)

Adds `<sub>` mark for subscript text. Toggle via toolbar or `Ctrl+,`.

### Superscript (`@tiptap/extension-superscript`)

Adds `<sup>` mark for superscript text. Toggle via toolbar or `Ctrl+.`.

### CharacterCount (`@tiptap/extension-character-count`)

Provides `editor.storage.characterCount.characters()` and `.words()` methods. Used for word count and estimated reading time display in the editor UI.

### Placeholder (`@tiptap/extension-placeholder`)

Configured at `extensions.ts:174-181`:
- Shows "Heading" for heading nodes, "Start typing your article..." for other nodes
- `showOnlyWhenEditable: true` — hidden when editor is read-only
- `showOnlyCurrent: false` — shows in all empty blocks, not just focused one

---

## How to Add a New Extension

1. **Create the extension file** in `src/components/editor/extensions/`:

```ts
import { Extension } from "@tiptap/core";

export const MyExtension = Extension.create({
  name: "myExtension",
  addOptions() { return { ... }; },
  addGlobalAttributes() { ... },  // if extending existing nodes
  addCommands() { ... },
  addProseMirrorPlugins() { ... },
});
```

2. **Import and register** in `src/components/editor/extensions.ts`:

```ts
import { MyExtension } from "./extensions/MyExtension";

export const editorExtensions = [
  // ... existing extensions
  MyExtension,
];
```

3. **Add rendering logic** in `src/components/render/SharedRender.tsx` if the extension produces new node types — add a `case` in the `switch (node.type)` block.

4. **Add to slash menu** (optional) in `src/components/editor/SlashMenu.tsx:slashItems` if the block should be insertable via `/` commands.

---

## Extension Loading Order

Extensions are loaded in the order they appear in `editorExtensions`. The current order is:

1. HeadingShortcuts
2. StarterKit (with configured nodes)
3. Underline, Subscript, Superscript
4. CharacterCount, FontFamily
5. TextStyle, Color, Highlight
6. Link
7. FloatingImageNode (custom image node view)
8. Youtube
9. Table + TableRow + TableHeader + TableCell
10. TaskList + TaskItem
11. TextAlign
12. SlashExtension (slash menu)
13. FontSize, LineHeight (custom text attributes)
14. All block nodes (Callout, Gallery, Faq, Accordion, Button, Download, SocialEmbed, Poll, Video, Embed)
15. TrailingNode (ensures trailing paragraph)
16. Placeholder
