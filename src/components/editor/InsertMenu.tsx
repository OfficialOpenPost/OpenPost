"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/core";
import { Plus, Image as ImageIcon, LayoutGrid, Quote, Table, BarChart3, Code2, Globe, Minus, X } from "lucide-react";
import { parseVideoUrl } from "./YouTubeBlockView";

const OPTIONS = [
  {
    label: "Image",
    icon: ImageIcon,
    action: (e: Editor) => {
      const url = window.prompt("Enter Image URL:");
      if (url) (e.chain().focus() as any).setImage({ src: url, layout: "center", width: "100%" }).run();
    },
  },
  {
    label: "Poll",
    icon: BarChart3,
    action: (e: Editor) =>
      e.chain().focus().insertContent({
        type: "pollBlock",
        attrs: {
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
          themeColor: "#FEA611",
        },
      }).run(),
  },
  {
    label: "Table",
    icon: Table,
    action: (e: Editor) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    label: "Quote",
    icon: Quote,
    action: (e: Editor) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Code",
    icon: Code2,
    action: (e: Editor) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: "Video",
    icon: Globe,
    action: (e: Editor) => {
      const url = window.prompt("Enter YouTube, Shorts, or Vimeo URL (or leave blank to configure):");
      if (url === null) return;
      if (!url.trim()) {
        e.chain().focus().insertContent({ type: "videoBlock", attrs: { src: "", url: "" } }).run();
        return;
      }
      const parsed = parseVideoUrl(url);
      e.chain().focus().insertContent({
        type: "videoBlock",
        attrs: {
          src: url.trim(),
          url: url.trim(),
          videoId: parsed?.videoId || "",
          provider: parsed?.provider || "youtube",
        },
      }).run();
    },
  },
  {
    label: "Divider",
    icon: Minus,
    action: (e: Editor) => e.chain().focus().setHorizontalRule().run(),
  },
];

export function InsertMenu({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false);
  if (!editor) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white shadow-sm hover:border-brand/30 hover:text-brand transition"
        title="Insert — like Sanity"
      >
        {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-20 w-64 rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#FCFCF9]">
            <p className="text-xs font-bold tracking-widest text-text-tertiary uppercase">Insert block — Sanity-like</p>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1.5">
            {OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  opt.action(editor);
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium hover:border-brand/20 hover:bg-brand/5 text-left"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <opt.icon className="h-3.5 w-3.5" />
                </span>
                {opt.label}
              </button>
            ))}
          </div>
          <p className="px-4 py-2 text-xs text-text-tertiary border-t border-border">Tip: type “/” for slash menu</p>
        </div>
      )}
    </div>
  );
}
