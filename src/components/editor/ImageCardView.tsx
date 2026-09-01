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
  Move,
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
                      updateAttributes({ src: val });
                      setEditing(false);
                    }
                  }
                  if (e.key === "Escape") setEditing(false);
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val) {
                    updateAttributes({ src: val });
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
    { key: "wide", label: "Wide", icon: Maximize2 },
  ] as const;

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = parseInt(String(width).replace("%", "")) || 100;
    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / window.innerWidth) * 100;
      const next = Math.min(100, Math.max(25, startWidth + delta * 2));
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
  const widthStyle =
    layout === "left" || layout === "right"
      ? { width: width === "100%" ? "45%" : width, maxWidth: "48%" }
      : layout === "center"
      ? { width: width === "100%" ? "85%" : width, maxWidth: "780px" }
      : { width: "100%" };

  return (
    <NodeViewWrapper
      className={`my-4 ${wrapperClass} transition-all`}
      data-drag-handle
    >
      <div
        className={`group relative overflow-hidden rounded-2xl border bg-white shadow-xs transition ${
          selected ? "border-brand ring-2 ring-brand/30" : "border-border"
        }`}
        style={widthStyle as any}
      >
        {/* Top Control Bar on Hover */}
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition duration-150">
          {/* Word-like Drag Handle */}
          <div
            draggable
            data-drag-handle
            className="flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-navy border border-border shadow-xs cursor-grab active:cursor-grabbing select-none"
            title="Drag to reposition anywhere in text"
          >
            <GripVertical className="h-3.5 w-3.5 text-brand" />
            <span>Move</span>
          </div>

          {/* Quick Layout Buttons */}
          <div className="flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md p-1 border border-border shadow-xs">
            {layouts.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => updateAttributes({ layout: l.key, align: l.key })}
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

        {/* Image Display */}
        <div className="relative bg-[#FAFAFA] flex items-center justify-center min-h-[140px]">
          <img
            src={src}
            alt={alt || ""}
            className="w-full h-auto max-h-[560px] object-contain rounded-t-xl"
            draggable={false}
          />

          {/* Resize corner handle */}
          <div
            onMouseDown={onResizeMouseDown}
            className="absolute bottom-2 right-2 h-7 w-7 cursor-nwse-resize rounded-lg bg-white/90 backdrop-blur-md border border-border shadow-xs hidden group-hover:flex items-center justify-center hover:bg-navy hover:text-white transition"
            title="Drag to resize width"
          >
            <span className="text-xs font-bold leading-none select-none">↘</span>
          </div>
        </div>

        {/* Caption & Alt Info */}
        {(caption || alt) && (
          <div className="px-3.5 py-2 bg-surface-dim border-t border-border/60 text-center">
            {caption && <p className="text-xs text-text-secondary italic">{caption}</p>}
            {alt && <p className="text-[10px] text-text-tertiary font-mono">Alt: {alt}</p>}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
