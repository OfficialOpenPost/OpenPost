"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import React, { useState, useRef, useCallback } from "react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Trash2,
  Link2,
  Image as ImageIcon,
  MessageSquare,
  GripVertical,
  Sparkles,
  FileText,
  RotateCw,
  Sliders,
  Check,
  Upload,
} from "lucide-react";

// ─── Shadow presets ─────────────────────────────────────────────────────────

const SHADOW_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 3px rgba(0,0,0,0.07)",
  md: "0 4px 12px rgba(0,0,0,0.09)",
  lg: "0 8px 24px rgba(0,0,0,0.12)",
  xl: "0 16px 40px rgba(0,0,0,0.15)",
};

const BORDER_COLORS = [
  { label: "Light Gray", value: "#E2E8F0" },
  { label: "Slate", value: "#94A3B8" },
  { label: "Navy", value: "#2D3440" },
  { label: "Brand Orange", value: "#FEA611" },
  { label: "Flame", value: "#FE4F01" },
  { label: "White", value: "#FFFFFF" },
];

export function FloatingImageView({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const attrs = node.attrs;
  const {
    src,
    alt = "",
    title = "",
    caption,
    width = 340,
    naturalWidth = null,
    naturalHeight = null,
    aspectRatio = null,
    layout = "center",
    float = "none",
    marginTop = 4,
    marginRight = 14,
    marginBottom = 8,
    marginLeft = 14,
    borderWidth = 0,
    borderStyle = "solid",
    borderColor = "#E2E8F0",
    borderRadius = 10,
    shadow = "sm",
    opacity = 1,
    rotation = 0,
    link = null,
    openLinkInNewTab = true,
    isDecorative = false,
  } = attrs;

  const [isEditingUrl, setIsEditingUrl] = useState(!src);
  const [urlInput, setUrlInput] = useState(src || "");
  const [showCaptionInput, setShowCaptionInput] = useState(Boolean(caption));
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showStylePopover, setShowStylePopover] = useState(false);
  const [showSeoPopover, setShowSeoPopover] = useState(false);

  const [tempLink, setTempLink] = useState(link || "");
  const [tempAlt, setTempAlt] = useState(alt || "");
  const [tempTitle, setTempTitle] = useState(title || "");

  const [isResizing, setIsResizing] = useState(false);
  const [liveWidth, setLiveWidth] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentDragWidthRef = useRef<number>(340);

  // Layout states
  const isLeft = float === "left" || layout === "left";
  const isRight = float === "right" || layout === "right";
  const isWide = layout === "wide";
  const isCenter = !isLeft && !isRight && !isWide;

  // ── Parse stored width (supports number or string like "45%" or "340px") ──

  const parseWidthPx = useCallback((): number => {
    const editorEl = containerRef.current?.closest(".tiptap") as HTMLElement | null;
    const editorW = editorEl ? editorEl.clientWidth : 760;

    if (typeof width === "number") {
      if (isLeft || isRight) {
        return Math.min(Math.round(editorW * 0.8), Math.max(120, width));
      }
      return Math.min(editorW, Math.max(120, width));
    }

    if (typeof width === "string") {
      if (width.endsWith("%")) {
        const pct = parseFloat(width) || 42;
        const clampedPct = (isLeft || isRight) ? Math.min(80, Math.max(15, pct)) : Math.min(100, Math.max(15, pct));
        return Math.round((clampedPct / 100) * editorW);
      }
      const num = parseFloat(width) || 340;
      if (isLeft || isRight) {
        return Math.min(Math.round(editorW * 0.8), Math.max(120, num));
      }
      return Math.min(editorW, Math.max(120, num));
    }

    return 340;
  }, [width, isLeft, isRight]);

  // ── Image loaded: store natural dimensions ────────────────────────────────

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (!naturalWidth || !naturalHeight || !aspectRatio) {
        const nw = img.naturalWidth || 800;
        const nh = img.naturalHeight || 600;
        const ar = Number((nw / nh).toFixed(4));
        updateAttributes({
          naturalWidth: nw,
          naturalHeight: nh,
          aspectRatio: ar,
        });
      }
    },
    [naturalWidth, naturalHeight, aspectRatio, updateAttributes]
  );

  // ── Effective display width in px ──────────────────────────────────────────

  const effectiveWidthPx = liveWidth ?? parseWidthPx();

  // ── Sizing helper ──────────────────────────────────────────────────────────

  const setWidthPercent = useCallback(
    (pct: number) => {
      const editorEl = containerRef.current?.closest(".tiptap") as HTMLElement | null;
      const editorW = editorEl ? editorEl.clientWidth : 760;
      const targetPct = (isLeft || isRight) ? Math.min(80, pct) : Math.min(100, pct);
      const targetPx = Math.round((targetPct / 100) * editorW);
      updateAttributes({ width: targetPx });
      setLiveWidth(null);
    },
    [isLeft, isRight, updateAttributes]
  );

  const stepWidth = useCallback(
    (deltaPx: number) => {
      const editorEl = containerRef.current?.closest(".tiptap") as HTMLElement | null;
      const editorW = editorEl ? editorEl.clientWidth : 760;
      const maxW = (isLeft || isRight) ? Math.round(editorW * 0.8) : editorW;

      const current = parseWidthPx();
      const next = Math.max(120, Math.min(maxW, current + deltaPx));
      updateAttributes({ width: next });
      setLiveWidth(null);
    },
    [parseWidthPx, isLeft, isRight, updateAttributes]
  );

  // ── Layout toggle ──────────────────────────────────────────────────────────

  const setLayout = useCallback(
    (nextLayout: "left" | "center" | "right" | "wide") => {
      let nextFloat: "none" | "left" | "right" = "none";
      const editorEl = containerRef.current?.closest(".tiptap") as HTMLElement | null;
      const editorW = editorEl ? editorEl.clientWidth : 760;
      let nextW = parseWidthPx();

      if (nextLayout === "left" || nextLayout === "right") {
        nextFloat = nextLayout;
        if (nextW > editorW * 0.6) {
          nextW = Math.round(editorW * 0.40);
        }
      } else if (nextLayout === "wide") {
        nextFloat = "none";
        nextW = editorW;
      } else {
        nextFloat = "none";
      }

      updateAttributes({
        layout: nextLayout,
        float: nextFloat,
        width: nextW,
      });
    },
    [parseWidthPx, updateAttributes]
  );

  // ── Real-Time 1:1 Resizing ────────────────────────────────────────────────

  const startResize = useCallback(
    (handle: "nw" | "ne" | "sw" | "se" | "w" | "e", e: React.MouseEvent | React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = effectiveWidthPx;
      const editorEl = containerRef.current?.closest(".tiptap") as HTMLElement | null;
      const editorW = editorEl ? editorEl.clientWidth : 760;
      const maxAvailableWidth = (isLeft || isRight) ? Math.round(editorW * 0.8) : editorW;

      currentDragWidthRef.current = startWidth;
      setIsResizing(true);
      setLiveWidth(startWidth);

      const onPointerMove = (moveEv: PointerEvent | MouseEvent) => {
        moveEv.preventDefault();
        const deltaX = moveEv.clientX - startX;
        let newWidth = startWidth;

        if (handle === "se" || handle === "e" || handle === "ne") {
          newWidth = startWidth + deltaX;
        } else if (handle === "sw" || handle === "w" || handle === "nw") {
          newWidth = startWidth - deltaX;
        }

        newWidth = Math.max(120, Math.min(maxAvailableWidth, Math.round(newWidth)));
        currentDragWidthRef.current = newWidth;
        setLiveWidth(newWidth);
      };

      const onPointerUp = (upEv: PointerEvent | MouseEvent) => {
        upEv.preventDefault();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseup", onPointerUp);

        setIsResizing(false);
        const finalW = currentDragWidthRef.current;
        updateAttributes({ width: finalW });
        setLiveWidth(null);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("mouseup", onPointerUp);
    },
    [effectiveWidthPx, isLeft, isRight, updateAttributes]
  );

  // ── Node selection click ───────────────────────────────────────────────────

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!editor || typeof getPos !== "function") return;
      const pos = getPos();
      if (pos == null) return;
      editor.commands.setNodeSelection(pos);
    },
    [editor, getPos]
  );

  // ── Replace Image File Upload ──────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { uploadImageWithWebP } = await import("@/lib/uploadMedia");
      const { url } = await uploadImageWithWebP(file);
      updateAttributes({ src: url });
    } catch (err) {
      console.error("Image replace upload failed:", err);
    }
  };

  // ── URL Edit View ──────────────────────────────────────────────────────────

  if (isEditingUrl || !src) {
    return (
      <NodeViewWrapper className="my-4 block clear-both">
        <div
          className={`rounded-xl border-2 border-dashed p-5 bg-surface-raised transition-all ${
            selected ? "border-brand ring-2 ring-brand/15" : "border-border"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <ImageIcon className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold text-navy">Insert Image</p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
              <input
                autoFocus
                placeholder="https://images.unsplash.com/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && urlInput.trim()) {
                    updateAttributes({ src: urlInput.trim() });
                    setIsEditingUrl(false);
                  }
                  if (e.key === "Escape") setIsEditingUrl(false);
                }}
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-xs focus:border-brand focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (urlInput.trim()) {
                  updateAttributes({ src: urlInput.trim() });
                  setIsEditingUrl(false);
                }
              }}
              className="rounded-lg bg-brand px-4 py-1.5 text-xs font-bold text-navy hover:bg-brand-hover transition"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => deleteNode()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // ── Exact Tight Wrapper Styles ────────────────────────────────────────────

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    boxSizing: "border-box",
  };

  if (isLeft) {
    wrapperStyle.float = "left";
    wrapperStyle.clear = "none";
    wrapperStyle.display = "block";
    wrapperStyle.width = `${effectiveWidthPx}px`;
    wrapperStyle.maxWidth = "80%";
    wrapperStyle.marginTop = `${marginTop ?? 4}px`;
    wrapperStyle.marginRight = `${marginRight ?? 14}px`;
    wrapperStyle.marginBottom = `${marginBottom ?? 8}px`;
    wrapperStyle.marginLeft = "0px";
  } else if (isRight) {
    wrapperStyle.float = "right";
    wrapperStyle.clear = "none";
    wrapperStyle.display = "block";
    wrapperStyle.width = `${effectiveWidthPx}px`;
    wrapperStyle.maxWidth = "80%";
    wrapperStyle.marginTop = `${marginTop ?? 4}px`;
    wrapperStyle.marginRight = "0px";
    wrapperStyle.marginBottom = `${marginBottom ?? 8}px`;
    wrapperStyle.marginLeft = `${marginLeft ?? 14}px`;
  } else if (isWide) {
    wrapperStyle.float = "none";
    wrapperStyle.clear = "both";
    wrapperStyle.display = "block";
    wrapperStyle.width = "100%";
    wrapperStyle.maxWidth = "100%";
    wrapperStyle.margin = "1.5rem 0";
  } else {
    // Center
    wrapperStyle.float = "none";
    wrapperStyle.clear = "both";
    wrapperStyle.display = "block";
    wrapperStyle.width = `${effectiveWidthPx}px`;
    wrapperStyle.maxWidth = "100%";
    wrapperStyle.margin = "1.25rem auto";
    wrapperStyle.textAlign = "center";
  }

  // Determine Toolbar Orientation & Placement:
  // Float Right -> Vertical toolbar on the LEFT side of image
  // Float Left  -> Vertical toolbar on the RIGHT side of image
  // Center/Wide -> Horizontal toolbar on TOP
  const isVertical = isLeft || isRight;
  const toolbarContainerClasses = isRight
    ? "absolute top-0 -left-12 z-40 flex flex-col items-center gap-1 rounded-2xl border border-border/80 bg-[#1E293B]/95 p-1.5 shadow-2xl text-white backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none"
    : isLeft
    ? "absolute top-0 -right-12 z-40 flex flex-col items-center gap-1 rounded-2xl border border-border/80 bg-[#1E293B]/95 p-1.5 shadow-2xl text-white backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none"
    : "absolute -top-12 left-1/2 -translate-x-1/2 z-40 flex flex-row items-center gap-1 rounded-2xl border border-border/80 bg-[#1E293B]/95 px-2 py-1 shadow-2xl text-white backdrop-blur-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 select-none";

  // Popover placement:
  // When vertical on Left side of image -> popover opens towards left (or right)
  // When vertical on Right side of image -> popover opens towards right (or left)
  const popoverPlacement = isRight
    ? "absolute right-full mr-2 top-0 z-50"
    : isLeft
    ? "absolute left-full ml-2 top-0 z-50"
    : "absolute top-9 left-1/2 -translate-x-1/2 z-50";

  return (
    <NodeViewWrapper
      className="openpost-floating-image-node group/img-wrapper select-none"
      data-floating-image="true"
      data-float={float}
      data-layout={layout}
      style={wrapperStyle}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div
        ref={containerRef}
        onClick={handleClick}
        className={`relative ${selected ? "is-selected" : ""}`}
        style={{
          width: "100%",
          maxWidth: "100%",
          display: "block",
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
        }}
      >
        {/* ── CONTEXTUAL FLOATING TOOLBAR (Vertical on opposite side for floats, Horizontal on top for center) ── */}
        {selected && (
          <div
            className={toolbarContainerClasses}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Position & Flow Controls */}
            <div className={`flex ${isVertical ? "flex-col" : "flex-row items-center"} gap-0.5 ${isVertical ? "pb-1 border-b" : "pr-1.5 border-r"} border-white/15`}>
              <button
                type="button"
                onClick={() => setLayout("left")}
                title="Float Left (Text wraps on right)"
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  isLeft ? "bg-brand text-navy font-bold shadow-xs" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("center")}
                title="Center (No wrap)"
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  isCenter ? "bg-brand text-navy font-bold shadow-xs" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("right")}
                title="Float Right (Text wraps on left)"
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  isRight ? "bg-brand text-navy font-bold shadow-xs" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("wide")}
                title="Full Width Banner"
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  isWide ? "bg-brand text-navy font-bold shadow-xs" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Quick Sizing Controls */}
            <div className={`flex ${isVertical ? "flex-col" : "flex-row items-center"} gap-0.5 ${isVertical ? "py-1 border-b" : "px-1.5 border-r"} border-white/15`}>
              <button
                type="button"
                onClick={() => stepWidth(25)}
                title="Increase Width (+25px)"
                className="flex h-6 w-6 items-center justify-center rounded font-bold text-xs text-slate-300 hover:bg-white/15 hover:text-white transition"
              >
                +
              </button>
              {!isVertical && (isLeft || isRight ? [25, 33, 45, 60, 80] : [25, 50, 75, 100]).map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setWidthPercent(pct)}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded text-slate-300 hover:bg-white/10 hover:text-white transition"
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => stepWidth(-25)}
                title="Decrease Width (-25px)"
                className="flex h-6 w-6 items-center justify-center rounded font-bold text-xs text-slate-300 hover:bg-white/15 hover:text-white transition"
              >
                −
              </button>
            </div>

            {/* Features (Caption, Link, Style, SEO) */}
            <div className={`flex ${isVertical ? "flex-col" : "flex-row items-center"} gap-0.5 ${isVertical ? "py-1 border-b" : "px-1 border-r"} border-white/15`}>
              {/* Caption Button */}
              <button
                type="button"
                onClick={() => {
                  setShowCaptionInput(!showCaptionInput);
                  if (!caption && !showCaptionInput) {
                    updateAttributes({ caption: "Add image caption..." });
                  }
                }}
                title="Toggle Caption"
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  caption || showCaptionInput ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>

              {/* Link Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkPopover(!showLinkPopover);
                    setShowStylePopover(false);
                    setShowSeoPopover(false);
                  }}
                  title="Image Hyperlink"
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                    link || showLinkPopover ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>

                {showLinkPopover && (
                  <div className={`${popoverPlacement} w-64 rounded-xl border border-border bg-[#1E293B] p-3 shadow-2xl text-xs text-white`}>
                    <p className="font-bold mb-1 text-slate-300">Link destination</p>
                    <input
                      type="url"
                      autoFocus
                      placeholder="https://..."
                      value={tempLink}
                      onChange={(e) => setTempLink(e.target.value)}
                      className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={openLinkInNewTab}
                          onChange={(e) => updateAttributes({ openLinkInNewTab: e.target.checked })}
                          className="rounded text-brand"
                        />
                        New tab
                      </label>
                      <div className="flex gap-1.5">
                        {link && (
                          <button
                            type="button"
                            onClick={() => {
                              updateAttributes({ link: null });
                              setTempLink("");
                              setShowLinkPopover(false);
                            }}
                            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px]"
                          >
                            Unlink
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            updateAttributes({ link: tempLink.trim() || null });
                            setShowLinkPopover(false);
                          }}
                          className="px-3 py-1 rounded bg-brand text-navy font-bold text-[10px] hover:bg-brand-hover"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Style & Frame Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowStylePopover(!showStylePopover);
                    setShowLinkPopover(false);
                    setShowSeoPopover(false);
                  }}
                  title="Frame, Borders, Radius & Shadow"
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                    showStylePopover || borderRadius > 0 || shadow !== "none" || borderWidth > 0
                      ? "bg-brand text-navy font-bold"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>

                {showStylePopover && (
                  <div className={`${popoverPlacement} w-72 rounded-2xl border border-border bg-[#1E293B] p-3.5 shadow-2xl text-xs text-white space-y-3`}>
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-bold text-slate-200">Image Styling</span>
                      <button
                        type="button"
                        onClick={() => updateAttributes({ borderRadius: 10, borderWidth: 0, shadow: "sm", opacity: 1, rotation: 0 })}
                        className="text-[10px] text-brand hover:underline"
                      >
                        Reset Defaults
                      </button>
                    </div>

                    {/* Corner Radius */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Corner Radius ({borderRadius}px)</span>
                      <div className="grid grid-cols-5 gap-1">
                        {[0, 8, 16, 24, 9999].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => updateAttributes({ borderRadius: r })}
                            className={`py-1 rounded text-[10px] font-bold border ${
                              borderRadius === r ? "bg-brand text-navy border-brand" : "border-white/10 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {r === 0 ? "Sharp" : r === 9999 ? "Pill" : `${r}px`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Border Width & Color */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Border</span>
                      <div className="grid grid-cols-4 gap-1 mb-1.5">
                        {[0, 1, 2, 4].map((bw) => (
                          <button
                            key={bw}
                            type="button"
                            onClick={() => updateAttributes({ borderWidth: bw })}
                            className={`py-1 rounded text-[10px] font-bold border ${
                              borderWidth === bw ? "bg-brand text-navy border-brand" : "border-white/10 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {bw === 0 ? "None" : `${bw}px`}
                          </button>
                        ))}
                      </div>
                      {borderWidth > 0 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          {BORDER_COLORS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => updateAttributes({ borderColor: c.value })}
                              style={{ backgroundColor: c.value }}
                              className={`h-5 w-5 rounded-full border border-white/20 transition ${
                                borderColor === c.value ? "ring-2 ring-brand scale-110" : "hover:scale-105"
                              }`}
                              title={c.label}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Shadow Level */}
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Shadow Elevation</span>
                      <div className="grid grid-cols-5 gap-1">
                        {(["none", "sm", "md", "lg", "xl"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateAttributes({ shadow: s })}
                            className={`py-1 rounded text-[10px] font-bold uppercase border ${
                              shadow === s ? "bg-brand text-navy border-brand" : "border-white/10 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opacity & Rotate */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Opacity</span>
                        <div className="grid grid-cols-3 gap-1">
                          {[1, 0.75, 0.5].map((op) => (
                            <button
                              key={op}
                              type="button"
                              onClick={() => updateAttributes({ opacity: op })}
                              className={`py-1 rounded text-[10px] font-bold border ${
                                opacity === op ? "bg-brand text-navy border-brand" : "border-white/10 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              {Math.round(op * 100)}%
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">Rotate</span>
                        <button
                          type="button"
                          onClick={() => updateAttributes({ rotation: (rotation + 90) % 360 })}
                          className="w-full flex items-center justify-center gap-1 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-200"
                        >
                          <RotateCw className="h-3 w-3" /> {rotation}°
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SEO & Alt Text Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowSeoPopover(!showSeoPopover);
                    setShowLinkPopover(false);
                    setShowStylePopover(false);
                  }}
                  title="Alt Text & SEO Description"
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                    alt || showSeoPopover ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>

                {showSeoPopover && (
                  <div className={`${popoverPlacement} w-64 rounded-2xl border border-border bg-[#1E293B] p-3 shadow-2xl text-xs text-white space-y-2.5`}>
                    <p className="font-bold text-slate-200">SEO & Accessibility</p>
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Alt Text (Screen Readers)</span>
                      <input
                        type="text"
                        placeholder="Describe the image..."
                        value={tempAlt}
                        onChange={(e) => setTempAlt(e.target.value)}
                        onBlur={() => updateAttributes({ alt: tempAlt.trim() || null })}
                        className="w-full rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Tooltip Title</span>
                      <input
                        type="text"
                        placeholder="Hover title..."
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={() => updateAttributes({ title: tempTitle.trim() || null })}
                        className="w-full rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={isDecorative}
                        onChange={(e) => updateAttributes({ isDecorative: e.target.checked })}
                        className="rounded text-brand"
                      />
                      Mark as decorative (ignore for SEO)
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Replace & Delete Actions */}
            <div className={`flex ${isVertical ? "flex-col" : "flex-row items-center"} gap-0.5 ${isVertical ? "pt-1" : "pl-0.5"}`}>
              {/* Replace Image Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Replace with Local File"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>

              {/* Replace Image URL Trigger */}
              <button
                type="button"
                onClick={() => setIsEditingUrl(true)}
                title="Replace with Image URL"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => deleteNode()}
                title="Delete Image"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-flame hover:bg-flame/20 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Live Dimensions Badge ──────────────────────────────────────────── */}
        {(isResizing || selected) && (
          <div
            className={`absolute ${
              isResizing ? "top-2 left-1/2 -translate-x-1/2" : "top-2 left-2"
            } z-30 pointer-events-none rounded-full px-2 py-0.5 text-[10px] font-mono font-bold shadow-md border flex items-center gap-1.5 ${
              isResizing
                ? "bg-brand text-navy border-brand shadow-brand/20"
                : "bg-navy text-white border-white/15"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                isResizing ? "bg-navy animate-pulse" : "bg-brand"
              }`}
            />
            {effectiveWidthPx} px {isLeft ? "• Float Left" : isRight ? "• Float Right" : isWide ? "• Full Width" : "• Center"}
          </div>
        )}

        {/* ── Drag Handle ────────────────────────────────────────────────────── */}
        <div
          data-drag-handle
          draggable
          contentEditable={false}
          onDragStart={(e) => {
            try {
              const currentW = `${effectiveWidthPx}px`;
              document.documentElement.style.setProperty("--dragged-image-width", currentW);
              if (getPos && editor) {
                const pos = getPos();
                if (typeof pos === "number") {
                  const sel = NodeSelection.create(editor.state.doc, pos);
                  editor.view.dispatch(editor.view.state.tr.setSelection(sel));
                }
              }
            } catch {}
            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = "move";
            }
          }}
          onDragEnd={() => {
            try {
              document.documentElement.style.removeProperty("--dragged-image-width");
            } catch {}
          }}
          className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-md bg-navy/90 backdrop-blur border border-white/15 text-white shadow-sm opacity-0 group-hover/img-wrapper:opacity-100 data-[visible=true]:opacity-100 cursor-grab active:cursor-grabbing transition select-none"
          title="Drag to reposition"
          data-visible={selected ? "true" : undefined}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        {/* ── TIGHT CARD BOX (Zero extra padding, tight to image boundary) ─── */}
        <div
          className={`relative bg-white transition-all duration-150 ${
            selected ? "z-10 ring-2 ring-brand/40 shadow-md" : "group-hover/img-wrapper:shadow-sm"
          }`}
          style={{
            borderRadius: `${borderRadius}px`,
            borderWidth: `${borderWidth ? borderWidth : 1}px`,
            borderStyle: borderWidth === 0 ? "solid" : borderStyle,
            borderColor: selected ? "#FEA611" : borderWidth > 0 ? borderColor : "#E2E8F0",
            boxShadow: SHADOW_MAP[shadow] || SHADOW_MAP.sm,
            opacity: opacity,
            transform: rotation ? `rotate(${rotation}deg)` : undefined,
            padding: "0px",
            margin: "0px",
            boxSizing: "border-box",
            overflow: "hidden",
            width: "100%",
            display: "block",
          }}
        >
          {/* ── Natural Image: ALWAYS height: auto for zero distortion ─────── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt={isDecorative ? "" : alt || ""}
            title={title || undefined}
            onLoad={onImageLoad}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              margin: 0,
              padding: 0,
              borderRadius: "inherit",
              objectFit: "contain",
            }}
            className="block max-w-full select-none"
            loading="lazy"
            draggable={false}
          />

          {/* ── 8 Resize Handles (High Contrast) ────────────────────────────── */}
          {selected && (
            <div className="absolute inset-0 pointer-events-none z-20" aria-hidden>
              {/* Corner Handles */}
              <div
                onMouseDown={(e) => startResize("nw", e)}
                className="pointer-events-auto absolute top-0 left-0 h-3 w-3 -translate-x-1.5 -translate-y-1.5 rounded-[2px] border-2 border-white bg-brand shadow-sm cursor-nwse-resize hover:scale-125 transition-transform"
                title="Drag to resize"
              />
              <div
                onMouseDown={(e) => startResize("ne", e)}
                className="pointer-events-auto absolute top-0 right-0 h-3 w-3 translate-x-1.5 -translate-y-1.5 rounded-[2px] border-2 border-white bg-brand shadow-sm cursor-nesw-resize hover:scale-125 transition-transform"
                title="Drag to resize"
              />
              <div
                onMouseDown={(e) => startResize("sw", e)}
                className="pointer-events-auto absolute bottom-0 left-0 h-3 w-3 -translate-x-1.5 translate-y-1.5 rounded-[2px] border-2 border-white bg-brand shadow-sm cursor-nesw-resize hover:scale-125 transition-transform"
                title="Drag to resize"
              />
              <div
                onMouseDown={(e) => startResize("se", e)}
                className="pointer-events-auto absolute bottom-0 right-0 h-3 w-3 translate-x-1.5 translate-y-1.5 rounded-[2px] border-2 border-white bg-brand shadow-sm cursor-nwse-resize hover:scale-125 transition-transform"
                title="Drag to resize"
              />
              {/* Edge Handles */}
              <div
                onMouseDown={(e) => startResize("w", e)}
                className="pointer-events-auto absolute top-1/2 left-0 h-4 w-1.5 -translate-x-1 -translate-y-1/2 rounded-[1px] border-2 border-white bg-brand shadow-sm cursor-ew-resize hover:scale-125 transition-transform"
                title="Drag width"
              />
              <div
                onMouseDown={(e) => startResize("e", e)}
                className="pointer-events-auto absolute top-1/2 right-0 h-4 w-1.5 translate-x-1 -translate-y-1/2 rounded-[1px] border-2 border-white bg-brand shadow-sm cursor-ew-resize hover:scale-125 transition-transform"
                title="Drag width"
              />
            </div>
          )}
        </div>

        {/* ── Inline Caption Input ───────────────────────────────────────────── */}
        {(caption || showCaptionInput) && (
          <div className="mt-1 text-xs">
            <input
              type="text"
              placeholder="Write a caption..."
              value={caption || ""}
              onChange={(e) => updateAttributes({ caption: e.target.value })}
              className="w-full bg-transparent px-1 py-0.5 text-center text-text-secondary placeholder:text-text-tertiary focus:outline-none focus:border-b focus:border-brand"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
