/**
 * OpenPost Editor Document — Structured Article Model
 * Source of truth for editor content
 * Preserves block order, semantics, and media references without pixel coordinates
 */

export type EditorDocumentVersion = 1;

export type TextAlignment = "left" | "center" | "right" | "justify";
export type ImageAlignment = "left" | "center" | "right" | "wide" | "full";
export type ImageSize = "small" | "medium" | "large" | "original" | string;

export interface EditorDocument {
  version: EditorDocumentVersion;
  type: "article";
  content: EditorBlock[];
}

export type EditorBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | GalleryBlock
  | QuoteBlock
  | CalloutBlock
  | ListBlock
  | ChecklistBlock
  | TableBlock
  | CodeBlock
  | DividerBlock
  | EmbedBlock
  | ButtonBlock
  | FaqBlock
  | AccordionBlock
  | PollBlock;

export interface ParagraphBlock {
  type: "paragraph";
  attrs?: { align?: TextAlignment };
  content: InlineContent[];
}

export interface HeadingBlock {
  type: "heading";
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6; align?: TextAlignment };
  content: InlineContent[];
}

export interface ImageBlock {
  type: "image";
  attrs: {
    mediaId?: string | null;
    src?: string;
    alt: string;
    caption?: string | null;
    alignment?: ImageAlignment;
    width?: ImageSize | null;
    link?: string | null;
  };
}

export interface GalleryBlock {
  type: "gallery";
  attrs: {
    layout: "grid" | "carousel";
    images: Array<{ mediaId?: string; src?: string; alt: string; caption?: string | null }>;
  };
}

export interface QuoteBlock {
  type: "quote";
  attrs: { cite?: string | null };
  content: InlineContent[];
}

export interface CalloutBlock {
  type: "callout";
  attrs: { tone: "info" | "warning" | "success" | "note"; icon?: string | null };
  content: InlineContent[];
}

export interface ListBlock {
  type: "list";
  attrs: { ordered: boolean; start?: number | null };
  content: ListItem[];
}

export interface ListItem {
  type: "listItem";
  content: InlineContent[];
  children?: ListBlock[];
}

export interface ChecklistBlock {
  type: "checklist";
  content: Array<{ checked: boolean; content: InlineContent[] }>;
}

export interface TableBlock {
  type: "table";
  attrs: { hasHeader?: boolean };
  content: TableRow[];
}

export interface TableRow {
  type: "tableRow";
  content: TableCell[];
}

export interface TableCell {
  type: "tableCell" | "tableHeader";
  attrs?: { colspan?: number; rowspan?: number; align?: TextAlignment | null };
  content: InlineContent[];
}

export interface CodeBlock {
  type: "codeBlock";
  attrs: { language?: string | null };
  content: string;
}

export interface DividerBlock {
  type: "divider";
}

export interface EmbedBlock {
  type: "embed";
  attrs: { provider: "youtube" | "vimeo" | "twitter" | "generic"; url: string; html?: string | null };
}

export interface ButtonBlock {
  type: "button";
  attrs: { label: string; url: string; variant?: "primary" | "secondary" | "outline"; newTab?: boolean };
}

export interface FaqBlock {
  type: "faq";
  attrs: { items: Array<{ q: string; a: string }> };
}

export interface AccordionBlock {
  type: "accordion";
  attrs: { items: Array<{ title: string; content: InlineContent[] }> };
}

export interface PollBlock {
  type: "poll";
  attrs: { pollId: string };
}

export type InlineContent =
  | { type: "text"; text: string; marks?: InlineMark[] }
  | { type: "hardBreak" };

export type InlineMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "strike" }
  | { type: "subscript" }
  | { type: "superscript" }
  | { type: "code" }
  | { type: "link"; attrs: { href: string; target?: string | null } }
  | { type: "color"; attrs: { color: string } }
  | { type: "highlight"; attrs: { color?: string | null } }
  | { type: "fontFamily"; attrs: { family: string } }
  | { type: "fontSize"; attrs: { size: string } };

