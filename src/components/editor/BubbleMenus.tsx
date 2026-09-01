"use client";

import { BubbleMenu } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { Bold, Italic, Underline as UnderlineIcon, Link2, Trash2, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon } from "lucide-react";

export function SelectionBubbleMenu({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, placement: "top", offset: [0, 8] }}
      className="flex items-center gap-1 rounded-xl border border-border bg-navy p-1.5 shadow-xl"
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${editor.isActive("bold") ? "bg-brand text-navy" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${editor.isActive("italic") ? "bg-brand text-navy" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${editor.isActive("underline") ? "bg-brand text-navy" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <div className="h-6 w-px bg-white/10 mx-1" />
      <button
        onClick={() => {
          const url = window.prompt("Enter URL");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${editor.isActive("link") ? "bg-brand text-navy" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
        title="Link"
      >
        <Link2 className="h-4 w-4" />
      </button>
    </BubbleMenu>
  );
}

export function ImageBubbleMenu({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, placement: "top", offset: [0, 12] }}
      shouldShow={({ editor }) => editor.isActive("image")}
      className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1.5 shadow-xl"
    >
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-raised hover:text-text-primary transition"
        title="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-raised hover:text-text-primary transition"
        title="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-raised hover:text-text-primary transition"
        title="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </button>
      <div className="h-6 w-px bg-border mx-1" />
      <button
        onClick={() => {
          const url = window.prompt("New image URL");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-raised hover:text-text-primary transition"
        title="Replace"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().deleteSelection().run()}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-flame hover:bg-flame/10 transition"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </BubbleMenu>
  );
}
