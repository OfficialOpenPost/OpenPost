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
  Heading5,
  Heading6,
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
  Share2,
  ChevronDown,
  Link,
} from "lucide-react";

export type SlashCategory = "Text & Structure" | "Media & Embeds" | "Interactive" | "Layout & Design";

export interface SlashItem {
  title: string;
  description?: string;
  keywords: string;
  category: SlashCategory;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  command: (props: { editor: any; range: Range }) => void;
}

export const slashItems: SlashItem[] = [
  {
    title: "Text",
    description: "Write plain text",
    keywords: "paragraph text normal body",
    category: "Text & Structure",
    icon: FileText,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    keywords: "h1 heading title large",
    category: "Text & Structure",
    icon: Heading1,
    shortcut: "Ctrl+Alt+1",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    keywords: "h2 heading section subtitle",
    category: "Text & Structure",
    icon: Heading2,
    shortcut: "Ctrl+Alt+2",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    keywords: "h3 heading subsection",
    category: "Text & Structure",
    icon: Heading3,
    shortcut: "Ctrl+Alt+3",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    title: "Heading 4",
    description: "Minor heading",
    keywords: "h4 heading minor",
    category: "Text & Structure",
    icon: Heading4,
    shortcut: "Ctrl+Alt+4",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 4 }).run(),
  },
  {
    title: "Heading 5",
    description: "Sub-minor heading",
    keywords: "h5 heading sub-minor",
    category: "Text & Structure",
    icon: Heading5,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 5 }).run(),
  },
  {
    title: "Heading 6",
    description: "Tiny heading",
    keywords: "h6 heading tiny",
    category: "Text & Structure",
    icon: Heading6,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 6 }).run(),
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    keywords: "bullet list ul points",
    category: "Text & Structure",
    icon: List,
    shortcut: "Ctrl+Shift+8",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    keywords: "numbered list ol numbers",
    category: "Text & Structure",
    icon: ListOrdered,
    shortcut: "Ctrl+Shift+7",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Task Checklist",
    description: "Task list with checkboxes",
    keywords: "task checklist todo check",
    category: "Text & Structure",
    icon: ListChecks,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Quote",
    description: "Block quote",
    keywords: "blockquote quote citation",
    category: "Text & Structure",
    icon: Quote,
    shortcut: "Ctrl+Shift+B",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Code with syntax highlighting",
    keywords: "code block syntax javascript python programming",
    category: "Text & Structure",
    icon: Code2,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    keywords: "divider hr horizontal line rule separator",
    category: "Text & Structure",
    icon: Minus,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Image",
    description: "Upload or embed image",
    keywords: "image picture photo upload",
    category: "Media & Embeds",
    icon: ImageIcon,
    command: ({ editor, range }) => {
      const url = window.prompt("Enter image URL (or drag & drop anywhere onto canvas):");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url, width: "100%", layout: "center", float: "none" }).run();
      }
    },
  },
  {
    title: "Gallery",
    description: "Photo grid or carousel",
    keywords: "gallery photos grid carousel",
    category: "Media & Embeds",
    icon: LayoutGrid,
    command: ({ editor, range }) => {
      const url = window.prompt("Enter first image URL:");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url, width: "100%", layout: "center", float: "none" }).run();
      }
    },
  },
  {
    title: "Video",
    description: "YouTube, Vimeo, or direct video",
    keywords: "video youtube vimeo embed",
    category: "Media & Embeds",
    icon: Globe,
    command: ({ editor, range }) => {
      const url = window.prompt("Enter YouTube, Shorts, or Vimeo URL (or leave blank to configure):");
      if (url === null) return;
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "videoBlock",
          attrs: {
            src: (url || "").trim(),
            url: (url || "").trim(),
            align: "center",
            width: "100%",
            aspectRatio: "16:9",
          },
        })
        .run();
    },
  },
  {
    title: "Social Embed",
    description: "Twitter, Instagram, or social post",
    keywords: "social embed twitter instagram",
    category: "Media & Embeds",
    icon: Share2,
    command: ({ editor, range }) => {
      const url = window.prompt("Enter social media URL (Twitter, Instagram, etc.):");
      if (url === null) return;
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "socialEmbed",
          attrs: {
            provider: "twitter",
            postId: "",
            url: (url || "").trim(),
          },
        })
        .run();
    },
  },
  {
    title: "Poll",
    description: "Reader poll with voting",
    keywords: "poll vote survey",
    category: "Interactive",
    icon: BarChart3,
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setPoll({
          pollId: `poll_${Date.now()}`,
          question: "What do you think?",
          description: "",
          options: [
            { id: "1", label: "Option A" },
            { id: "2", label: "Option B" },
          ],
          type: "single",
          showResults: "always",
          allowAnonymous: true,
          align: "center",
          layout: "center",
          width: "100%",
          status: "open",
        })
        .run(),
  },
  {
    title: "FAQ",
    description: "Frequently asked questions",
    keywords: "faq questions answers",
    category: "Interactive",
    icon: ListTree,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setFaq({ items: [{ question: "What is this topic?", answer: "Clear explanation." }] }).run(),
  },
  {
    title: "Accordion",
    description: "Expandable content section",
    keywords: "accordion expand collapse toggle",
    category: "Interactive",
    icon: ChevronDown,
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "accordion",
          attrs: {
            items: [
              { title: "Section 1", content: "Content for section 1..." },
              { title: "Section 2", content: "Content for section 2..." },
            ],
          },
        })
        .run(),
  },
  {
    title: "Callout",
    description: "Highlighted information box",
    keywords: "callout tip info warning note",
    category: "Layout & Design",
    icon: Sparkles,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setCallout({ tone: "info" }).run(),
  },
  {
    title: "Button",
    description: "Clickable call-to-action link",
    keywords: "button link cta action",
    category: "Layout & Design",
    icon: ArrowUpRight,
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "buttonBlock",
          attrs: {
            label: "Click me",
            url: "#",
            variant: "primary",
          },
        })
        .run(),
  },
  {
    title: "Download",
    description: "File download card",
    keywords: "download file attachment",
    category: "Layout & Design",
    icon: Download,
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "downloadBlock",
          attrs: {
            fileName: "file.pdf",
            fileSize: "1.2 MB",
            url: "#",
          },
        })
        .run(),
  },
  {
    title: "Table",
    description: "Data table with header",
    keywords: "table grid data",
    category: "Layout & Design",
    icon: Table,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

const CATEGORY_ORDER: SlashCategory[] = ["Text & Structure", "Media & Embeds", "Interactive", "Layout & Design"];

const SlashMenuComponent = forwardRef<any, { items: SlashItem[]; query: string; command: (item: SlashItem) => void }>(
  ({ items, query, command }, ref) => {
    const [selected, setSelected] = useState(0);

    useEffect(() => setSelected(0), [query]);

    const filtered = items.filter((item) => {
      const q = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });

    const grouped = CATEGORY_ORDER.reduce(
      (acc, category) => {
        const catItems = filtered.filter((item) => item.category === category);
        if (catItems.length > 0) {
          acc[category] = catItems;
        }
        return acc;
      },
      {} as Record<SlashCategory, SlashItem[]>
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

    const showPlaceholder = query.length === 0;

    if (filtered.length === 0) {
      return (
        <div className="rounded-xl border border-border bg-surface p-4 text-xs text-text-tertiary shadow-2xl">
          No blocks matching &quot;{query}&quot;
        </div>
      );
    }

    return (
      <div className="w-80 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl max-h-96 overflow-y-auto text-navy">
        {showPlaceholder && (
          <div className="px-3 pt-3 pb-1 text-xs text-text-tertiary">
            Search blocks...
          </div>
        )}
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
                  className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition ${
                    isSelected
                      ? "bg-navy text-white shadow-xs"
                      : "hover:bg-surface-raised text-text-primary"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? "bg-white/10 text-white" : "bg-brand/10 text-brand"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{item.title}</span>
                    {item.description && (
                      <span className={`block truncate text-[10px] ${isSelected ? "text-white/70" : "text-text-tertiary"}`}>
                        {item.description}
                      </span>
                    )}
                  </span>
                  {item.shortcut && (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono ${
                        isSelected ? "bg-white/10 text-white/80" : "bg-surface text-text-tertiary"
                      }`}
                    >
                      {item.shortcut}
                    </span>
                  )}
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