export function tiptapToEditorDocument(tiptap: any): EditorDocument {
  if (!tiptap || typeof tiptap !== "object") {
    return { version: 1, type: "article", content: [] };
  }
  if (tiptap.type === "article" && Array.isArray(tiptap.content) && tiptap.version === 1) {
    return tiptap as EditorDocument;
  }
  const src = tiptap.content || tiptap.doc?.content || [];
  const blocks: EditorBlock[] = [];
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (!n || typeof n !== "object") continue;
      switch (n.type) {
        case "heading": {
          const level = Math.min(6, Math.max(1, n.attrs?.level || 2)) as any;
          blocks.push({
            type: "heading",
            attrs: { level, align: n.attrs?.textAlign || undefined },
            content: inlineFromTiptap(n.content || []),
          });
          break;
        }
        case "paragraph": {
          blocks.push({
            type: "paragraph",
            attrs: { align: n.attrs?.textAlign || undefined },
            content: inlineFromTiptap(n.content || []),
          });
          break;
        }
        case "image": {
          blocks.push({
            type: "image",
            attrs: {
              mediaId: n.attrs?.mediaId || null,
              src: n.attrs?.src || null,
              alt: n.attrs?.alt || "",
              caption: n.attrs?.caption || n.attrs?.title || null,
              alignment: n.attrs?.layout || n.attrs?.align || "center",
              width: n.attrs?.width || null,
            },
          });
          break;
        }
        case "blockquote": {
          blocks.push({
            type: "quote",
            attrs: { cite: n.attrs?.cite || null },
            content: inlineFromTiptap(n.content?.[0]?.content || n.content || []),
          });
          break;
        }
        case "bulletList":
        case "orderedList": {
          const ordered = n.type === "orderedList";
          const items: ListItem[] = (n.content || []).map((li: any) => ({
            type: "listItem" as const,
            content: inlineFromTiptap(li.content?.[0]?.content || li.content || []),
          }));
          blocks.push({ type: "list", attrs: { ordered }, content: items });
          break;
        }
        case "taskList": {
          const items = (n.content || []).map((li: any) => ({
            checked: !!li.attrs?.checked,
            content: inlineFromTiptap(li.content?.[0]?.content || []),
          }));
          blocks.push({ type: "checklist", content: items });
          break;
        }
        case "codeBlock": {
          const code = (n.content || []).map((c: any) => c.text || "").join("\n");
          blocks.push({ type: "codeBlock", attrs: { language: n.attrs?.language || null }, content: code });
          break;
        }
        case "horizontalRule":
        case "divider": {
          blocks.push({ type: "divider" });
          break;
        }
        case "table": {
          const rows: TableRow[] = (n.content || []).map((row: any) => ({
            type: "tableRow",
            content: (row.content || []).map((cell: any) => ({
              type: cell.type === "tableHeader" ? "tableHeader" : "tableCell",
              content: inlineFromTiptap(cell.content?.[0]?.content || cell.content || []),
            })),
          }));
          blocks.push({ type: "table", attrs: { hasHeader: true }, content: rows });
          break;
        }
        case "gallery": {
          blocks.push({
            type: "gallery",
            attrs: {
              layout: n.attrs?.layout || "grid",
              images: (n.attrs?.images || []).map((im: any) => ({ mediaId: im.mediaId || null, src: im.src || null, alt: im.alt || "", caption: im.caption || null })),
            },
          });
          break;
        }
        default: {
          if (Array.isArray(n.content)) {
            const hasText = n.content.some((c: any) => c.text || c.content);
            if (hasText) walk([{ type: "paragraph", content: n.content }]);
          }
          break;
        }
      }
    }
  };
  if (Array.isArray(src)) walk(src);
  return { version: 1, type: "article", content: blocks };
}

function inlineFromTiptap(nodes: any[]): InlineContent[] {
  const out: InlineContent[] = [];
  for (const n of nodes) {
    if (!n) continue;
    if (n.type === "text") {
      const marks: InlineMark[] = [];
      for (const m of n.marks || []) {
        switch (m.type) {
          case "bold": marks.push({ type: "bold" }); break;
          case "italic": marks.push({ type: "italic" }); break;
          case "underline": marks.push({ type: "underline" }); break;
          case "strike": marks.push({ type: "strike" }); break;
          case "subscript": marks.push({ type: "subscript" }); break;
          case "superscript": marks.push({ type: "superscript" }); break;
          case "code": marks.push({ type: "code" }); break;
          case "link": marks.push({ type: "link", attrs: { href: m.attrs?.href || "#", target: m.attrs?.target || null } }); break;
          case "textStyle": {
            if (m.attrs?.color) marks.push({ type: "color", attrs: { color: m.attrs.color } });
            if (m.attrs?.fontFamily) marks.push({ type: "fontFamily", attrs: { family: m.attrs.fontFamily } });
            if (m.attrs?.fontSize) marks.push({ type: "fontSize", attrs: { size: m.attrs.fontSize } });
            break;
          }
          case "highlight": marks.push({ type: "highlight", attrs: { color: m.attrs?.color || null } }); break;
        }
      }
      out.push({ type: "text", text: n.text || "", marks: marks.length ? marks : undefined });
    } else if (n.type === "hardBreak") {
      out.push({ type: "hardBreak" });
    }
  }
  return out;
}

