"use client";

import React, { useState } from "react";
import { BubbleMenu } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link2,
} from "lucide-react";

export function SelectionBubbleMenu({ editor }: { editor: Editor | null }) {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);

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
      className="flex items-center gap-1 rounded-2xl border border-slate-700/80 bg-[#1E293B] px-2 py-1.5 shadow-2xl text-white backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none relative"
    >
      {/* Bold */}
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

      {/* Italic */}
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

      {/* Underline */}
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

      {/* Divider */}
      <div className="w-px h-5 bg-white/20 mx-0.5" />

      {/* Link */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            const currentHref = editor.getAttributes("link").href || "";
            setLinkUrl(currentHref);
            setShowLinkPopover(!showLinkPopover);
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
    </BubbleMenu>
  );
}

export function ImageBubbleMenu({ editor }: { editor: Editor | null }) {
  return null;
}
