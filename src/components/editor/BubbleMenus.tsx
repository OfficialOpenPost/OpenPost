"use client";

import React, { useEffect, useRef, useState } from "react";
import { BubbleMenu } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link2,
  MoreHorizontal,
  Copy,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import { CODE_LANGUAGES } from "./extensions/CodeBlockLanguage";
import { getBlockLabel, getBlockIcon } from "./block-controls/block-utils";
import {
  ADD_BLOCK_OPTIONS,
  deleteBlock,
  duplicateBlock,
  getBlockTopLevel,
  moveBlockDown,
  moveBlockUp,
  useBlockKeyboardShortcuts,
} from "./block-controls/block-operations";

const PILL_BUTTON_CLASS = `flex h-8 w-8 items-center justify-center rounded-xl transition`;

function pillButtonClass(active: boolean) {
  return active
    ? `${PILL_BUTTON_CLASS} bg-brand text-navy font-bold shadow-xs`
    : `${PILL_BUTTON_CLASS} text-slate-200 hover:bg-white/15 hover:text-white`;
}

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  kbd?: string;
  danger?: boolean;
  onClick: () => void;
}

function BlockMenuItem({ icon: Icon, label, kbd, danger, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition ${
        danger
          ? "text-rose-300 hover:bg-rose-500/20 hover:text-rose-200"
          : "text-slate-200 hover:bg-white/15 hover:text-white"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {kbd && (
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
          {kbd}
        </kbd>
      )}
    </button>
  );
}

export function SelectionBubbleMenu({ editor }: { editor: Editor | null }) {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuView, setBlockMenuView] = useState<"actions" | "add">("actions");
  const [blockMenuAbove, setBlockMenuAbove] = useState(false);
  const [, setTick] = useState(0);
  const linkRef = useRef<HTMLDivElement>(null);
  const blockMenuRef = useRef<HTMLDivElement>(null);

  useBlockKeyboardShortcuts(editor);

  // Keep pill state (active marks, block label) in sync with editor transactions.
  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((value) => value + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);

  // Close floating popovers when clicking outside them.
  useEffect(() => {
    if (!showLinkPopover && !showBlockMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (linkRef.current && !linkRef.current.contains(target)) setShowLinkPopover(false);
      if (blockMenuRef.current && !blockMenuRef.current.contains(target)) {
        setShowBlockMenu(false);
        setBlockMenuView("actions");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showLinkPopover, showBlockMenu]);

  // Close floating popovers whenever the editor selection moves.
  useEffect(() => {
    if (!editor) return;
    const close = () => {
      setShowLinkPopover(false);
      setShowBlockMenu(false);
      setBlockMenuView("actions");
    };
    editor.on("selectionUpdate", close);
    return () => {
      editor.off("selectionUpdate", close);
    };
  }, [editor]);

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

  const blockCtx = getBlockTopLevel(editor);
  const blockLabel = blockCtx ? getBlockLabel(blockCtx.node.type.name, blockCtx.node.attrs) : "Block";
  const blockIcon = blockCtx ? getBlockIcon(blockCtx.node.type.name, blockCtx.node.attrs) : "\u25AA";

  const closeBlockMenu = () => {
    setShowBlockMenu(false);
    setBlockMenuView("actions");
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
        className={pillButtonClass(editor.isActive("bold"))}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={pillButtonClass(editor.isActive("italic"))}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={pillButtonClass(editor.isActive("underline"))}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-white/20 mx-0.5" />

      {/* Link */}
      <div className="relative" ref={linkRef}>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (showLinkPopover) {
              setShowLinkPopover(false);
              return;
            }
            closeBlockMenu();
            const currentHref = editor.getAttributes("link").href || "";
            setLinkUrl(currentHref);
            setShowLinkPopover(true);
          }}
          className={pillButtonClass(editor.isActive("link") || showLinkPopover)}
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

      {/* Block options (moved here from the left-margin block handle) */}
      {blockCtx && (
        <>
          <div className="w-px h-5 bg-white/20 mx-0.5" />

          <div className="relative" ref={blockMenuRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                if (showBlockMenu) {
                  closeBlockMenu();
                  return;
                }
                setShowLinkPopover(false);
                const rect = e.currentTarget.getBoundingClientRect();
                setBlockMenuAbove(rect.bottom + 268 > window.innerHeight - 12);
                setBlockMenuView("actions");
                setShowBlockMenu(true);
              }}
              className={pillButtonClass(showBlockMenu)}
              title="Block options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showBlockMenu && (
              <div
                className={`absolute left-1/2 -translate-x-1/2 z-50 w-64 max-w-[calc(100vw-1.5rem)] max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#1E293B] p-1.5 shadow-2xl text-xs text-white animate-in fade-in zoom-in-95 duration-150 ${
                  blockMenuAbove ? "bottom-full mb-2" : "top-full mt-2"
                }`}
              >
                {blockMenuView === "actions" ? (
                  <>
                    <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <span className="text-sm normal-case">{blockIcon}</span>
                      <span className="truncate">{blockLabel}</span>
                    </div>
                    <div className="mx-1.5 h-px bg-white/10" />

                    <BlockMenuItem
                      icon={Copy}
                      label="Duplicate"
                      kbd="Ctrl+D"
                      onClick={() => {
                        closeBlockMenu();
                        duplicateBlock(editor);
                      }}
                    />
                    <BlockMenuItem
                      icon={ArrowUp}
                      label="Move Up"
                      kbd="Ctrl+Shift+\u2191"
                      onClick={() => {
                        closeBlockMenu();
                        moveBlockUp(editor);
                      }}
                    />
                    <BlockMenuItem
                      icon={ArrowDown}
                      label="Move Down"
                      kbd="Ctrl+Shift+\u2193"
                      onClick={() => {
                        closeBlockMenu();
                        moveBlockDown(editor);
                      }}
                    />

                    <div className="mx-1.5 h-px bg-white/10" />

                    <BlockMenuItem
                      icon={CornerDownLeft}
                      label="Add Block Below"
                      onClick={() => setBlockMenuView("add")}
                    />

                    <div className="mx-1.5 h-px bg-white/10" />

                    <BlockMenuItem
                      icon={Trash2}
                      label="Delete"
                      danger
                      onClick={() => {
                        closeBlockMenu();
                        deleteBlock(editor);
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 px-1.5 py-1.5">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setBlockMenuView("actions")}
                        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-400 transition hover:bg-white/15 hover:text-white"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-semibold">Back</span>
                      </button>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Add Block
                      </span>
                    </div>
                    <div className="mx-1.5 h-px bg-white/10 mb-1.5" />

                    <div className="grid grid-cols-3 gap-1">
                      {ADD_BLOCK_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            closeBlockMenu();
                            opt.insert(editor);
                          }}
                          className="flex flex-col items-center gap-1 rounded-xl border border-transparent px-1.5 py-2 text-center transition hover:border-white/10 hover:bg-white/15"
                        >
                          <span className="text-sm leading-none text-brand">{opt.icon}</span>
                          <span className="text-[10px] font-semibold text-slate-300">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </BubbleMenu>
  );
}

export function CodeBlockBubbleMenu({ editor }: { editor: Editor | null }) {
  if (!editor || editor.isDestroyed || !editor.view) return null;

  const currentLanguage = editor.getAttributes("codeBlock").language ?? "";

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 150,
        placement: "top",
        offset: [0, 10],
        zIndex: 50,
      }}
      shouldShow={({ editor: ed }) => {
        if (!ed || ed.isDestroyed || !ed.view) return false;
        return ed.isActive("codeBlock");
      }}
      className="flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-[#1E293B] px-2.5 py-1.5 shadow-2xl text-white backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none relative"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Language</span>
      <select
        value={currentLanguage}
        onChange={(e) => {
          editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value }).run();
        }}
        className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
      >
        {CODE_LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value} className="bg-[#1E293B] text-white">
            {lang.label}
          </option>
        ))}
      </select>
    </BubbleMenu>
  );
}

