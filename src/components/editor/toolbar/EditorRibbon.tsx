"use client";

import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code as CodeIcon,
  List,
  ListOrdered,
  ListChecks,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Table as TableIcon,
  Image as ImageIcon,
  BarChart3,
  Sparkles,
  Undo2,
  Redo2,
  Highlighter,
  Baseline,
  Search,
  Maximize,
  Minimize,
  ListTree,
  Eye,
  FileDown,
  FileText,
  HelpCircle,
  Video,
  ChevronDown,
  Plus,
  Minus,
  RemoveFormatting,
  Quote,
  Minus as DividerIcon,
  Indent,
  Outdent,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ColorPickerPopover } from "./ColorPickerPopover";
import { InsertBlockModal } from "../InsertBlockModal";

interface EditorRibbonProps {
  editor: Editor | null;
  onOpenFindReplace?: () => void;
  onToggleOutline?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onOpenPreview?: () => void;
}

const FONT_FAMILIES = [
  { label: "Default Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Outfit", value: "'Outfit', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Merriweather", value: "'Merriweather', Georgia, serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Courier", value: "'Courier New', Courier, monospace" },
];

const FONT_SIZES = [
  { label: "10 px", value: "10px" },
  { label: "12 px", value: "12px" },
  { label: "14 px", value: "14px" },
  { label: "16 px (Normal)", value: "16px" },
  { label: "18 px", value: "18px" },
  { label: "20 px", value: "20px" },
  { label: "24 px", value: "24px" },
  { label: "30 px", value: "30px" },
  { label: "36 px", value: "36px" },
  { label: "48 px", value: "48px" },
  { label: "60 px", value: "60px" },
  { label: "72 px", value: "72px" },
];

