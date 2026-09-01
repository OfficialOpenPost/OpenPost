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
  MoreHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { useState } from "react";

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
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
        active ? "bg-navy text-white shadow-sm" : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-border" />;
}

export function Toolbar({ editor }: ToolbarProps) {
  const [showMore, setShowMore] = useState(false);

  if (!editor) return null;

  const addImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      // Try WebP upload, fallback to prompt URL
      try {
        const { uploadImageWithWebP } = await import("@/lib/uploadMedia");
        const { url } = await uploadImageWithWebP(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        const url = window.prompt("Enter image URL (upload failed, paste URL)");
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }
    };
    input.click();
  };

  const addLink = () => {
    const url = window.prompt("Enter URL");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto flex max-w-[960px] items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-none">
        {/* Text group */}
        <div className="flex items-center gap-0.5 shrink-0">
          <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Divider />

        {/* Headings */}
        <div className="flex items-center gap-0.5 shrink-0">
          <ToolbarButton active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraph">
            <span className="text-xs font-bold">P</span>
          </ToolbarButton>
        </div>

        <Divider />

        {/* Alignment — hidden on mobile, shown in overflow */}
        <div className="hidden md:flex items-center gap-0.5 shrink-0">
          <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center">
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <div className="hidden md:block">
          <Divider />
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 shrink-0">
          <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist">
            <ListChecks className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Divider />

        {/* Insert */}
        <div className="flex items-center gap-0.5 shrink-0">
          <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link (Ctrl+K)">
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Image">
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addTable} title="Table">
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Divider />

        {/* History */}
        <div className="flex items-center gap-0.5 shrink-0">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Overflow toggle for mobile */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-raised md:hidden"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {showMore && (
        <div className="border-t border-border bg-surface px-4 py-2 flex flex-wrap gap-1 md:hidden">
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center">
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}
