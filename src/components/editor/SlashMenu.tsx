"use client";

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance } from "tippy.js";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  LayoutGrid,
  Quote,
  Sparkles,
  Table,
  BarChart3,
  Code2,
  Globe,
  ListTree,
  ArrowUpRight,
  Minus,
  Download,
  Layers,
  Play,
  List,
  ListOrdered,
  ListChecks,
} from "lucide-react";

export interface SlashItem {
  title: string;
  keywords: string;
  category: "Basic" | "Media" | "Interactive" | "Layout";
  icon: React.ComponentType<{ className?: string }>;
  command: (props: { editor: any; range: Range }) => void;
}

export const slashItems: SlashItem[] = [
  {
    title: "Text",
    keywords: "paragraph text normal body",
    category: "Basic",
    icon: FileText,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading 1",
    keywords: "h1 heading title large",
    category: "Basic",
    icon: Heading1,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
  },
  {
    title: "Heading 2",
    keywords: "h2 heading section subtitle",
    category: "Basic",
    icon: Heading2,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Heading 3",
    keywords: "h3 heading subsection",
    category: "Basic",
    icon: Heading3,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    title: "Bullet List",
    keywords: "bullet list ul points",
    category: "Basic",
    icon: List,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    keywords: "numbered list ol numbers",
    category: "Basic",
    icon: ListOrdered,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Task Checklist",
    keywords: "task checklist todo check",
    category: "Basic",
    icon: ListChecks,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Floating Image",
    keywords: "image picture photo float media wrap",
    category: "Media",
    icon: ImageIcon,
    command: ({ editor, range }) => {
      const url = window.prompt("Enter image URL (or drag & drop anywhere onto canvas):");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url, width: "100%", layout: "center", float: "none" }).run();
      }
    },
  },
  {
    title: "Table (3 × 3)",
    keywords: "table grid spreadsheet rows cols",
    category: "Layout",
    icon: Table,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: "Callout Box",
    keywords: "callout tip info warning alert note",
    category: "Layout",
    icon: Sparkles,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setCallout({ tone: "info" }).run(),
  },
  {
    title: "Quote",
    keywords: "blockquote quote citation",
    category: "Basic",
    icon: Quote,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    keywords: "code block syntax javascript python programming",
    category: "Basic",
    icon: Code2,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    keywords: "divider hr horizontal line rule separator",
    category: "Layout",
    icon: Minus,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Reader Poll",
    keywords: "poll vote survey question",
    category: "Interactive",
    icon: BarChart3,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setPoll({ question: "Reader Question?", options: ["Option 1", "Option 2"] }).run(),
  },
  {
    title: "FAQ Section",
    keywords: "faq accordion questions answers",
    category: "Interactive",
    icon: ListTree,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setFaq({ items: [{ question: "What is this topic?", answer: "Clear explanation." }] }).run(),
  },
  {
    title: "Video / Embed",
    keywords: "video youtube vimeo embed stream",
    category: "Media",
    icon: Globe,
    command: ({ editor, range }) => {
      const url = window.prompt("Enter YouTube or Vimeo URL:");
      if (url) {
        editor.chain().focus().deleteRange(range).setEmbed({ url }).run();
      }
    },
  },
];

const SlashMenuComponent = forwardRef<any, { items: SlashItem[]; query: string; command: (item: SlashItem) => void }>(
  ({ items, query, command }, ref) => {
    const [selected, setSelected] = useState(0);

    useEffect(() => setSelected(0), [query]);

    const filtered = items.filter((item) => {
      const q = query.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q);
    });

    const grouped = filtered.reduce(
      (acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      },
      {} as Record<string, SlashItem[]>
    );

    const flat = filtered;

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelected((prev) => (prev - 1 + flat.length) % flat.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelected((prev) => (prev + 1) % flat.length);
          return true;
        }
        if (event.key === "Enter") {
          if (flat[selected]) command(flat[selected]);
          return true;
        }
        return false;
      },
    }));

    if (filtered.length === 0) {
      return (
        <div className="rounded-xl border border-border bg-surface p-4 text-xs text-text-tertiary shadow-2xl">
          No commands matching &quot;{query}&quot;
        </div>
      );
    }

    return (
      <div className="w-72 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl max-h-80 overflow-y-auto text-navy">
        {Object.entries(grouped).map(([category, catItems]) => (
          <div key={category} className="p-1">
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
              {category}
            </p>
            {catItems.map((item) => {
              const isSelected = flat[selected] === item;
              return (
                <button
                  key={item.title}
                  onClick={() => command(item)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition ${
                    isSelected
                      ? "bg-navy text-white shadow-xs"
                      : "hover:bg-surface-raised text-text-primary"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isSelected ? "bg-white/10 text-white" : "bg-brand/10 text-brand"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        ))}
        <div className="border-t border-border px-3 py-1.5 text-[10px] text-text-tertiary bg-surface-raised flex justify-between">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>Esc close</span>
        </div>
      </div>
    );
  }
);
SlashMenuComponent.displayName = "SlashMenuComponent";

export const SlashExtension = Extension.create({
  name: "slash",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: new PluginKey("slash"),
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => slashItems,
        render: () => {
          let component: ReactRenderer | null = null;
          let popup: Instance | null = null;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashMenuComponent, {
                props,
                editor: props.editor,
              });
              if (!props.clientRect) return;
              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              }) as unknown as Instance;
            },
            onUpdate(props: any) {
              component?.updateProps(props);
              if (!props.clientRect) return;
              popup?.setProps({ getReferenceClientRect: props.clientRect });
            },
            onKeyDown(props: any) {
              if (props.event.key === "Escape") {
                popup?.hide();
                return true;
              }
              return (component?.ref as unknown as { onKeyDown: (p: unknown) => boolean })?.onKeyDown(props) ?? false;
            },
            onExit() {
              popup?.destroy();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});
