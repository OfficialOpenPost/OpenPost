"use client";

import { BubbleMenu } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { Bold, Italic, Underline as UnderlineIcon, Link2 } from "lucide-react";
import { useState } from "react";

export function SelectionBubbleMenu({ editor }: { editor: Editor | null }) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  if (!editor) return null;

  const applyLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      let formatted = linkUrl.trim();
      if (!/^https?:\/\//i.test(formatted)) formatted = `https://${formatted}`;
      editor.chain().focus().setLink({ href: formatted }).run();
    }
    setShowLinkInput(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, placement: "top", offset: [0, 8] }}
      shouldShow={({ editor }) =>
        !editor.isActive("image") &&
        !editor.state.selection.empty &&
        !editor.isActive("codeBlock")
      }
      className="flex items-center gap-1 rounded-xl border border-border bg-navy p-1.5 shadow-xl"
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
          editor.isActive("bold")
            ? "bg-brand text-navy"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
          editor.isActive("italic")
            ? "bg-brand text-navy"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
          editor.isActive("underline")
            ? "bg-brand text-navy"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </button>

      <div className="h-5 w-px bg-white/15 mx-0.5" />

      {showLinkInput ? (
        <div className="flex items-center gap-1 px-1">
          <input
            type="url"
            autoFocus
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyLink();
              if (e.key === "Escape") setShowLinkInput(false);
            }}
            className="w-36 rounded-md bg-white/10 px-2 py-1 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded-md bg-brand px-2 py-1 text-xs font-bold text-navy hover:bg-brand-hover"
          >
            Apply
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setLinkUrl(editor.getAttributes("link").href || "");
            setShowLinkInput(true);
          }}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
            editor.isActive("link")
              ? "bg-brand text-navy"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
          title="Insert Link (URL)"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
      )}
    </BubbleMenu>
  );
}

// Deprecated floating image bubble menu to avoid covering image with duplicate floating pills
export function ImageBubbleMenu({ editor }: { editor: Editor | null }) {
  return null;
}
