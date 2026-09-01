import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CharacterCount from "@tiptap/extension-character-count";
import FontFamily from "@tiptap/extension-font-family";
import Youtube from "@tiptap/extension-youtube";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { SlashExtension } from "./SlashMenu";
import { Extension } from "@tiptap/core";
import { FloatingImage } from "./image/FloatingImageExtension";
import { FontSize } from "./extensions/FontSize";
import { LineHeight } from "./extensions/LineHeight";
import { Callout } from "./blocks/Callout";
import { Gallery } from "./blocks/Gallery";
import { Faq } from "./blocks/Faq";
import { Accordion } from "./blocks/Accordion";
import { ButtonBlock } from "./blocks/Button";
import { DownloadBlock } from "./blocks/Download";
import { SocialEmbed } from "./blocks/SocialEmbed";
import { PollBlock } from "./blocks/Poll";
import { VideoBlock } from "./blocks/Video";
import { EmbedBlock } from "./blocks/Embed";

const HeadingShortcuts = Extension.create({
  name: "headingShortcuts",
  addKeyboardShortcuts() {
    return {
      "Mod-Alt-1": () => this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
      "Mod-Alt-2": () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
      "Mod-Alt-3": () => this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
      "Mod-Alt-4": () => this.editor.chain().focus().toggleHeading({ level: 4 }).run(),
      "Ctrl-Alt-1": () => this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
      "Ctrl-Alt-2": () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
      "Ctrl-Alt-3": () => this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
      "Ctrl-Alt-4": () => this.editor.chain().focus().toggleHeading({ level: 4 }).run(),
    };
  },
});

export const editorExtensions = [
  HeadingShortcuts,
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
    codeBlock: {
      HTMLAttributes: {
        class: "rounded-2xl bg-navy text-slate-100 p-5 my-6 overflow-x-auto font-mono text-sm shadow-sm",
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-brand bg-brand/5 pl-6 py-4 my-6 italic text-text-secondary rounded-r-2xl",
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: "my-10 border-border/80",
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: "list-disc pl-6 my-4 space-y-2 marker:text-brand",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal pl-6 my-4 space-y-2 marker:text-brand marker:font-bold",
      },
    },
    paragraph: {
      HTMLAttributes: {
        class: "leading-relaxed text-text-primary my-3.5",
      },
    },
  }),
  Underline,
  Subscript,
  Superscript,
  CharacterCount,
  FontFamily,
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
    HTMLAttributes: {
      class: "px-1 rounded-sm",
    },
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: {
      class: "text-flame underline underline-offset-4 decoration-flame/30 hover:decoration-flame font-medium cursor-pointer",
    },
  }),
  FloatingImage,
  Youtube.configure({
    HTMLAttributes: {
      class: "aspect-video w-full rounded-2xl my-6 overflow-hidden shadow-sm",
    },
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: "w-full my-6 border-collapse rounded-2xl overflow-hidden border border-border shadow-xs",
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: "border-b border-border last:border-0",
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: "bg-navy text-white font-bold text-left p-3.5 border-r border-white/10 last:border-0",
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: "p-3.5 border-r border-border last:border-0 bg-surface",
    },
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "my-4 space-y-2.5 list-none",
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "flex items-start gap-2.5",
    },
  }),
  TextAlign.configure({
    types: ["heading", "paragraph", "blockquote"],
    alignments: ["left", "center", "right", "justify"],
    defaultAlignment: "left",
  }),
  SlashExtension,
  FontSize,
  LineHeight,
  Callout,
  Gallery,
  Faq,
  Accordion,
  ButtonBlock,
  DownloadBlock,
  SocialEmbed,
  PollBlock,
  VideoBlock,
  EmbedBlock,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") return "Heading";
      return "Start typing your article, press '/' for commands, or insert media...";
    },
    showOnlyWhenEditable: true,
    showOnlyCurrent: false,
  }),
];