export function editorDocumentToHtml(doc: EditorDocument): string {
  if (!doc || !Array.isArray(doc.content)) return '<article class="openpost-article"></article>';
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const inlineToHtml = (inlines: InlineContent[]): string => {
    return inlines.map((node) => {
      if (node.type === "hardBreak") return "<br />";
      let t = esc(node.text);
      if (!node.marks || node.marks.length === 0) return t;
      for (const m of node.marks) {
        switch (m.type) {
          case "bold": t = `<strong>${t}</strong>`; break;
          case "italic": t = `<em>${t}</em>`; break;
          case "underline": t = `<u>${t}</u>`; break;
          case "strike": t = `<s>${t}</s>`; break;
          case "subscript": t = `<sub>${t}</sub>`; break;
          case "superscript": t = `<sup>${t}</sup>`; break;
          case "code": t = `<code>${t}</code>`; break;
          case "link": t = `<a href="${esc(m.attrs.href)}" ${m.attrs.target ? `target="${esc(m.attrs.target)}"` : ""} rel="noopener noreferrer">${t}</a>`; break;
          case "color": t = `<span style="color:${esc(m.attrs.color)}">${t}</span>`; break;
          case "highlight": t = `<mark${m.attrs.color ? ` style="background-color:${esc(m.attrs.color)}"` : ""}>${t}</mark>`; break;
          case "fontFamily": t = `<span style="font-family:${esc(m.attrs.family)}">${t}</span>`; break;
          case "fontSize": t = `<span style="font-size:${esc(m.attrs.size)}">${t}</span>`; break;
        }
      }
      return t;
    }).join("");
  };

  const blocks = doc.content.map((b) => {
    switch (b.type) {
      case "heading": {
        const lvl = (b as HeadingBlock).attrs.level;
        const align = (b as HeadingBlock).attrs.align ? ` style="text-align:${(b as HeadingBlock).attrs.align}"` : "";
        return `<h${lvl}${align} class="openpost-heading openpost-h${lvl}">${inlineToHtml((b as HeadingBlock).content)}</h${lvl}>`;
      }
      case "paragraph": {
        const align = (b as ParagraphBlock).attrs?.align ? ` style="text-align:${(b as ParagraphBlock).attrs?.align}"` : "";
        return `<p${align} class="openpost-paragraph">${inlineToHtml((b as ParagraphBlock).content)}</p>`;
      }
      case "image": {
        const a = (b as ImageBlock).attrs;
        const alignClass = `openpost-image--${a.alignment || "center"}`;
        const widthStyle = a.width ? ` style="width:${esc(String(a.width))};max-width:100%"` : "";
        const src = esc(a.src || "");
        const alt = esc(a.alt || "");
        const caption = a.caption ? `<figcaption class="openpost-caption">${esc(a.caption)}</figcaption>` : "";
        const linkStart = a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">` : "";
        const linkEnd = a.link ? `</a>` : "";
        return `<figure class="openpost-image ${alignClass}" data-media-id="${esc(a.mediaId || "")}"${widthStyle}>${linkStart}<img src="${src}" alt="${alt}" loading="lazy" decoding="async" />${linkEnd}${caption}</figure>`;
      }
      case "gallery": {
        const g = b as GalleryBlock;
        const items = g.attrs.images.map((im) => `<figure class="openpost-gallery-item"><img src="${esc(im.src || "")}" alt="${esc(im.alt)}" loading="lazy" /><figcaption>${esc(im.caption || "")}</figcaption></figure>`).join("");
        return `<div class="openpost-gallery openpost-gallery--${g.attrs.layout}">${items}</div>`;
      }
      case "quote": {
        const q = b as QuoteBlock;
        return `<blockquote class="openpost-quote"><p>${inlineToHtml(q.content)}</p>${q.attrs.cite ? `<cite>${esc(q.attrs.cite)}</cite>` : ""}</blockquote>`;
      }
      case "callout": {
        const c = b as CalloutBlock;
        return `<div class="openpost-callout openpost-callout--${c.attrs.tone}"><div class="openpost-callout-content">${inlineToHtml(c.content)}</div></div>`;
      }
      case "list": {
        const l = b as ListBlock;
        const tag = l.attrs.ordered ? "ol" : "ul";
        const items = l.content.map((li) => `<li class="openpost-li">${inlineToHtml(li.content)}</li>`).join("");
        return `<${tag} class="openpost-list openpost-list--${l.attrs.ordered ? "ordered" : "bulleted"}">${items}</${tag}>`;
      }
      case "checklist": {
        const cl = b as ChecklistBlock;
        const items = cl.content.map((it) => `<li class="openpost-checklist-item ${it.checked ? "is-checked" : ""}"><input type="checkbox" ${it.checked ? "checked" : ""} disabled /> ${inlineToHtml(it.content)}</li>`).join("");
        return `<ul class="openpost-checklist">${items}</ul>`;
      }
      case "table": {
        const t = b as TableBlock;
        const rows = t.content.map((row) => `<tr>${row.content.map((cell) => {
          const tag = cell.type === "tableHeader" ? "th" : "td";
          const align = cell.attrs?.align ? ` style="text-align:${cell.attrs.align}"` : "";
          return `<${tag}${align} class="openpost-td">${inlineToHtml(cell.content)}</${tag}>`;
        }).join("")}</tr>`).join("");
        return `<div class="openpost-table-wrapper"><table class="openpost-table"><tbody>${rows}</tbody></table></div>`;
      }
      case "codeBlock": {
        const cb = b as CodeBlock;
        return `<pre class="openpost-code"><code data-language="${esc(cb.attrs.language || "")}">${esc(cb.content)}</code></pre>`;
      }
      case "divider":
        return `<hr class="openpost-divider" />`;
      case "embed": {
        const e = b as EmbedBlock;
        if (e.attrs.provider === "youtube") {
          const id = extractYouTubeId(e.attrs.url);
          if (id) return `<div class="openpost-embed openpost-embed--youtube"><iframe src="https://www.youtube.com/embed/${esc(id)}" allowfullscreen loading="lazy"></iframe></div>`;
        }
        return `<div class="openpost-embed"><a href="${esc(e.attrs.url)}">${esc(e.attrs.url)}</a></div>`;
      }
      case "button": {
        const bt = b as ButtonBlock;
        return `<div class="openpost-button-wrapper"><a href="${esc(bt.attrs.url)}" class="openpost-button openpost-button--${bt.attrs.variant || "primary"}" ${bt.attrs.newTab ? 'target="_blank"' : ""}>${esc(bt.attrs.label)}</a></div>`;
      }
      case "faq": {
        const f = b as FaqBlock;
        const items = f.attrs.items.map((it) => `<details class="openpost-faq-item"><summary>${esc(it.q)}</summary><div>${esc(it.a)}</div></details>`).join("");
        return `<div class="openpost-faq">${items}</div>`;
      }
      case "poll": {
        const p = b as PollBlock;
        return `<div class="openpost-poll" data-poll-id="${esc(p.attrs.pollId)}"><!-- poll:${esc(p.attrs.pollId)} --></div>`;
      }
      default:
        return "";
    }
  }).join("\n");

  return `<article class="openpost-article" data-version="${doc.version}">\n${blocks}\n</article>`;
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
  } catch {}
  return null;
}

