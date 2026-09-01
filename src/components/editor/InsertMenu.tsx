"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/core";
import { Plus, Image as ImageIcon, LayoutGrid, Quote, Table, BarChart3, Code2, Globe, Minus, X } from "lucide-react";

const OPTIONS = [
  { label: "Image", icon: ImageIcon, action: (e: Editor) => { const url = window.prompt("Image URL"); if (url) e.chain().focus().setImage({ src: url }).run(); } },
  { label: "Gallery", icon: LayoutGrid, action: (e: Editor) => e.chain().focus().insertContent("<p>Gallery — add images via media library</p>").run() },
  { label: "Quote", icon: Quote, action: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { label: "Table", icon: Table, action: (e: Editor) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { label: "Poll", icon: BarChart3, action: (e: Editor) => e.chain().focus().insertContent("<p>Poll — configure in sidebar</p>").run() },
  { label: "Code", icon: Code2, action: (e: Editor) => e.chain().focus().toggleCodeBlock().run() },
  { label: "Embed", icon: Globe, action: (e: Editor) => { const url = window.prompt("YouTube/Vimeo URL"); if (url) e.chain().focus().insertContent(`<p>Embed: ${url}</p>`).run(); } },
  { label: "Divider", icon: Minus, action: (e: Editor) => e.chain().focus().setHorizontalRule().run() },
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
