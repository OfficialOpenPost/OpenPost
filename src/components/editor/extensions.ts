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
import { FloatingImageNode } from "./floating/FloatingImageNode";
import "./floating/editor-floating.css";
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
    dropcursor: {
      color: "#FEA611",
      width: 3,
      class: "openpost-prosemirror-dropcursor",
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
  FloatingImageNode,
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
    font-family: Inter, system-ui, -apple-system, sans-serif;
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
    overflow: visible;
  }

  .tiptap h1 {
    font-size: 2.25rem;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.025em;
    margin: 2.5rem 0 1rem;
    color: #1E293B;
  }

  .tiptap h2 {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.02em;
    margin: 2rem 0 0.85rem;
    color: #1E293B;
  }

  .tiptap h3 {
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.35;
    margin: 1.75rem 0 0.75rem;
    color: #334155;
  }

  .tiptap h4 {
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.4;
    margin: 1.5rem 0 0.5rem;
    color: #334155;
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

  /* Text alignment */
  .tiptap [style*="text-align: center"] { text-align: center !important; }
  .tiptap [style*="text-align: right"] { text-align: right !important; }
  .tiptap [style*="text-align: justify"] { text-align: justify !important; }
  .tiptap [style*="text-align: left"] { text-align: left !important; }

  /* Floating Image Styles for Content & Preview */
  figure.openpost-floating-image,
  .prose figure.openpost-floating-image {
    box-sizing: border-box !important;
    position: relative !important;
    max-width: 100% !important;
  }
  figure.openpost-floating-image[data-float="left"],
  .prose figure.openpost-floating-image[data-float="left"] {
    float: left !important;
    clear: none !important;
    max-width: 80% !important;
  }
  figure.openpost-floating-image[data-float="right"],
  .prose figure.openpost-floating-image[data-float="right"] {
    float: right !important;
    clear: none !important;
    max-width: 80% !important;
  }
  figure.openpost-floating-image[data-layout="wide"],
  .prose figure.openpost-floating-image[data-layout="wide"] {
    float: none !important;
    clear: both !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  figure.openpost-floating-image[data-layout="center"],
  .prose figure.openpost-floating-image[data-layout="center"] {
    float: none !important;
    clear: both !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  /* Card and Image constraints in preview */
  figure.openpost-floating-image .openpost-fi-card,
  .prose figure.openpost-floating-image .openpost-fi-card {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  figure.openpost-floating-image img,
  .prose figure.openpost-floating-image img {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    object-fit: contain !important;
  }

  /* Clearfix for preview and published posts */
  .prose::after, .tiptap::after {
    content: "";
    display: table;
    clear: both;
  }
  .prose figure.openpost-floating-image {
    margin-top: 0.5rem;
    margin-bottom: 0.75rem;
  }
`;
