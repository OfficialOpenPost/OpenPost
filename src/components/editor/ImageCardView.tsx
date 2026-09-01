"use client";

import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import {
  X,
  Link2,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  GripVertical,
} from "lucide-react";
import { useState } from "react";

export function ImageCardView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const {
    src,
    alt,
    caption,
    align = "center",
    layout = "center",
    width = "100%",
  } = node.attrs;
  const [editing, setEditing] = useState(!src);

  if (editing || !src) {
    return (
      <NodeViewWrapper className="my-6 block clear-both">
        <div
          className={`rounded-2xl border-2 border-dashed p-6 bg-surface-raised ${
            selected ? "border-brand ring-2 ring-brand/20" : "border-border"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">Add image</p>
              <p className="text-xs text-text-tertiary">
                Enter direct URL or cancel to upload from toolbar
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                autoFocus
                placeholder="https://images.unsplash.com/..."
                defaultValue={src}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      updateAttributes({ src: val, width: "100%" });
                      setEditing(false);
                    }
                  }
                  if (e.key === "Escape") setEditing(false);
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val) {
                    updateAttributes({ src: val, width: "100%" });
                    setEditing(false);
                  }
                }}
                className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <button
              onClick={() => deleteNode()}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  const layouts = [
    { key: "left", label: "Left (Wrap)", icon: AlignLeft },
    { key: "center", label: "Center", icon: AlignCenter },
    { key: "right", label: "Right (Wrap)", icon: AlignRight },
    { key: "wide", label: "Full Width", icon: Maximize2 },
  ] as const;

  const sizePresets = ["25%", "50%", "75%", "100%"];

  // Drag-to-resize from Right edge/corners
  const onResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const currentNum = parseInt(String(width).replace("%", "")) || 100;

    const onMove = (ev: MouseEvent) => {
      const deltaPercent = ((ev.clientX - startX) / (window.innerWidth * 0.45)) * 100;
      const next = Math.min(100, Math.max(15, currentNum + deltaPercent));
      updateAttributes({ width: `${Math.round(next)}%` });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Drag-to-resize from Left edge/corners
  const onResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const currentNum = parseInt(String(width).replace("%", "")) || 100;

    const onMove = (ev: MouseEvent) => {
      const deltaPercent = ((startX - ev.clientX) / (window.innerWidth * 0.45)) * 100;
      const next = Math.min(100, Math.max(15, currentNum + deltaPercent));
      updateAttributes({ width: `${Math.round(next)}%` });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const wrapperClass = `image-align-${layout}`;

  // Inner margin alignment according to position within the document card
  const innerMarginCls =
    layout === "left"
      ? "mr-auto ml-0"
      : layout === "right"
      ? "ml-auto mr-0"
      : layout === "wide"
      ? "w-full mx-0"
      : "mx-auto"; // center

  const currentWidthVal = width || "100%";
  const widthStyle = { width: currentWidthVal, maxWidth: "100%" };

  return (
    <NodeViewWrapper
      className={`my-4 ${wrapperClass} transition-all`}
      data-drag-handle
    >
      <div
        className={`group relative rounded-2xl border bg-white shadow-xs transition select-none ${innerMarginCls} ${
          selected
            ? "border-brand ring-2 ring-brand/50"
            : "border-border hover:border-brand/40"
        }`}
        style={widthStyle as any}
      >
        {/* Top Control Bar on Hover */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150">
          {/* Word-like Drag Move Handle */}
          <div
            draggable
            data-drag-handle
            className="flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-navy border border-border shadow-xs cursor-grab active:cursor-grabbing select-none"
            title="Drag to reposition image anywhere in text"
          >
            <GripVertical className="h-3.5 w-3.5 text-brand" />
            <span>Move</span>
          </div>

          {/* Quick Layout Buttons (Preserves current image width) */}
          <div className="flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md p-1 border border-border shadow-xs">
            {layouts.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => {
                  updateAttributes({ layout: l.key, align: l.key });
                }}
                title={l.label}
                className={`flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold transition ${
                  layout === l.key
                    ? "bg-brand text-navy shadow-xs"
                    : "text-text-secondary hover:bg-surface-raised hover:text-navy"
                }`}
              >
                <l.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{l.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Size Preset Selector (25%, 50%, 75%, 100%) */}
          <div className="flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md p-1 border border-border shadow-xs">
            {sizePresets.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => updateAttributes({ width: pct })}
                className={`h-6 rounded-full px-2 text-[10px] font-bold transition ${
                  width === pct
                    ? "bg-navy text-white shadow-xs"
                    : "text-navy hover:bg-surface-raised"
                }`}
                title={`Set width to ${pct}`}
              >
                {pct}
              </button>
            ))}
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => deleteNode()}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 backdrop-blur-md text-text-tertiary hover:bg-red-50 hover:text-red-600 border border-border shadow-xs transition"
            title="Remove Image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Image Display Area with Square Resize Blocks */}
        <div className="relative bg-[#FAFAFA] flex items-center justify-center overflow-visible">
          <img
            src={src}
            alt={alt || ""}
            className="w-full h-auto object-contain rounded-t-xl"
            style={{ width: "100%" }}
            draggable={false}
          />

          {/* VISIBLE SQUARE RESIZE BLOCKS (Figma / Word / Canva style) */}
          <div
            onMouseDown={onResizeLeft}
            className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 bg-white border-2 border-brand shadow-md z-30 cursor-nwse-resize rounded-xs hover:scale-125 hover:bg-brand transition-transform select-none"
            title="Drag to resize"
          />
          <div
            onMouseDown={onResizeRight}
            className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-white border-2 border-brand shadow-md z-30 cursor-nesw-resize rounded-xs hover:scale-125 hover:bg-brand transition-transform select-none"
            title="Drag to resize"
          />
          <div
            onMouseDown={onResizeLeft}
            className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 bg-white border-2 border-brand shadow-md z-30 cursor-nesw-resize rounded-xs hover:scale-125 hover:bg-brand transition-transform select-none"
            title="Drag to resize"
          />
          <div
            onMouseDown={onResizeRight}
            className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 bg-white border-2 border-brand shadow-md z-30 cursor-nwse-resize rounded-xs hover:scale-125 hover:bg-brand transition-transform select-none"
            title="Drag to resize"
          />
          <div
            onMouseDown={onResizeLeft}
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-3.5 w-3.5 bg-white border-2 border-brand shadow-md z-30 cursor-ew-resize rounded-xs hover:scale-125 hover:bg-brand transition-transform select-none"
            title="Drag to resize width"
          />
          <div
            onMouseDown={onResizeRight}
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-3.5 w-3.5 bg-white border-2 border-brand shadow-md z-30 cursor-ew-resize rounded-xs hover:scale-125 hover:bg-brand transition-transform select-none"
            title="Drag to resize width"
          />
        </div>

        {/* Caption & Alt Info Bar */}
        <div className="px-4 py-2.5 bg-surface-dim border-t border-border/60 flex items-center justify-between text-xs gap-3">
          <input
            placeholder="Add an image caption (optional)..."
            value={caption || ""}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            className="flex-1 bg-transparent text-navy italic placeholder:text-text-tertiary focus:outline-none text-xs"
          />
          <span className="text-[10px] font-bold text-text-tertiary font-mono shrink-0 bg-white border border-border px-2 py-0.5 rounded-md shadow-2xs">
            Width: {width || "100%"}
          </span>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