export function EditorRibbon({
  editor,
  onOpenFindReplace,
  onToggleOutline,
  onToggleFullscreen,
  isFullscreen = false,
  onOpenPreview,
}: EditorRibbonProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showTableGridPicker, setShowTableGridPicker] = useState(false);
  const [hoveredTableRows, setHoveredTableRows] = useState(3);
  const [hoveredTableCols, setHoveredTableCols] = useState(3);
  const [linkUrl, setLinkUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [activeModal, setActiveModal] = useState<any>(null);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const linkBtnRef = useRef<HTMLButtonElement>(null);
  const tableBtnRef = useRef<HTMLButtonElement>(null);
  const [linkPopoverPos, setLinkPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [tablePopoverPos, setTablePopoverPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setShowTableGridPicker(false);
        setShowLinkPopover(false);
        setLinkPopoverPos(null);
        setTablePopoverPos(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const toggleLinkPopover = useCallback(() => {
    if (showLinkPopover) {
      setShowLinkPopover(false);
      setLinkPopoverPos(null);
    } else {
      setLinkUrl(editor?.getAttributes("link").href || "");
      const rect = linkBtnRef.current?.getBoundingClientRect();
      if (rect) {
        setLinkPopoverPos({ top: rect.bottom + 4, left: rect.left });
      }
      setShowLinkPopover(true);
    }
  }, [showLinkPopover, editor]);

  const toggleTablePopover = useCallback(() => {
    if (showTableGridPicker) {
      setShowTableGridPicker(false);
      setTablePopoverPos(null);
    } else {
      const rect = tableBtnRef.current?.getBoundingClientRect();
      if (rect) {
        setTablePopoverPos({ top: rect.bottom + 4, left: rect.left });
      }
      setShowTableGridPicker(true);
    }
  }, [showTableGridPicker]);

  if (!editor) return null;

  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      let formatted = linkUrl.trim();
      if (!/^https?:\/\//i.test(formatted)) formatted = `https://${formatted}`;
      editor.chain().focus().setLink({ href: formatted, target: openInNewTab ? "_blank" : undefined }).run();
    }
    setShowLinkPopover(false);
    setLinkPopoverPos(null);
  };

  const handleExportHtml = () => {
    const html = editor.getHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "article-export.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const json = JSON.stringify(editor.getJSON(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "article-document.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAlign = (alignment: "left" | "center" | "right" | "justify") => {
    if (editor.isActive("image")) {
      const currentAttrs = editor.getAttributes("image");
      if (alignment === "left") {
        const currentW = currentAttrs.width;
        const nextW = currentW === "100%" ? "45%" : currentW || "45%";
        editor.chain().focus().updateAttributes("image", {
          layout: "left",
          float: "left",
          wrapMode: "square",
          width: nextW,
        }).run();
      } else if (alignment === "right") {
        const currentAttrs = editor.getAttributes("image");
        const currentW = currentAttrs.width;
        const nextW = currentW === "100%" ? "45%" : currentW || "45%";
        editor.chain().focus().updateAttributes("image", {
          layout: "right",
          float: "right",
          wrapMode: "square",
          width: nextW,
        }).run();
      } else if (alignment === "center") {
        editor.chain().focus().updateAttributes("image", {
          layout: "center",
          float: "none",
          wrapMode: "top-bottom",
        }).run();
      } else if (alignment === "justify") {
        editor.chain().focus().updateAttributes("image", {
          layout: "wide",
          float: "none",
          wrapMode: "top-bottom",
          width: "100%",
        }).run();
      }
    } else {
      editor.chain().focus().setTextAlign(alignment).run();
    }
  };

  const isImageSelected = editor.isActive("image");
  const imgAttrs = isImageSelected ? editor.getAttributes("image") : {};
  const isLeftActive = isImageSelected
    ? imgAttrs.layout === "left" || imgAttrs.float === "left"
    : editor.isActive({ textAlign: "left" });
  const isCenterActive = isImageSelected
    ? (imgAttrs.layout === "center" || !imgAttrs.layout) && imgAttrs.float !== "left" && imgAttrs.float !== "right"
    : editor.isActive({ textAlign: "center" });
  const isRightActive = isImageSelected
    ? imgAttrs.layout === "right" || imgAttrs.float === "right"
    : editor.isActive({ textAlign: "right" });
  const isJustifyActive = isImageSelected
    ? imgAttrs.layout === "wide"
    : editor.isActive({ textAlign: "justify" });

  const currentFontSizeStr = editor.getAttributes("textStyle").fontSize || "16px";
  const currentFontSizeNum = parseInt(currentFontSizeStr) || 16;

  const changeFontSizeStep = (delta: number) => {
    const nextSize = Math.max(10, Math.min(72, currentFontSizeNum + delta));
    (editor.chain().focus() as any).setFontSize?.(`${nextSize}px`).run();
  };

  return (
    <div
      ref={menuContainerRef}
      className="w-full border border-border bg-white shadow-sm select-none transition-all text-navy"
    >
      <style>{`.editor-ribbon { scrollbar-width: none; } .editor-ribbon::-webkit-scrollbar { display: none; }`}</style>
      {/* TIER 1: WORD-STYLE TOP MENU BAR (File, Edit, Insert, Format, View, Tools) */}
      <div className="flex items-center gap-1.5 px-3.5 py-1.5 border-b border-border/80 text-xs font-bold bg-[#F8FAFC]">
        {/* FILE MENU */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
            className={`px-3 py-1 rounded-lg transition ${
              activeMenu === "file" ? "bg-navy text-white shadow-xs font-bold" : "text-slate-700 hover:bg-white hover:text-navy hover:shadow-xs"
            }`}
          >
            File
          </button>
          {activeMenu === "file" && (
            <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-xl border border-border bg-white p-1.5 shadow-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  handleExportHtml();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <FileDown className="h-3.5 w-3.5 text-brand" /> Export Clean HTML
              </button>
              <button
                type="button"
                onClick={() => {
                  handleExportJson();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <FileText className="h-3.5 w-3.5 text-brand" /> Export Document JSON
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                Print / Save as PDF
              </button>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === "edit" ? null : "edit")}
            className={`px-3 py-1 rounded-lg transition ${
              activeMenu === "edit" ? "bg-navy text-white shadow-xs font-bold" : "text-slate-700 hover:bg-white hover:text-navy hover:shadow-xs"
            }`}
          >
            Edit
          </button>
          {activeMenu === "edit" && (
            <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-xl border border-border bg-white p-1.5 shadow-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().undo().run();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <span className="flex items-center gap-2"><Undo2 className="h-3.5 w-3.5" /> Undo</span>
                <span className="text-[10px] text-text-tertiary font-mono">Ctrl+Z</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().redo().run();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <span className="flex items-center gap-2"><Redo2 className="h-3.5 w-3.5" /> Redo</span>
                <span className="text-[10px] text-text-tertiary font-mono">Ctrl+Y</span>
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().selectAll().run();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <span>Select All</span>
                <span className="text-[10px] text-text-tertiary font-mono">Ctrl+A</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetAllMarks().clearNodes().run();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <RemoveFormatting className="h-3.5 w-3.5 text-brand" /> Clear All Formatting
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenFindReplace?.();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <span className="flex items-center gap-2"><Search className="h-3.5 w-3.5 text-brand" /> Find & Replace</span>
                <span className="text-[10px] text-text-tertiary font-mono">Ctrl+F</span>
              </button>
            </div>
          )}
        </div>

        {/* INSERT MENU */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === "insert" ? null : "insert")}
            className={`px-3 py-1 rounded-lg transition ${
              activeMenu === "insert" ? "bg-navy text-white shadow-xs font-bold" : "text-slate-700 hover:bg-white hover:text-navy hover:shadow-xs"
            }`}
          >
            Insert
          </button>
          {activeMenu === "insert" && (
            <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-xl border border-border bg-white p-1.5 shadow-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveModal("image");
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <ImageIcon className="h-3.5 w-3.5 text-brand" /> Floating Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTableGridPicker(true);
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <TableIcon className="h-3.5 w-3.5 text-brand" /> Table Matrix Grid...
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal("callout");
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand" /> Callout Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal("youtube");
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <Video className="h-3.5 w-3.5 text-brand" /> YouTube / Video
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal("faq");
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <HelpCircle className="h-3.5 w-3.5 text-brand" /> FAQ Accordion
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal("poll");
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <BarChart3 className="h-3.5 w-3.5 text-brand" /> Interactive Poll...
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleCodeBlock().run();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <CodeIcon className="h-3.5 w-3.5" /> Code Block
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleBlockquote().run();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <Quote className="h-3.5 w-3.5" /> Blockquote
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setHorizontalRule().run();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <DividerIcon className="h-3.5 w-3.5" /> Horizontal Divider
              </button>
            </div>
          )}
        </div>

        {/* VIEW MENU */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
            className={`px-3 py-1 rounded-lg transition ${
              activeMenu === "view" ? "bg-navy text-white shadow-xs font-bold" : "text-slate-700 hover:bg-white hover:text-navy hover:shadow-xs"
            }`}
          >
            View
          </button>
          {activeMenu === "view" && (
            <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-xl border border-border bg-white p-1.5 shadow-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  onToggleOutline?.();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <ListTree className="h-3.5 w-3.5 text-brand" /> Document Outline
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleFullscreen?.();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <span className="flex items-center gap-2">
                  {isFullscreen ? <Minimize className="h-3.5 w-3.5 text-brand" /> : <Maximize className="h-3.5 w-3.5 text-brand" />}
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
                </span>
                <span className="text-[10px] text-text-tertiary font-mono">F11</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenPreview?.();
                  setActiveMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-surface-raised transition"
              >
                <Eye className="h-3.5 w-3.5 text-brand" /> Reading Preview
              </button>
            </div>
          )}
        </div>

        {/* QUICK SEARCH (Ctrl+F) */}
        <button
          type="button"
          onClick={onOpenFindReplace}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:text-navy hover:shadow-xs transition"
          title="Find & Replace (Ctrl+F)"
        >
          <Search className="h-3.5 w-3.5 text-brand" />
          <span className="hidden sm:inline">Find</span>
          <kbd className="hidden md:inline rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[9px] text-slate-700">
            Ctrl+F
          </kbd>
        </button>
      </div>

      {/* TIER 2: PROFESSIONAL TOOLBAR — single bar with thin separators (no excessive cards) */}
      <div className="editor-ribbon flex items-center gap-0.5 p-1.5 overflow-x-auto flex-nowrap text-navy border-t border-border/60 bg-white">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border/60 mr-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-slate-100 disabled:opacity-30 transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-slate-100 disabled:opacity-30 transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Typography */}
        <div className="flex items-center gap-1 pr-2 border-r border-border/60 mr-1">
          <select
            value={
              editor.isActive("heading", { level: 1 })
                ? "h1"
                : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                ? "h3"
                : editor.isActive("heading", { level: 4 })
                ? "h4"
                : editor.isActive("blockquote")
                ? "quote"
                : editor.isActive("codeBlock")
                ? "code"
                : "p"
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "p") editor.chain().focus().setParagraph().run();
              if (val === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
              if (val === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
              if (val === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
              if (val === "h4") editor.chain().focus().toggleHeading({ level: 4 }).run();
              if (val === "quote") editor.chain().focus().toggleBlockquote().run();
              if (val === "code") editor.chain().focus().toggleCodeBlock().run();
            }}
            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-navy focus:border-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="quote">Quote</option>
            <option value="code">Code</option>
          </select>
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (!val) (editor.chain().focus() as any).unsetFontFamily?.().run();
              else (editor.chain().focus() as any).setFontFamily?.(val).run();
            }}
            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-navy focus:border-slate-300 focus:outline-none cursor-pointer hidden sm:block max-w-[110px]"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <div className="hidden md:flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => changeFontSizeStep(-2)}
              title="Decrease Font Size"
              className="flex h-7 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-bold text-navy hover:bg-slate-50"
            >
              A−
            </button>
            <select
              value={currentFontSizeStr}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) (editor.chain().focus() as any).unsetFontSize?.().run();
                else (editor.chain().focus() as any).setFontSize?.(val).run();
              }}
              className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-xs font-mono text-navy focus:border-slate-300 focus:outline-none cursor-pointer"
            >
              {FONT_SIZES.map((sz) => (
                <option key={sz.value} value={sz.value}>
                  {sz.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => changeFontSizeStep(2)}
              title="Increase Font Size"
              className="flex h-7 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-bold text-navy hover:bg-slate-50"
            >
              A+
            </button>
          </div>
        </div>

        {/* Formatting */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
              editor.isActive("bold") ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
              editor.isActive("italic") ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
              editor.isActive("underline") ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
              editor.isActive("strike") ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => (editor.chain().focus() as any).toggleSuperscript?.().run()}
            className={`hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
              editor.isActive("superscript") ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"
            }`}
            title="Superscript"
          >
            <span className="font-mono text-[11px] font-bold">X²</span>
          </button>
          <button
            type="button"
            onClick={() => (editor.chain().focus() as any).toggleSubscript?.().run()}
            className={`hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
              editor.isActive("subscript") ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"
            }`}
            title="Subscript"
          >
            <span className="font-mono text-[11px] font-bold">X₁</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
              editor.isActive("code") ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"
            }`}
            title="Inline Code"
          >
            <CodeIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-slate-100 transition"
            title="Clear Formatting"
          >
            <RemoveFormatting className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTextColorPicker(!showTextColorPicker)}
              className="flex h-7 w-7 flex-col items-center justify-center rounded-md text-navy hover:bg-slate-100 transition"
              title="Text Color"
            >
              <Baseline className="h-3.5 w-3.5" />
              <div className="h-1 w-3.5 rounded-full mt-0.5" style={{ backgroundColor: editor.getAttributes("textStyle").color || "#0f172a" }} />
            </button>
            <ColorPickerPopover
              isOpen={showTextColorPicker}
              onClose={() => setShowTextColorPicker(false)}
              currentColor={editor.getAttributes("textStyle").color}
              title="Text Color"
              onSelectColor={(c) => {
                if (!c) editor.chain().focus().unsetColor().run();
                else editor.chain().focus().setColor(c).run();
              }}
            />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHighlightColorPicker(!showHighlightColorPicker)}
              className="flex h-7 w-7 flex-col items-center justify-center rounded-md text-navy hover:bg-slate-100 transition"
              title="Highlight"
            >
              <Highlighter className="h-3.5 w-3.5" />
              <div className="h-1 w-3.5 rounded-full mt-0.5 bg-amber-400" />
            </button>
            <ColorPickerPopover
              isOpen={showHighlightColorPicker}
              onClose={() => setShowHighlightColorPicker(false)}
              isHighlight
              title="Highlight"
              onSelectColor={(c) => {
                if (!c) editor.chain().focus().unsetHighlight().run();
                else editor.chain().focus().setHighlight({ color: c }).run();
              }}
            />
          </div>
        </div>

        {/* Alignments */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
          <button
            type="button"
            onClick={() => handleAlign("left")}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${isLeftActive ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"}`}
            title="Align Left"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleAlign("center")}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${isCenterActive ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"}`}
            title="Align Center"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleAlign("right")}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${isRightActive ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"}`}
            title="Align Right"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleAlign("justify")}
            className={`hidden sm:flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${isJustifyActive ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"}`}
            title="Justify"
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${editor.isActive("bulletList") ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"}`}
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${editor.isActive("orderedList") ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"}`}
            title="Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`hidden md:flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${editor.isActive("taskList") ? "bg-slate-900 text-white" : "text-navy hover:bg-slate-100"}`}
            title="Checklist"
          >
            <ListChecks className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-slate-100 transition"
            title="Indent"
          >
            <Indent className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().liftListItem("listItem").run()}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-slate-100 transition"
            title="Outdent"
          >
            <Outdent className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Insert */}
        <div className="flex items-center gap-1">
          <button
            ref={linkBtnRef}
            type="button"
            onClick={toggleLinkPopover}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
              editor.isActive("link")
                ? "bg-brand text-navy font-bold shadow-xs"
                : "text-navy hover:bg-white hover:shadow-xs"
            }`}
            title="Insert Link (Ctrl+K)"
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          {showLinkPopover && linkPopoverPos && createPortal(
            <div
              className="fixed z-[9999] w-72 rounded-xl border border-border bg-white p-3 shadow-2xl text-xs text-navy"
              style={{ top: linkPopoverPos.top, left: linkPopoverPos.left }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span className="font-bold text-navy mb-1.5 block">Insert Hyperlink</span>
              <input
                type="url"
                autoFocus
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyLink();
                  if (e.key === "Escape") { setShowLinkPopover(false); setLinkPopoverPos(null); }
                }}
                className="w-full rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-navy focus:border-brand focus:outline-none"
              />
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border">
                <label className="flex items-center gap-1.5 text-[11px] text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openInNewTab}
                    onChange={(e) => setOpenInNewTab(e.target.checked)}
                    className="rounded text-brand"
                  />
                  Open in new tab
                </label>
                <div className="flex gap-1.5">
                  {editor.isActive("link") && (
                    <button
                      type="button"
                      onClick={() => {
                        editor.chain().focus().unsetLink().run();
                        setShowLinkPopover(false);
                        setLinkPopoverPos(null);
                      }}
                      className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold hover:bg-surface-raised"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleApplyLink}
                    className="rounded-lg bg-brand px-3 py-1 font-bold text-navy text-[11px] hover:bg-brand-hover"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
          <button
            type="button"
            onClick={() => setActiveModal("image")}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-navy hover:bg-white hover:shadow-xs transition"
            title="Insert Floating Image"
          >
            <ImageIcon className="h-3.5 w-3.5 text-brand" />
            <span className="hidden sm:inline">Image</span>
          </button>
          <button
            ref={tableBtnRef}
            type="button"
            onClick={toggleTablePopover}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-navy hover:bg-white hover:shadow-xs transition"
            title="Insert Table Grid Matrix"
          >
            <TableIcon className="h-3.5 w-3.5 text-brand" />
            <span className="hidden sm:inline">Table</span>
            <ChevronDown className="h-3 w-3 text-text-tertiary" />
          </button>
          {showTableGridPicker && tablePopoverPos && createPortal(
            <div
              className="fixed z-[9999] rounded-2xl border border-border bg-white p-3 shadow-2xl text-xs text-navy"
              style={{ top: tablePopoverPos.top, left: tablePopoverPos.left }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border">
                <span className="font-bold text-navy">Insert Table</span>
                <span className="font-mono text-brand font-bold text-[11px]">
                  {hoveredTableCols} × {hoveredTableRows}
                </span>
              </div>
              <div className="grid grid-cols-10 gap-1 p-1 bg-surface-raised rounded-xl border border-border">
                {Array.from({ length: 8 }).map((_, r) =>
                  Array.from({ length: 10 }).map((_, c) => {
                    const isHighlighted = r < hoveredTableRows && c < hoveredTableCols;
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseEnter={() => {
                          setHoveredTableRows(r + 1);
                          setHoveredTableCols(c + 1);
                        }}
                        onClick={() => {
                          editor
                            .chain()
                            .focus()
                            .insertTable({
                              rows: r + 1,
                              cols: c + 1,
                              withHeaderRow: true,
                            })
                            .run();
                          setShowTableGridPicker(false);
                          setTablePopoverPos(null);
                        }}
                        className={`h-4 w-4 rounded-xs border cursor-pointer transition-colors ${
                          isHighlighted
                            ? "bg-brand border-brand"
                            : "bg-white border-border hover:border-brand/40"
                        }`}
                      />
                    );
                  })
                )}
              </div>
              <p className="mt-2 text-center text-[10px] text-text-tertiary">
                Click cell to insert {hoveredTableCols} × {hoveredTableRows} table
              </p>
            </div>,
            document.body
          )}
          <button
            type="button"
            onClick={() => setActiveModal("poll")}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-navy hover:bg-white hover:shadow-xs transition"
            title="Create Interactive Reader Poll"
          >
            <BarChart3 className="h-3.5 w-3.5 text-brand" />
            <span className="hidden sm:inline">Poll</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("callout")}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-navy hover:bg-white hover:shadow-xs transition hidden lg:flex"
            title="Insert Callout Card"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>Callout</span>
          </button>
        </div>
      </div>

      {/* Insert Block Modal (For uploading, library, polls, FAQs, embeds) */}
      <InsertBlockModal
        type={activeModal}
        isOpen={Boolean(activeModal)}
        onClose={() => setActiveModal(null)}
        editor={editor}
      />
    </div>
  );
}
