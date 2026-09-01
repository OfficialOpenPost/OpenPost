import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { ImageBlock } from "./blocks/Image";
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
import { FontSize } from "./extensions/FontSize";

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    codeBlock: {
      HTMLAttributes: {
        class: "rounded-xl bg-navy text-slate-100 p-4 my-4 overflow-x-auto font-mono text-sm",
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-brand bg-brand/5 pl-6 py-4 my-6 italic text-text-secondary rounded-r-xl",
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: "my-8 border-border",
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
        class: "leading-7 text-text-primary my-3",
      },
    },
  }),
  Underline,
  TextStyle,
  Color,
  Highlight.configure({
    HTMLAttributes: {
      class: "bg-brand/20 px-1 rounded",
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
  ImageBlock,
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: "w-full my-6 border-collapse rounded-xl overflow-hidden border border-border",
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: "border-b border-border last:border-0",
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: "bg-navy text-white font-bold text-left p-3 border-r border-white/10 last:border-0",
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: "p-3 border-r border-border last:border-0 bg-surface",
    },
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "my-4 space-y-2",
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "flex items-start gap-2",
    },
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  SlashExtension,
  FontSize,
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
      return "Start writing, or type '/' for blocks…";
    },
    showOnlyWhenEditable: true,
    showOnlyCurrent: false,
  }),
];

export const EDITOR_STYLES = `
  .tiptap {
    outline: none;
  }
  .tiptap p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #9CA3AF;
    pointer-events: none;
    height: 0;
  }
  .tiptap h1 {
    font-size: 2.25rem;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin: 2rem 0 1rem;
    color: #111827;
  }
  .tiptap h2 {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.015em;
    margin: 1.75rem 0 0.85rem;
    color: #111827;
  }
  .tiptap h3 {
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.4;
    margin: 1.5rem 0 0.75rem;
    color: #1F2937;
  }
  .tiptap a {
    color: #FE4F01;
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-color: rgba(254,79,1,0.3);
  }
  .tiptap a:hover {
    text-decoration-color: #FE4F01;
  }
  .tiptap code {
    background: #2D3440;
    color: #FEA611;
    padding: 0.2em 0.4em;
    border-radius: 6px;
    font-size: 0.875em;
    font-family: ui-monospace, monospace;
  }
  .tiptap pre {
    background: #2D3440;
    color: #E5E7EB;
    padding: 1rem;
    border-radius: 12px;
    overflow-x: auto;
    margin: 1.5rem 0;
  }
  .tiptap pre code {
    background: transparent;
    color: inherit;
    padding: 0;
  }
  .tiptap img {
    border-radius: 12px;
    display: block;
    max-width: 100%;
    height: auto;
  }
  .tiptap img.ProseMirror-selectednode {
    outline: 3px solid #FEA611;
    outline-offset: 2px;
  }
  .tiptap ul[data-type="taskList"] {
    list-style: none;
    padding: 0;
  }
  .tiptap ul[data-type="taskList"] li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .tiptap table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.5rem 0;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #E5E7EB;
  }
  .tiptap ::selection {
    background: rgba(254,166,17,0.25);
  }
`;
