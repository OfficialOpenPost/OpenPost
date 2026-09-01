"use client";

import { BubbleMenu } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link2,
  Heading2,
  Heading3,
  Sparkles,
  Baseline,
  Highlighter,
} from "lucide-react";
import { useState } from "react";

export function SelectionBubbleMenu({ editor }: { editor: Editor | null }) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  if (!editor || editor.isDestroyed || !editor.view) return null;

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
      shouldShow={({ editor }) => {
        if (!editor || editor.isDestroyed || !editor.view) return false;
        return (
          !editor.isActive("image") &&
          !editor.state.selection.empty &&
          !editor.isActive("codeBlock")
        );
      }}
      className="flex items-center gap-0.5 rounded-xl border border-border/80 bg-navy p-1 shadow-2xl text-white backdrop-blur-md animate-in fade-in duration-100"
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
          editor.isActive("bold")
            ? "bg-brand text-navy font-bold"
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
            ? "bg-brand text-navy font-bold"
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
            ? "bg-brand text-navy font-bold"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
          editor.isActive("strike")
            ? "bg-brand text-navy font-bold"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-px bg-white/15 mx-0.5" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition text-xs font-bold ${
          editor.isActive("heading", { level: 2 })
            ? "bg-brand text-navy"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition text-xs font-bold ${
          editor.isActive("heading", { level: 3 })
            ? "bg-brand text-navy"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Heading 3"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
          editor.isActive("code")
            ? "bg-brand text-navy font-bold"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Inline Code"
      >
        <Code className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-px bg-white/15 mx-0.5" />

      {/* Alignment Buttons in Bubble Menu */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
          editor.isActive({ textAlign: "left" })
            ? "bg-brand text-navy font-bold"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Align Left"
      >
        <span className="text-[11px] font-bold">L</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
          editor.isActive({ textAlign: "center" })
            ? "bg-brand text-navy font-bold"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Align Center"
      >
        <span className="text-[11px] font-bold">C</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
          editor.isActive({ textAlign: "right" })
            ? "bg-brand text-navy font-bold"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        title="Align Right"
      >
        <span className="text-[11px] font-bold">R</span>
      </button>

      <div className="h-4 w-px bg-white/15 mx-0.5" />

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
              ? "bg-brand text-navy font-bold"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
          title="Insert Link (Ctrl+K)"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
      )}
    </BubbleMenu>
  );
}

export function ImageBubbleMenu({ editor }: { editor: Editor | null }) {
  return null;
}
