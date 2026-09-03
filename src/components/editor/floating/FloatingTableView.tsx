"use client";

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import React, { useState, useCallback, useEffect } from "react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  Trash2,
  GripVertical,
  Plus,
  Paintbrush,
  CheckSquare,
  ChevronUp,
  ChevronDown,
  Trash,
  Hash,
} from "lucide-react";

const CELL_SHADING_COLORS = [
  { name: "No Color", color: "" },
  { name: "Slate Light", color: "#F1F5F9" },
  { name: "Warm Amber", color: "#FEF3C7" },
  { name: "Soft Emerald", color: "#D1FAE5" },
  { name: "Soft Blue", color: "#DBEAFE" },
  { name: "Soft Purple", color: "#F3E8FF" },
  { name: "Soft Rose", color: "#FFE4E6" },
  { name: "Navy Dark", color: "#0F172A" },
];

export function FloatingTableView({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const [showShadingPopover, setShowShadingPopover] = useState(false);

  const selectTable = () => {
    if (!editor || typeof getPos !== "function") return;
    const pos = getPos();
    if (pos != null) editor.commands.setNodeSelection(pos);
  };

  const applyCellShading = (color: string) => {
    try {
      editor?.chain().focus().setCellAttribute("style", color ? `background-color: ${color}` : "").run();
    } catch {}
    setShowShadingPopover(false);
  };

  // Handle backspace/delete when table is selected (not when cursor is in a cell)
  useEffect(() => {
    if (!editor || !selected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        // Only delete if the entire table is selected (NodeSelection), not if cursor is in a cell
        const { state } = editor;
        const { selection } = state;
        if (selection instanceof NodeSelection) {
          e.preventDefault();
          deleteNode();
        }
      }
    };

    // Use capture phase to intercept before the editor handles it
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [editor, selected, deleteNode]);

  return (
    <NodeViewWrapper
      className="openpost-floating-table-node group/tbl-wrapper"
      data-floating-table="true"
    >
      <div
        className={`relative ${selected ? "is-selected" : ""}`}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest("td") || t.closest("th")) return;
          e.stopPropagation();
          if (!editor || typeof getPos !== "function") return;
          const pos = getPos();
          if (pos != null) editor.commands.setNodeSelection(pos);
        }}
      >
        {/* ── TOOLBAR — standard table ops only ── */}
        {selected && (
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-2xl border border-slate-700/80 bg-[#1E293B] p-1.5 shadow-2xl text-white backdrop-blur-md select-none"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Row ops */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-white/20">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().addRowBefore().run(); }}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition"
                title="Add row above"
              ><ChevronUp className="h-3 w-3" /><span>+R</span></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().addRowAfter().run(); }}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition"
                title="Add row below"
              ><ChevronDown className="h-3 w-3" /><span>+R</span></button>
            </div>

            {/* Col ops */}
            <div className="flex items-center gap-0.5 px-2 border-r border-white/20">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().addColumnBefore().run(); }}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition"
                title="Add column left"
              ><Plus className="h-3 w-3" /><span>+C</span></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().addColumnAfter().run(); }}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition"
                title="Add column right"
              ><Plus className="h-3 w-3" /><span>+C</span></button>
            </div>

            {/* Delete row/col */}
            <div className="flex items-center gap-0.5 px-2 border-r border-white/20">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().deleteRow().run(); }}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-200 hover:bg-red-500/20 hover:text-red-400 transition"
                title="Delete row"
              ><Trash className="h-3 w-3" /><span>-R</span></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().deleteColumn().run(); }}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-200 hover:bg-red-500/20 hover:text-red-400 transition"
                title="Delete column"
              ><Trash className="h-3 w-3" /><span>-C</span></button>
            </div>

            {/* Header toggle */}
            <div className="flex items-center gap-0.5 px-2 border-r border-white/20">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeaderRow().run(); }}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition"
                title="Toggle header row"
              ><Hash className="h-3 w-3" /><span>Header</span></button>
            </div>

            {/* Shading + Select + Delete */}
            <div className="flex items-center gap-0.5 pl-1">
              <div className="relative">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); setShowShadingPopover(!showShadingPopover); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-200 hover:bg-white/15 hover:text-white transition"
                  title="Cell shading"
                ><Paintbrush className="h-3.5 w-3.5" /></button>
                {showShadingPopover && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-44 rounded-2xl border border-slate-700/80 bg-[#1E293B] p-2 shadow-2xl flex flex-wrap gap-1.5">
                    {CELL_SHADING_COLORS.map((c) => (
                      <button key={c.name} type="button" onMouseDown={(e) => { e.preventDefault(); applyCellShading(c.color); }}
                        style={{ backgroundColor: c.color || "#FFFFFF" }}
                        className="h-6 w-6 rounded-md border border-white/20 hover:scale-110 transition" title={c.name} />
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); selectTable(); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-200 hover:bg-white/15 hover:text-white transition"
                title="Select entire table"
              ><CheckSquare className="h-3.5 w-3.5" /></button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); deleteNode(); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/20 transition"
                title="Delete table"
              ><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}

        {/* ── Drag handle ── */}
        <div
          data-drag-handle draggable contentEditable={false}
          onDragStart={(e) => {
            if (getPos && editor) {
              const pos = getPos();
              if (typeof pos === "number") {
                editor.view.dispatch(editor.view.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)));
              }
            }
            if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
          }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex h-5 w-8 items-center justify-center rounded-md bg-navy/90 backdrop-blur border border-white/15 text-white shadow-sm opacity-0 group-hover/tbl-wrapper:opacity-100 data-[visible=true]:opacity-100 cursor-grab active:cursor-grabbing transition select-none"
          title="Drag to move"
          data-visible={selected ? "true" : undefined}
        ><GripVertical className="h-3 w-3" /></div>

        {/* ── TABLE — full width, no wrapper ── */}
        <NodeViewContent
          as="table"
          className="openpost-table-editor"
        />
      </div>
    </NodeViewWrapper>
  );
}
