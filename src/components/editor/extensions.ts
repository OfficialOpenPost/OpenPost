import "@/lib/prosemirror-patch";
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
import { TrailingNode } from "./extensions/TrailingNode";

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
      class: "w-full my-6 border-collapse overflow-hidden border border-border shadow-xs",
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
  TrailingNode,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") return "Heading";
      return "Start typing your article, press '/' for commands, or insert media...";
    },
    showOnlyWhenEditable: true,
    showOnlyCurrent: false,
  }),
];

export { EDITOR_STYLES } from "./editor-styles";
