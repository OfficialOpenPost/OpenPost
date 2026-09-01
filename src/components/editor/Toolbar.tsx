"use client";

import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  RemoveFormatting,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Code2,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  BarChart3,
  Sparkles,
  HelpCircle,
  Layers,
  Globe,
  ArrowUpRight,
  Download,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { InsertBlockModal, type BlockModalType } from "./InsertBlockModal";

interface ToolbarProps {
  editor: Editor | null;
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition shrink-0 ${
        active
          ? "bg-brand text-navy shadow-xs"
          : "text-navy hover:bg-surface-raised hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border shrink-0 self-center" />;
}

export function Toolbar({ editor }: ToolbarProps) {
  const [showInsertDropdown, setShowInsertDropdown] = useState(false);
  const [showHeadingsDropdown, setShowHeadingsDropdown] = useState(false);
  const [activeModal, setActiveModal] = useState<BlockModalType>(null);

  const insertMenuRef = useRef<HTMLDivElement>(null);
  const headingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (insertMenuRef.current && !insertMenuRef.current.contains(e.target as Node)) {
        setShowInsertDropdown(false);
      }
      if (headingsMenuRef.current && !headingsMenuRef.current.contains(e.target as Node)) {
        setShowHeadingsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  const insertItems: Array<{
    label: string;
    icon: any;
    modal: BlockModalType;
    desc: string;
  }> = [
    {
      label: "Image (Upload / Library / URL)",
      icon: ImageIcon,
      modal: "image",
      desc: "Upload WebP, pick from media, or paste URL",
    },
    {
      label: "Interactive Reader Poll",
      icon: BarChart3,
      modal: "poll",
      desc: "Create reader poll with live results",
    },
    {
      label: "Editorial Callout Box",
      icon: Sparkles,
      modal: "callout",
      desc: "Tip, Warning, Info, or Success card",
    },
    {
      label: "Data Table",
      icon: TableIcon,
      modal: "table",
      desc: "Customizable row & column grid",
    },
    {
      label: "FAQ Accordion (JSON-LD)",
      icon: HelpCircle,
      modal: "faq",
      desc: "Structured schema Q&A section",
    },
    {
      label: "Video Embed (YouTube / Vimeo)",
      icon: Globe,
      modal: "video",
      desc: "Clean responsive video embed",
    },
    {
      label: "Call-to-Action Button",
      icon: ArrowUpRight,
      modal: "button",
      desc: "Styled link button",
    },
    {
      label: "Downloadable Resource",
      icon: Download,
      modal: "download",
      desc: "Attachment file card",
    },
  ];

  return (
    <>
      <div className="w-full bg-white border border-border rounded-2xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* + Insert Block Dropdown */}
          <div className="relative shrink-0" ref={insertMenuRef}>
            <button
              type="button"
              onClick={() => setShowInsertDropdown(!showInsertDropdown)}
              className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Block</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {showInsertDropdown && (
              <div className="absolute left-0 top-10 z-50 w-72 rounded-2xl border border-border bg-white p-2 shadow-xl animate-in fade-in zoom-in-95">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Insert Content Block
                </p>
                <div className="space-y-0.5">
                  {insertItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setActiveModal(item.modal);
                        setShowInsertDropdown(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-surface-raised transition"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-navy shrink-0">
                        <item.icon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-navy">{item.label}</p>
                        <p className="text-[11px] text-text-tertiary">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* Headings Selector */}
          <div className="relative shrink-0" ref={headingsMenuRef}>
            <button
              type="button"
              onClick={() => setShowHeadingsDropdown(!showHeadingsDropdown)}
              className="flex items-center gap-1 rounded-xl border border-border bg-surface-dim px-2.5 py-1.5 text-xs font-bold text-navy hover:bg-surface-raised transition"
            >
              <span>
                {editor.isActive("heading", { level: 1 })
                  ? "Heading 1"
                  : editor.isActive("heading", { level: 2 })
                  ? "Heading 2"
                  : editor.isActive("heading", { level: 3 })
                  ? "Heading 3"
                  : editor.isActive("heading", { level: 4 })
                  ? "Heading 4"
                  : "Paragraph"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {showHeadingsDropdown && (
              <div className="absolute left-0 top-10 z-50 w-44 rounded-xl border border-border bg-white p-1.5 shadow-xl animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setParagraph().run();
                    setShowHeadingsDropdown(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-left ${
                    editor.isActive("paragraph") ? "bg-brand/20 font-bold text-navy" : "text-navy hover:bg-surface-raised"
                  }`}
                >
                  Paragraph
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                    setShowHeadingsDropdown(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-left ${
                    editor.isActive("heading", { level: 1 }) ? "bg-brand/20 font-bold text-navy" : "text-navy hover:bg-surface-raised"
                  }`}
                >
                  <Heading1 className="h-3.5 w-3.5" /> Heading 1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                    setShowHeadingsDropdown(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-left ${
                    editor.isActive("heading", { level: 2 }) ? "bg-brand/20 font-bold text-navy" : "text-navy hover:bg-surface-raised"
                  }`}
                >
                  <Heading2 className="h-3.5 w-3.5" /> Heading 2
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                    setShowHeadingsDropdown(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-left ${
                    editor.isActive("heading", { level: 3 }) ? "bg-brand/20 font-bold text-navy" : "text-navy hover:bg-surface-raised"
                  }`}
                >
                  <Heading3 className="h-3.5 w-3.5" /> Heading 3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 4 }).run();
                    setShowHeadingsDropdown(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-left ${
                    editor.isActive("heading", { level: 4 }) ? "bg-brand/20 font-bold text-navy" : "text-navy hover:bg-surface-raised"
                  }`}
                >
                  <Heading4 className="h-3.5 w-3.5" /> Heading 4
                </button>
              </div>
            )}
          </div>

          <Divider />

          {/* Text Styling */}
          <div className="flex items-center gap-1 shrink-0">
            <ToolbarButton
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("highlight")}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              title="Highlight Text"
            >
              <Highlighter className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
              title="Clear Formatting"
            >
              <RemoveFormatting className="h-3.5 w-3.5" />
            </ToolbarButton>
          </div>

          <Divider />

          {/* Text Alignment */}
          <div className="flex items-center gap-1 shrink-0">
            <ToolbarButton
              active={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              title="Align Left"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: "center" })}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              title="Align Center"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: "right" })}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              title="Align Right"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: "justify" })}
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              title="Justify"
            >
              <AlignJustify className="h-3.5 w-3.5" />
            </ToolbarButton>
          </div>

          <Divider />

          {/* Lists & Quotes */}
          <div className="flex items-center gap-1 shrink-0">
            <ToolbarButton
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <List className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("taskList")}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              title="Task Checklist"
            >
              <ListChecks className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Blockquote"
            >
              <Quote className="h-3.5 w-3.5" />
            </ToolbarButton>
          </div>

          <Divider />

          {/* Direct Visual Block Insertions (Triggering Modals) */}
          <div className="flex items-center gap-1 shrink-0">
            <ToolbarButton
              onClick={() => setActiveModal("image")}
              title="Insert Image (Upload / URL / Media Library)"
            >
              <ImageIcon className="h-3.5 w-3.5 text-brand" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setActiveModal("poll")}
              title="Insert Interactive Poll"
            >
              <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setActiveModal("callout")}
              title="Insert Callout Box"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setActiveModal("table")}
              title="Insert Table Grid"
            >
              <TableIcon className="h-3.5 w-3.5 text-emerald-600" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Divider"
            >
              <Minus className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("codeBlock")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Syntax Code Block"
            >
              <Code2 className="h-3.5 w-3.5" />
            </ToolbarButton>
          </div>

          <Divider />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
              <Undo2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
              <Redo2 className="h-3.5 w-3.5" />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* High-Quality Visual Insert Modal */}
      <InsertBlockModal
        type={activeModal}
        isOpen={Boolean(activeModal)}
        onClose={() => setActiveModal(null)}
        editor={editor}
      />
    </>
  );
}
