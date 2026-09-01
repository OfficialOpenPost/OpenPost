"use client";

import React, { useState } from "react";
import { BubbleMenu } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link2,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Quote,
  List,
  ListOrdered,
  Sparkles,
  ExternalLink,
  Trash2,
} from "lucide-react";

const HIGHLIGHT_COLORS = [
  { name: "Yellow", color: "#FEF08A" },
  { name: "Green", color: "#BBF7D0" },
  { name: "Blue", color: "#BAE6FD" },
  { name: "Pink", color: "#FBCFE8" },
  { name: "Orange", color: "#FED7AA" },
];

export function SelectionBubbleMenu({ editor }: { editor: Editor | null }) {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [showHighlightPopover, setShowHighlightPopover] = useState(false);

  if (!editor || editor.isDestroyed || !editor.view) return null;

  const applyLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      let formatted = linkUrl.trim();
      if (!/^https?:\/\//i.test(formatted)) formatted = `https://${formatted}`;
      editor
        .chain()
        .focus()
        .setLink({
          href: formatted,
          target: openInNewTab ? "_blank" : "_self",
        })
        .run();
    }
    setShowLinkPopover(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 150,
        placement: "top",
        offset: [0, 10],
        zIndex: 50,
      }}
      shouldShow={({ editor }) => {
        if (!editor || editor.isDestroyed || !editor.view) return false;
        return (
          !editor.isActive("image") &&
          !editor.state.selection.empty &&
          !editor.isActive("codeBlock")
        );
      }}
      className="flex items-center gap-1 rounded-2xl border border-slate-700/80 bg-[#1E293B] px-2.5 py-1.5 shadow-2xl text-white backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none relative"
    >
      {/* ── Text Styling Group ── */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-white/20">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            editor.isActive("bold")
              ? "bg-brand text-navy font-bold shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            editor.isActive("italic")
              ? "bg-brand text-navy font-bold shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            editor.isActive("underline")
              ? "bg-brand text-navy font-bold shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            editor.isActive("strike")
              ? "bg-brand text-navy font-bold shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            editor.isActive("code")
              ? "bg-brand text-navy font-bold shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </button>
      </div>

      {/* ── Headings & Hierarchy Group ── */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-white/20">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
            editor.isActive("heading", { level: 1 })
              ? "bg-brand text-navy shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Heading 1"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
            editor.isActive("heading", { level: 2 })
              ? "bg-brand text-navy shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Heading 2"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
            editor.isActive("heading", { level: 3 })
              ? "bg-brand text-navy shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Heading 3"
        >
          H3
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            editor.isActive("blockquote")
              ? "bg-brand text-navy font-bold shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Alignment Group ── */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-white/20">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            editor.isActive({ textAlign: "left" })
              ? "bg-brand text-navy font-bold shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            editor.isActive({ textAlign: "center" })
              ? "bg-brand text-navy font-bold shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            editor.isActive({ textAlign: "right" })
              ? "bg-brand text-navy font-bold shadow-xs"
              : "text-slate-200 hover:bg-white/15 hover:text-white"
          }`}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Lists & Color & Link Group ── */}
      <div className="flex items-center gap-0.5 pl-1">
        {/* Highlight Color Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHighlightPopover(!showHighlightPopover);
              setShowLinkPopover(false);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
              editor.isActive("highlight")
                ? "bg-brand text-navy font-bold shadow-xs"
                : "text-slate-200 hover:bg-white/15 hover:text-white"
            }`}
            title="Text Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </button>

          {showHighlightPopover && (
            <div className="absolute top-11 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-slate-700/80 bg-[#1E293B] p-2.5 shadow-2xl text-xs text-white flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
              {HIGHLIGHT_COLORS.map((hc) => (
                <button
                  key={hc.name}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: hc.color }).run();
                    setShowHighlightPopover(false);
                  }}
                  style={{ backgroundColor: hc.color }}
                  className="h-6 w-6 rounded-full border border-white/20 transition hover:scale-110 hover:shadow-xs"
                  title={hc.name}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setShowHighlightPopover(false);
                }}
                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white/10 hover:bg-white/20 text-slate-200"
                title="Clear Highlight"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Hyperlink Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const currentHref = editor.getAttributes("link").href || "";
              setLinkUrl(currentHref);
              setShowLinkPopover(!showLinkPopover);
              setShowHighlightPopover(false);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
              editor.isActive("link") || showLinkPopover
                ? "bg-brand text-navy font-bold shadow-xs"
                : "text-slate-200 hover:bg-white/15 hover:text-white"
            }`}
            title="Hyperlink (Ctrl+K)"
          >
            <Link2 className="h-4 w-4" />
          </button>

          {showLinkPopover && (
            <div className="absolute top-11 left-1/2 -translate-x-1/2 z-50 w-72 rounded-2xl border border-slate-700/80 bg-[#1E293B] p-3.5 shadow-2xl text-xs text-white animate-in fade-in zoom-in-95 duration-150">
              <p className="font-bold mb-1.5 text-slate-200 text-xs">Text Hyperlink</p>
              <input
                type="url"
                autoFocus
                placeholder="https://example.com..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyLink();
                  if (e.key === "Escape") setShowLinkPopover(false);
                }}
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openInNewTab}
                    onChange={(e) => setOpenInNewTab(e.target.checked)}
                    className="rounded text-brand"
                  />
                  New tab
                </label>
                <div className="flex gap-1.5">
                  {editor.isActive("link") && (
                    <button
                      type="button"
                      onClick={() => {
                        editor.chain().focus().unsetLink().run();
                        setLinkUrl("");
                        setShowLinkPopover(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold"
                    >
                      Unlink
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={applyLink}
                    className="px-3.5 py-1.5 rounded-xl bg-brand text-navy font-bold text-xs hover:bg-brand-hover shadow-xs"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </BubbleMenu>
  );
}

export function ImageBubbleMenu({ editor }: { editor: Editor | null }) {
  return null;
}
