"use client";

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance } from "tippy.js";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { FileText, Heading2, Image as ImageIcon, LayoutGrid, Quote, Sparkles, Table, BarChart3, Code2, Globe, ListTree, ArrowUpRight, Minus, Download, Layers, Play } from "lucide-react";

export interface SlashItem {
  title: string;
  keywords: string;
  category: "Basic" | "Media" | "Interactive" | "Layout";
  icon: React.ComponentType<{ className?: string }>;
  command: (props: { editor: any; range: Range }) => void;
}

export const slashItems: SlashItem[] = [
  { title: "Text", keywords: "paragraph text", category: "Basic", icon: FileText, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
  { title: "Heading 2", keywords: "h2 heading", category: "Basic", icon: Heading2, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run() },
  { title: "Image", keywords: "image picture", category: "Media", icon: ImageIcon, command: ({ editor, range }) => { const url = window.prompt("Image URL"); if (url) editor.chain().focus().deleteRange(range).setImage({ src: url }).run(); } },
  { title: "Gallery", keywords: "gallery carousel grid", category: "Media", icon: LayoutGrid, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent("<p>[Gallery — add 2+ images]</p>").run() },
  { title: "Quote", keywords: "blockquote quote", category: "Basic", icon: Quote, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
  { title: "Callout", keywords: "callout info warning", category: "Layout", icon: Sparkles, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent('<blockquote data-type="callout">Callout — info/warning/success</blockquote>').run() },
  { title: "Table", keywords: "table grid", category: "Layout", icon: Table, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: "Poll", keywords: "poll vote survey", category: "Interactive", icon: BarChart3, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent("<p>[Poll block — configure question + options]</p>").run() },
  { title: "Code Block", keywords: "code block", category: "Basic", icon: Code2, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
  { title: "Embed", keywords: "youtube vimeo embed", category: "Media", icon: Globe, command: ({ editor, range }) => { const url = window.prompt("YouTube/Vimeo URL"); if (url) editor.chain().focus().deleteRange(range).insertContent(`<p>[Embed: ${url}]</p>`).run(); } },
  { title: "FAQ", keywords: "faq accordion", category: "Interactive", icon: ListTree, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent("<p>[FAQ — Q/A pairs]</p>").run() },
  { title: "Button", keywords: "button cta", category: "Interactive", icon: ArrowUpRight, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent('<p><a href="#">Button</a></p>').run() },
  { title: "Divider", keywords: "divider hr", category: "Layout", icon: Minus, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
  { title: "Download", keywords: "download file", category: "Media", icon: Download, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent("<p>[Download file]</p>").run() },
  { title: "Accordion", keywords: "accordion collapsible", category: "Layout", icon: Layers, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent("<p>[Accordion — collapsible sections]</p>").run() },
  { title: "Video", keywords: "video", category: "Media", icon: Play, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertContent("<p>[Video — upload or link]</p>").run() },
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
      return <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-tertiary shadow-xl">No results for &quot;{query}&quot;</div>;
    }

    return (
      <div className="w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-xl max-h-80 overflow-y-auto">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">{category}</p>
            {items.map((item) => {
              const isSelected = flat[selected] === item;
              return (
                <button
                  key={item.title}
                  onClick={() => command(item)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${isSelected ? "bg-navy text-white" : "hover:bg-surface-raised text-text-primary"}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isSelected ? "bg-white/10 text-white" : "bg-brand/10 text-brand"}`}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{item.title}</span>
                </button>
              );
            })}
          </div>
        ))}
        <p className="border-t border-border px-3 py-2 text-[11px] text-text-tertiary">↑↓ navigate · Enter select · Esc close</p>
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