export const EDITOR_STYLES = `
  .tiptap {
    outline: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    position: relative;
  }

  .tiptap::after {
    content: "";
    display: table;
    clear: both;
  }

  .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #94A3B8;
    pointer-events: none;
    height: 0;
  }

  .tiptap p {
    margin: 0.85rem 0;
    line-height: 1.85;
    font-size: 1.125rem;
    color: #2D3440;
    text-wrap: pretty;
    clear: none !important;
    overflow: visible !important;
  }

  .tiptap h1 {
    font-size: 2.25rem;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.025em;
    margin: 2.5rem 0 1rem;
    color: #1E293B;
    clear: none !important;
  }

  .tiptap h2 {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.02em;
    margin: 2rem 0 0.85rem;
    color: #1E293B;
    clear: none !important;
  }

  .tiptap h3 {
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.35;
    margin: 1.75rem 0 0.75rem;
    color: #334155;
    clear: none !important;
  }

  .tiptap h4 {
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.4;
    margin: 1.5rem 0 0.5rem;
    color: #334155;
    clear: none !important;
  }

  /* ========================================================== */
  /* TEXT ALIGNMENTS                                            */
  /* ========================================================== */

  .tiptap [style*="text-align: center"],
  .tiptap p[style*="text-align: center"],
  .tiptap h1[style*="text-align: center"],
  .tiptap h2[style*="text-align: center"],
  .tiptap h3[style*="text-align: center"],
  .tiptap h4[style*="text-align: center"],
  .tiptap h5[style*="text-align: center"],
  .tiptap h6[style*="text-align: center"],
  .tiptap blockquote[style*="text-align: center"],
  .tiptap div[style*="text-align: center"] {
    text-align: center !important;
  }

  .tiptap [style*="text-align: right"],
  .tiptap p[style*="text-align: right"],
  .tiptap h1[style*="text-align: right"],
  .tiptap h2[style*="text-align: right"],
  .tiptap h3[style*="text-align: right"],
  .tiptap h4[style*="text-align: right"],
  .tiptap h5[style*="text-align: right"],
  .tiptap h6[style*="text-align: right"],
  .tiptap blockquote[style*="text-align: right"],
  .tiptap div[style*="text-align: right"] {
    text-align: right !important;
  }

  .tiptap [style*="text-align: justify"],
  .tiptap p[style*="text-align: justify"],
  .tiptap h1[style*="text-align: justify"],
  .tiptap h2[style*="text-align: justify"],
  .tiptap h3[style*="text-align: justify"],
  .tiptap h4[style*="text-align: justify"],
  .tiptap div[style*="text-align: justify"] {
    text-align: justify !important;
  }

  .tiptap [style*="text-align: left"],
  .tiptap p[style*="text-align: left"],
  .tiptap h1[style*="text-align: left"],
  .tiptap h2[style*="text-align: left"],
  .tiptap h3[style*="text-align: left"],
  .tiptap h4[style*="text-align: left"],
  .tiptap div[style*="text-align: left"] {
    text-align: left !important;
  }

  .tiptap a {
    color: #FE4F01;
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-color: rgba(254,79,1,0.3);
    transition: text-decoration-color 0.15s ease;
  }

  .tiptap a:hover {
    text-decoration-color: #FE4F01;
  }

  .tiptap code {
    background: #F1F5F9;
    color: #0F172A;
    padding: 0.2em 0.45em;
    border-radius: 6px;
    font-size: 0.875em;
    font-family: ui-monospace, monospace;
    border: 1px solid #E2E8F0;
  }

  .tiptap pre {
    background: #1E293B;
    color: #F8FAFC;
    padding: 1.25rem;
    border-radius: 16px;
    overflow-x: auto;
    margin: 1.75rem 0;
    border: 1px solid #334155;
    clear: both;
  }

  .tiptap pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }

  .tiptap table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.75rem 0;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #E2E8F0;
    clear: both;
  }

  .tiptap hr {
    clear: both;
  }

  .tiptap ::selection {
    background: rgba(254,166,17,0.28);
  }

  /* ========================================================== */
  /* PROFESSIONAL EDITORIAL FLOATING IMAGE & TEXT FLOW RULES   */
  /* ========================================================== */

  .tiptap .floating-image-host.image-float-left,
  .tiptap div[data-node-view-wrapper].image-align-left,
  .tiptap .floating-image-nodeview-root.image-align-left,
  .tiptap .image-align-left {
    float: left !important;
    clear: none !important;
    display: inline-block !important;
  }

  .tiptap .floating-image-host.image-float-right,
  .tiptap div[data-node-view-wrapper].image-align-right,
  .tiptap .floating-image-nodeview-root.image-align-right,
  .tiptap .image-align-right {
    float: right !important;
    clear: none !important;
    display: inline-block !important;
  }

  .tiptap .floating-image-host.image-float-center,
  .tiptap div[data-node-view-wrapper].image-align-center,
  .tiptap .floating-image-nodeview-root.image-align-center,
  .tiptap .image-align-center {
    display: block !important;
    width: 100% !important;
    clear: both !important;
    float: none !important;
    margin-left: auto !important;
    margin-right: auto !important;
    text-align: center !important;
  }

  .tiptap .floating-image-host.image-float-wide,
  .tiptap div[data-node-view-wrapper].image-align-wide,
  .tiptap .floating-image-nodeview-root.image-align-wide,
  .tiptap .image-align-wide {
    display: block !important;
    width: 100% !important;
    clear: both !important;
    float: none !important;
  }

  .tiptap .floating-image-host.image-float-inline,
  .tiptap div[data-node-view-wrapper].image-align-inline,
  .tiptap .floating-image-nodeview-root.image-align-inline,
  .tiptap .image-align-inline {
    display: inline-block !important;
    vertical-align: middle !important;
    clear: none !important;
    float: none !important;
  }

  /* Text flow clarity alongside floats */
  .tiptap p,
  .tiptap h1,
  .tiptap h2,
  .tiptap h3,
  .tiptap h4,
  .tiptap h5,
  .tiptap h6,
  .tiptap ul,
  .tiptap ol,
  .tiptap blockquote {
    clear: none !important;
    overflow: visible !important;
    display: block;
  }

  /* Mobile responsiveness: collapse floats automatically to prevent overflow */
  @media (max-width: 640px) {
    .tiptap .floating-image-host.image-float-left,
    .tiptap .floating-image-host.image-float-right,
    .tiptap div[data-node-view-wrapper].image-align-left,
    .tiptap div[data-node-view-wrapper].image-align-right,
    .tiptap .floating-image-nodeview-root.image-align-left,
    .tiptap .floating-image-nodeview-root.image-align-right,
    .tiptap .image-align-left,
    .tiptap .image-align-right {
      float: none !important;
      display: block !important;
      width: 100% !important;
      margin-left: auto !important;
      margin-right: auto !important;
      clear: both !important;
    }
  }
`;