export function countDocumentWords(doc: EditorDocument): number {
  let text = "";
  const walkInlines = (inlines: InlineContent[]) => {
    for (const n of inlines) if (n.type === "text") text += n.text + " ";
  };
  for (const b of doc.content) {
    if ("content" in b && Array.isArray((b as any).content)) {
      if ((b as any).content[0] && typeof (b as any).content[0].text === "string") {
        walkInlines((b as any).content as InlineContent[]);
      } else if ((b as any).type === "list" || (b as any).type === "table") {
        const t = JSON.stringify(b);
        text += t.replace(/[^a-zA-Z]+/g, " ");
      }
    }
    if (b.type === "image" && (b as ImageBlock).attrs.caption) text += (b as ImageBlock).attrs.caption + " ";
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function readingTimeFromWords(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}

export function normalizeToEditorDocument(raw: any): EditorDocument {
  if (!raw) return { version: 1, type: "article", content: [] };
  if (raw.type === "article" && raw.version === 1) return raw as EditorDocument;
  if (raw.type === "doc" || raw.content) {
    return tiptapToEditorDocument(raw);
  }
  if (typeof raw === "string") {
    return { version: 1, type: "article", content: [{ type: "paragraph", content: [{ type: "text", text: raw }] }] };
  }
  return { version: 1, type: "article", content: [] };
}
