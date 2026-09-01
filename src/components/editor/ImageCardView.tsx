"use client";

import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { X, Link2, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export function ImageCardView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { src, alt, caption, align = "center", layout = "center", width = "100%" } = node.attrs;
  const [editing, setEditing] = useState(!src);

  if (editing || !src) {
    return (
      <NodeViewWrapper className="my-6">
        <div className={`rounded-2xl border-2 border-dashed p-6 bg-surface-raised ${selected ? "border-brand ring-2 ring-brand/20" : "border-border"}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">Add image</p>
              <p className="text-xs text-text-tertiary">Paste URL or upload — shows as a separate card</p>
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
                className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button onClick={() => deleteNode()} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-surface">
              Cancel
            </button>
          </div>
          <p className="mt-3 text-xs text-text-tertiary">Press Enter to add — image will appear as a card with caption & alt fields.</p>
        </div>
      </NodeViewWrapper>
    );
  }

  const layouts = [
    { key: "inline", label: "Inline" },
    { key: "left", label: "Left" },
    { key: "center", label: "Center" },
    { key: "right", label: "Right" },
    { key: "wide", label: "Wide" },
    { key: "full", label: "Full" },
  ] as const;

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = parseInt(String(width).replace("%", "")) || 100;
    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / window.innerWidth) * 100;
      const next = Math.min(100, Math.max(30, startWidth + delta * 2));
      updateAttributes({ width: `${Math.round(next)}%` });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const layoutCls =
    layout === "left" ? "float-left mr-6 mb-4 max-w-[45%]" :
    layout === "right" ? "float-right ml-6 mb-4 max-w-[45%]" :
    layout === "wide" ? "w-full -mx-8 max-w-[calc(100%+4rem)]" :
    layout === "full" ? "w-screen -mx-[calc((100vw-100%)/2)] max-w-none" :
    layout === "inline" ? "inline-block align-middle max-w-[280px] mx-2" :
    "mx-auto"; // center

  const widthStyle = layout === "left" || layout === "right" ? { width } : layout === "center" ? { width: width === "100%" ? "72%" : width, maxWidth: 640 } : { width };

  return (
    <NodeViewWrapper className={`my-6 ${layout === "left" || layout === "right" ? "clearfix" : ""}`}>
      <div className={`group overflow-hidden rounded-xl border bg-surface shadow-sm ${selected ? "border-brand ring-2 ring-brand/20" : "border-border"} ${layoutCls}`} style={widthStyle as any}>
        <div className="relative bg-[#FCFCF9]">
          <img src={src} alt={alt || ""} className="w-full h-auto max-h-[520px] object-contain bg-white" draggable={false} />
          {/* Drag handle — Word-like grip to move between text */}
          <div data-drag-handle draggable className="absolute top-2 left-2 flex h-7 items-center gap-1 rounded-full bg-white/90 border border-border px-2 shadow-sm opacity-0 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing select-none">
            <span className="grid grid-cols-2 gap-0.5">
              <span className="h-1 w-1 rounded-full bg-text-tertiary" /><span className="h-1 w-1 rounded-full bg-text-tertiary" />
              <span className="h-1 w-1 rounded-full bg-text-tertiary" /><span className="h-1 w-1 rounded-full bg-text-tertiary" />
              <span className="h-1 w-1 rounded-full bg-text-tertiary" /><span className="h-1 w-1 rounded-full bg-text-tertiary" />
            </span>
            <span className="text-[11px] font-semibold text-text-secondary">Drag</span>
          </div>
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => setEditing(true)} className="rounded-full bg-navy/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur hover:bg-navy">
              Edit
            </button>
            <button onClick={() => deleteNode()} className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-border shadow-sm hover:bg-flame hover:text-white hover:border-flame">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div onMouseDown={onResizeMouseDown} className="absolute bottom-2 right-2 h-7 w-7 cursor-nwse-resize rounded-lg bg-white border border-border shadow-sm hidden group-hover:flex items-center justify-center hover:bg-navy hover:text-white hover:border-navy transition">
            <span className="text-xs leading-none">↘</span>
          </div>
        </div>
        <div className="p-4 space-y-3 bg-surface">
          <div className="flex flex-wrap gap-1.5">
            {layouts.map((l) => (
              <button
                key={l.key}
                onClick={() => updateAttributes({ layout: l.key, align: l.key })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${layout === l.key ? "bg-navy text-white border-navy" : "bg-white border-border hover:border-brand/20"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <input
            placeholder="Caption (optional) — shown below image"
            value={caption || ""}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <input
            placeholder="Alt text — describe the image for SEO & accessibility"
            value={alt || ""}
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <p className="text-xs text-text-tertiary">Layout: {layout} · Width: {width} · Drag ↘ to resize · Alt text required for SEO warning.</p>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
