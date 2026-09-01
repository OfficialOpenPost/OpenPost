"use client";

import type { Editor } from "@tiptap/core";
import {
  Table as TableIcon,
  Plus,
  Trash2,
  Columns,
  Rows,
  Check,
  Split,
  Combine,
  Paintbrush,
} from "lucide-react";
import React, { useState } from "react";

interface TableContextMenuProps {
  editor: Editor | null;
}

export function TableContextMenu({ editor }: TableContextMenuProps) {
  if (!editor || !editor.isActive("table")) return null;

  return (
    <div className="space-y-4 text-xs text-navy">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold">
          <TableIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-navy truncate">Table Controls</p>
          <p className="text-[10px] text-text-tertiary">Rows, columns & styling</p>
        </div>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="p-1.5 rounded-lg text-flame hover:bg-flame/10 transition"
          title="Delete table"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Rows Controls */}
      <div className="space-y-1.5">
        <label className="font-bold text-navy flex items-center gap-1.5">
          <Rows className="h-3.5 w-3.5 text-brand" /> Rows
        </label>
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="rounded-lg border border-border p-1.5 font-semibold text-[11px] hover:bg-surface-raised transition text-center"
          >
            + Row Above
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="rounded-lg border border-border p-1.5 font-semibold text-[11px] hover:bg-surface-raised transition text-center"
          >
            + Row Below
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="rounded-lg border border-flame/20 p-1.5 font-semibold text-[11px] text-flame hover:bg-flame/10 transition text-center"
          >
            Delete Row
          </button>
        </div>
      </div>

      {/* Columns Controls */}
      <div className="space-y-1.5">
        <label className="font-bold text-navy flex items-center gap-1.5">
          <Columns className="h-3.5 w-3.5 text-brand" /> Columns
        </label>
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="rounded-lg border border-border p-1.5 font-semibold text-[11px] hover:bg-surface-raised transition text-center"
          >
            + Col Left
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="rounded-lg border border-border p-1.5 font-semibold text-[11px] hover:bg-surface-raised transition text-center"
          >
            + Col Right
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="rounded-lg border border-flame/20 p-1.5 font-semibold text-[11px] text-flame hover:bg-flame/10 transition text-center"
          >
            Delete Col
          </button>
        </div>
      </div>

      {/* Headers & Merging */}
      <div className="space-y-1.5">
        <label className="font-bold text-navy block">Headers & Cells</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            className="rounded-lg border border-border p-2 font-semibold text-[11px] hover:bg-surface-raised transition text-center"
          >
            Toggle Header Row
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
            className="rounded-lg border border-border p-2 font-semibold text-[11px] hover:bg-surface-raised transition text-center"
          >
            Toggle Header Col
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().mergeCells().run()}
            className="rounded-lg border border-border p-2 font-semibold text-[11px] hover:bg-surface-raised transition text-center"
          >
            Merge Cells
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().splitCell().run()}
            className="rounded-lg border border-border p-2 font-semibold text-[11px] hover:bg-surface-raised transition text-center"
          >
            Split Cell
          </button>
        </div>
      </div>
    </div>
  );
}
