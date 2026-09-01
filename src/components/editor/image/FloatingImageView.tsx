"use client";

import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import {
  Trash2,
  Link2,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  GripVertical,
  MessageSquare,
  Sliders,
  Sparkles,
  ExternalLink,
  Lock,
  Unlock,
  RotateCw,
  Eye,
  EyeOff,
  Check,
  X,
  Layers,
  WrapText,
  Minimize2,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { NodeSelection } from "@tiptap/pm/state";

export function FloatingImageView({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
  getPos,
}: NodeViewProps & { getPos?: () => number }) {
  const {
    src,
    alt,
    title,
    caption,
    captionAlign = "center",
    width = "100%",
    height,
    naturalWidth,
    naturalHeight,
    aspectRatio,
    lockAspectRatio = true,
    layout = "center",
    float = "none",
    wrapMode = "square",
    marginTop = 8,
    marginRight = 24,
    marginBottom = 16,
    marginLeft = 24,
    borderWidth = 0,
    borderStyle = "solid",
    borderColor = "#E2E8F0",
    borderRadius = 16,
    shadow = "sm",
    opacity = 1,
    rotation = 0,
    objectFit = "cover",
    link,
    openLinkInNewTab = true,
    isDecorative = false,
  } = node.attrs;

  const [isEditingUrl, setIsEditingUrl] = useState(!src);
  const [showCaptionInput, setShowCaptionInput] = useState(Boolean(caption));
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [tempLink, setTempLink] = useState(link || "");
  const [isResizing, setIsResizing] = useState(false);
  const [liveDimensions, setLiveDimensions] = useState<{ width: number; height: number; percent: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // On image load, record natural dimensions and aspect ratio if not set
  const onImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!naturalWidth || !naturalHeight || !aspectRatio) {
      const nw = img.naturalWidth || 800;
      const nh = img.naturalHeight || 600;
      const ar = nw / nh;
      updateAttributes({
        naturalWidth: nw,
        naturalHeight: nh,
        aspectRatio: Number(ar.toFixed(3)),
      });
    }
  };

  // Determine float layout
  const isLeft = float === "left" || layout === "left";
  const isRight = float === "right" || layout === "right";
  const isWide = layout === "wide";
  const isInline = layout === "inline";
  const isCenter = !isLeft && !isRight && !isWide && !isInline;

  // Outer Wrapper CSS Class
  let wrapperClass = "my-6 block clear-both mx-auto";
  if (isLeft) {
    wrapperClass = "image-align-left float-left clear-none inline-block";
  } else if (isRight) {
    wrapperClass = "image-align-right float-right clear-none inline-block";
  } else if (isWide) {
    wrapperClass = "image-align-wide block w-full my-8 clear-both";
  } else if (isInline) {
    wrapperClass = "image-align-inline inline-block clear-none align-middle my-2";
  } else {
    wrapperClass = "image-align-center block w-full my-8 clear-both";
  }

  // Shadow preset map
  const shadowMap: Record<string, string> = {
    none: "shadow-none",
    sm: "shadow-xs",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-2xl",
  };

  const latestDimensionsRef = useRef<{ width: number; height: number; percent: number } | null>(null);

  // Step Width helper – handles % and px, preserves layout-appropriate granularity
  const stepWidth = (delta: number) => {
    const floated = isLeft || isRight;
    let currentPct = floated ? 45 : 100;
    const rawW = width || (floated ? "45%" : "100%");
    if (typeof rawW === "string" && rawW) {
      if (rawW.endsWith("%")) {
        currentPct = parseFloat(rawW) || (floated ? 45 : 100);
      } else if (rawW.endsWith("px")) {
        const docEl = containerRef.current?.closest(".tiptap") || containerRef.current?.closest(".ProseMirror") || document.querySelector(".tiptap");
        let availableWidth = 800;
        if (docEl) {
          const computed = window.getComputedStyle(docEl);
          const padLeft = parseFloat(computed.paddingLeft) || 0;
          const padRight = parseFloat(computed.paddingRight) || 0;
          availableWidth = (docEl.clientWidth || docEl.getBoundingClientRect().width) - padLeft - padRight;
        }
        currentPct = Math.round(((parseFloat(rawW) || 400) / Math.max(320, availableWidth)) * 100);
      }
    } else if (typeof rawW === "number") {
      currentPct = rawW;
    }
    // Floating images: keep readable text column, so cap at ~65%; block images may go to 100%
    const maxPct = floated ? 65 : 100;
    const minPct = 18;
    const nextPct = Math.min(maxPct, Math.max(minPct, currentPct + delta));
    updateAttributes({ width: `${nextPct}%` });
  };

  // Robust 8-Handle Resizing — reduced sensitivity for precise 1-2% control, correctly scoped per layout
  const startResize = useCallback(
    (direction: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w", startEvent: React.MouseEvent) => {
      startEvent.preventDefault();
      startEvent.stopPropagation();

      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      const docEl = containerRef.current.closest(".tiptap") || containerRef.current.closest(".ProseMirror") || document.querySelector(".tiptap");
      let availableWidth = 800;
      if (docEl) {
        const computed = window.getComputedStyle(docEl);
        const padLeft = parseFloat(computed.paddingLeft) || 0;
        const padRight = parseFloat(computed.paddingRight) || 0;
        availableWidth = Math.max(320, (docEl.clientWidth || docEl.getBoundingClientRect().width) - padLeft - padRight);
      }

      const startX = startEvent.clientX;
      const startY = startEvent.clientY;
      const startW = Math.max(80, containerRect.width);
      const startH = Math.max(60, containerRect.height);
      const currentAR = aspectRatio || (startW / (startH || 1));
      const floated = isLeft || isRight;

      setIsResizing(true);

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newW = startW;
        let newH = startH;

        // Lower sensitivity: divide by ~3.2*startW so a 60px drag ≈ ~10% change instead of 20%.
        // This makes left/right float tweaks feel precise, not jumpy.
        const sensDivisor = Math.max(220, startW * 3.2);
        if (direction === "se") {
          const scale = Math.max(0.12, 1 + (deltaX + deltaY * 0.55) / sensDivisor);
          newW = startW * scale;
          newH = lockAspectRatio ? newW / currentAR : startH + deltaY * 0.55;
        } else if (direction === "sw") {
          const scale = Math.max(0.12, 1 + (-deltaX + deltaY * 0.55) / sensDivisor);
          newW = startW * scale;
          newH = lockAspectRatio ? newW / currentAR : startH + deltaY * 0.55;
        } else if (direction === "ne") {
          const scale = Math.max(0.12, 1 + (deltaX - deltaY * 0.55) / sensDivisor);
          newW = startW * scale;
          newH = lockAspectRatio ? newW / currentAR : startH - deltaY * 0.55;
        } else if (direction === "nw") {
          const scale = Math.max(0.12, 1 + (-deltaX - deltaY * 0.55) / sensDivisor);
          newW = startW * scale;
          newH = lockAspectRatio ? newW / currentAR : startH - deltaY * 0.55;
        } else if (direction === "e") {
          newW = startW + deltaX * 0.9;
          newH = lockAspectRatio ? newW / currentAR : startH;
        } else if (direction === "w") {
          newW = startW - deltaX * 0.9;
          newH = lockAspectRatio ? newW / currentAR : startH;
        } else if (direction === "s") {
          newH = Math.max(60, startH + deltaY * 0.9);
          newW = lockAspectRatio ? newH * currentAR : startW;
        } else if (direction === "n") {
          newH = Math.max(60, startH - deltaY * 0.9);
          newW = lockAspectRatio ? newH * currentAR : startW;
        }

        const minW = 120;
        const maxW = floated ? Math.min(availableWidth * 0.65, availableWidth - 40) : availableWidth;
        newW = Math.max(minW, Math.min(maxW, newW));
        if (lockAspectRatio) newH = newW / currentAR;

        const maxPct = floated ? 65 : 100;
        const pct = Math.min(maxPct, Math.max(18, Math.round((newW / availableWidth) * 100)));
        const dims = { width: Math.round(newW), height: Math.round(newH), percent: pct };
        latestDimensionsRef.current = dims;
        setLiveDimensions(dims);

        const hostEl = containerRef.current?.closest(".floating-image-host") as HTMLElement | null;
        if (hostEl && floated) {
          hostEl.style.setProperty("width", `${pct}%`, "important");
        } else if (containerRef.current) {
          // Center/Inline/Wide: width lives on inner container, keep outer at 100%
          containerRef.current.style.width = `${pct}%`;
        }
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        setIsResizing(false);
        if (latestDimensionsRef.current) {
          const finalPct = latestDimensionsRef.current.percent;
          updateAttributes({
            width: `${finalPct}%`,
            height: lockAspectRatio ? null : `${latestDimensionsRef.current.height}px`,
          });
        }
        latestDimensionsRef.current = null;
        setLiveDimensions(null);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [aspectRatio, lockAspectRatio, updateAttributes, isLeft, isRight]
  );

  // Set layout shortcut
  const setLayout = (nextLayout: "left" | "center" | "right" | "wide" | "inline") => {
    let nextFloat: "none" | "left" | "right" = "none";
    let nextWrap: "square" | "inline" | "top-bottom" = "square";
    let nextWidth = width;

    if (nextLayout === "left") {
      nextFloat = "left";
      if (width === "100%") nextWidth = "45%";
    } else if (nextLayout === "right") {
      nextFloat = "right";
      if (width === "100%") nextWidth = "45%";
    } else if (nextLayout === "wide") {
      nextFloat = "none";
      nextWidth = "100%";
      nextWrap = "top-bottom";
    } else if (nextLayout === "inline") {
      nextFloat = "none";
      nextWrap = "inline";
      if (width === "100%") nextWidth = "300px";
    } else {
      nextFloat = "none";
      nextWrap = "top-bottom";
    }

    updateAttributes({
      layout: nextLayout,
      float: nextFloat,
      wrapMode: nextWrap,
      width: nextWidth,
    });
  };

  // If no URL or in edit URL mode
  if (isEditingUrl || !src) {
    return (
      <NodeViewWrapper className="my-6 block clear-both">
        <div
          className={`rounded-2xl border-2 border-dashed p-6 bg-surface-raised transition-all ${
            selected ? "border-brand ring-4 ring-brand/10" : "border-border"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">Insert Image</p>
              <p className="text-xs text-text-tertiary">
                Paste image URL below, or upload via top ribbon
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                autoFocus
                placeholder="https://images.unsplash.com/photo-..."
                defaultValue={src}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      updateAttributes({ src: val, width: "100%", layout: "center", float: "none" });
                      setIsEditingUrl(false);
                    }
                  }
                  if (e.key === "Escape") setIsEditingUrl(false);
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val) {
                    updateAttributes({ src: val, width: "100%", layout: "center", float: "none" });
                    setIsEditingUrl(false);
                  }
                }}
                className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => deleteNode()}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-surface text-text-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Tight wrap — image occupies only its own size, text fills rest (12px gap)
  const marginStyles: React.CSSProperties = {
    marginTop: `${marginTop ?? 4}px`,
    marginBottom: `${marginBottom ?? 8}px`,
    marginRight: isCenter ? "auto" : isRight ? "0px" : `${Math.min(marginRight ?? 12, 12)}px`,
    marginLeft: isCenter ? "auto" : isLeft ? "0px" : `${Math.min(marginLeft ?? 12, 12)}px`,
  };

  // Real-time active width & height during dragging or attribute changes
  const activeWidthPercent = liveDimensions
    ? `${liveDimensions.percent}%`
    : width || (isLeft || isRight ? "45%" : "100%");

  const activeHeight = liveDimensions && !lockAspectRatio
    ? `${liveDimensions.height}px`
    : height || "auto";

  // Floats: host is shrink-wrapped to image width exactly; text fills remaining space.
  const hostLiveWidth = liveDimensions ? `${liveDimensions.percent}%` : null;
  const outerWidth = isLeft || isRight
    ? hostLiveWidth ?? (width || "38%")
    : isInline
      ? hostLiveWidth ?? (width || "320px")
      : "100%";
  const innerWidth = isLeft || isRight ? "100%" : hostLiveWidth ?? (width || "100%");

  return (
    <NodeViewWrapper
      className={`${wrapperClass} transition-[margin] select-none group/img-wrapper relative`}
      data-floating-image="true"
      data-float={float}
      data-layout={layout}
      style={{
        ...marginStyles,
        width: outerWidth,
        maxWidth: "100%",
        float: isLeft ? "left" : isRight ? "right" : "none",
        clear: isCenter || isWide ? "both" : "none",
        display: isLeft || isRight ? "inline-block" : isInline ? "inline-block" : "block",
        overflow: "visible",
      }}
    >
      <div
        ref={containerRef}
        className={`relative ${
          isCenter ? "mx-auto block text-center" : isRight ? "ml-auto mr-0 block" : isLeft ? "mr-auto ml-0 block" : "inline-block"
        }`}
        style={{
          width: innerWidth,
          maxWidth: "100%",
          height: activeHeight,
          overflow: "visible",
        }}
      >
        {/* Floating Context Toolbar Anchored on Top of Image when selected */}
        {selected && (
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-xl border border-border/80 bg-navy p-1 shadow-2xl text-white backdrop-blur-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Position / Float Buttons */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-white/15">
              <button
                type="button"
                onClick={() => setLayout("left")}
                title="Float Left (Wrap text on right)"
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  isLeft ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("center")}
                title="Center (Break text top/bottom)"
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  isCenter ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("right")}
                title="Float Right (Wrap text on left)"
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  isRight ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayout("wide")}
                title="Full Width Banner"
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  isWide ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Sizing presets — layout-aware, precise 2% steps */}
            <div className="flex items-center gap-0.5 px-1 border-r border-white/15">
              <button
                type="button"
                onClick={() => stepWidth(-2)}
                title="Decrease by 2% — precise for float wrap"
                className="flex h-6 w-6 items-center justify-center rounded font-bold text-xs text-slate-300 hover:bg-white/15 hover:text-white transition"
              >
                −
              </button>
              {( (isLeft || isRight) ? (["25%", "33%", "42%", "50%", "60%"] as const) : (["25%", "50%", "75%", "100%"] as const) ).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => updateAttributes({ width: sz })}
                  className={`px-1.5 py-1 text-[10px] font-bold rounded transition ${
                    width === sz ? "bg-brand text-navy" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {sz}
                </button>
              ))}
              <button
                type="button"
                onClick={() => stepWidth(2)}
                title="Increase by 2% — precise for float wrap"
                className="flex h-6 w-6 items-center justify-center rounded font-bold text-xs text-slate-300 hover:bg-white/15 hover:text-white transition"
              >
                +
              </button>
            </div>

            {/* Caption Toggle */}
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

            {/* Link Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLinkPopover(!showLinkPopover)}
                title="Image Hyperlink"
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
                  link ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
              </button>

              {showLinkPopover && (
                <div className="absolute top-9 left-1/2 -translate-x-1/2 z-40 w-64 rounded-xl border border-border bg-navy p-2.5 shadow-2xl text-xs text-white">
                  <p className="font-bold mb-1 text-slate-300">Link destination</p>
                  <input
                    type="url"
                    autoFocus
                    placeholder="https://..."
                    value={tempLink}
                    onChange={(e) => setTempLink(e.target.value)}
                    className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={openLinkInNewTab}
                        onChange={(e) => updateAttributes({ openLinkInNewTab: e.target.checked })}
                        className="rounded text-brand"
                      />
                      New tab
                    </label>
                    <div className="flex gap-1">
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
                        className="px-2.5 py-1 rounded bg-brand text-navy font-bold text-[10px] hover:bg-brand-hover"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Replace image */}
            <button
              type="button"
              onClick={() => setIsEditingUrl(true)}
              title="Replace Image URL"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </button>

            {/* Delete Image */}
            <button
              type="button"
              onClick={() => deleteNode()}
              title="Delete Image"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-flame hover:bg-flame/20 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Live Dimensional Badge — high-contrast, always visible when resizing/selected */}
        {(isResizing || selected) && (
          <div
            className={`absolute ${isResizing ? "top-2 left-1/2 -translate-x-1/2" : "top-2 left-2"} z-30 pointer-events-none rounded-full px-2.5 py-1 text-[11px] font-mono font-bold shadow-lg border flex items-center gap-1.5 ${
              isResizing
                ? "bg-brand text-navy border-brand shadow-brand/20"
                : "bg-navy text-white border-white/15"
            }`}
          >
            <span className={`h-2 w-2 rounded-full shrink-0 ${isResizing ? "bg-navy animate-pulse" : "bg-brand"}`} />
            {liveDimensions
              ? `${liveDimensions.width} × ${liveDimensions.height} px · ${liveDimensions.percent}%`
              : `${parseInt(String(width)) || 100}% · ${float !== "none" ? `Float ${float}` : layout}${isLeft || isRight ? " (wrap)" : ""}`}
          </div>
        )}

        {/* Drag Handle — move (not duplicate): sets NodeSelection on drag start, ProseMirror moves node */}
        <div
          data-drag-handle
          draggable
          contentEditable={false}
          onDragStart={(e) => {
            // Ensure the image node is selected as a NodeSelection so ProseMirror moves it, not copies
            try {
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
              // Provide a clean drag image (optional) — use the card element
              // Do not set custom html that would duplicate on drop
            }
          }}
          onMouseDown={() => {
            // Pre-select node so drag starts from correct position
            try {
              if (getPos && editor && !selected) {
                const pos = getPos();
                if (typeof pos === "number") editor.commands.setNodeSelection(pos);
              }
            } catch {}
          }}
          className="absolute top-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-navy/90 backdrop-blur border border-white/15 text-white shadow-md opacity-0 group-hover/img-wrapper:opacity-100 data-[visible=true]:opacity-100 cursor-grab active:cursor-grabbing transition select-none"
          title="Drag to move (not duplicate) — drag handle"
          data-visible={selected ? "true" : undefined}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* CARD — zero extra chrome: width == image size exactly, no padding layout gap */}
        <div
          className={`relative bg-white border transition-all duration-150 ${shadowMap[shadow] || "shadow-sm"} ${selected ? "z-10 !shadow-lg ring-2 ring-brand/25" : "group-hover/img-wrapper:shadow-md"}`}
          style={{
            borderRadius: `${borderRadius}px`,
            borderWidth: `${Math.max(1, borderWidth || 1)}px`,
            borderStyle: borderWidth === 0 ? "solid" : borderStyle,
            borderColor: selected ? "#FEA611" : borderWidth > 0 ? borderColor : "#E2E8F0",
            opacity: opacity,
            transform: rotation ? `rotate(${rotation}deg)` : undefined,
            padding: "0px",
            background: "#FFFFFF",
            // Host already limits width to image size — card must not add layout size
            boxSizing: "border-box",
          }}
        >
          {/* Selection outline — inset 0, does not add size; only visual */}
          <div
            className={`pointer-events-none absolute inset-0 rounded-[inherit] border transition-all duration-150 ${
              selected
                ? "border-2 border-brand bg-brand/[0.04] shadow-[0_0_0_3px_rgba(254,166,17,0.12)]"
                : "border border-dashed border-slate-300/40 bg-transparent group-hover/img-wrapper:border-brand/25"
            }`}
            style={{ borderRadius: `${borderRadius}px` }}
            aria-hidden
          />
          {/* Image — fills card exactly, no inner padding */}
          <div
            className="relative overflow-hidden bg-[#FAFAF8]"
            style={{ borderRadius: `${Math.max(0, borderRadius - 1)}px` } as any}
          >
            {link && (
              <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full bg-navy/85 backdrop-blur px-2 py-1 text-[10px] font-semibold text-white border border-white/10 shadow-md">
                <Link2 className="h-3 w-3 text-brand" /> {link.replace(/^https?:\/\//, "").slice(0, 22)}...
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt={isDecorative ? "" : alt || ""}
              title={title || undefined}
              onLoad={onImageLoaded}
              style={{
                width: "100%",
                height: activeHeight,
                objectFit: objectFit as any,
                borderRadius: "inherit",
                display: "block",
              }}
              className="block max-w-full select-none"
              loading="lazy"
              draggable={false}
            />
          </div>

          {/* 8 Resizing BOX Handles — Word-style squares, always visible on hover/selected, never clipped */}
          <div
            className={`absolute inset-0 pointer-events-none ${selected ? "opacity-100" : "opacity-0 group-hover/img-wrapper:opacity-100"} transition-opacity duration-150`}
            aria-hidden
          >
            {/* Corners — square boxes */}
            <div
              onMouseDown={(e) => startResize("nw", e)}
              className="pointer-events-auto absolute top-0 left-0 h-[14px] w-[14px] -translate-x-[7px] -translate-y-[7px] rounded-[3px] border-2 border-white bg-brand shadow-[0_1px_6px_rgba(0,0,0,0.22)] cursor-nwse-resize z-30 hover:scale-110 active:scale-95 transition-transform ring-1 ring-black/10"
              title="Drag to resize"
            />
            <div
              onMouseDown={(e) => startResize("ne", e)}
              className="pointer-events-auto absolute top-0 right-0 h-[14px] w-[14px] translate-x-[7px] -translate-y-[7px] rounded-[3px] border-2 border-white bg-brand shadow-[0_1px_6px_rgba(0,0,0,0.22)] cursor-nesw-resize z-30 hover:scale-110 active:scale-95 transition-transform ring-1 ring-black/10"
              title="Drag to resize"
            />
            <div
              onMouseDown={(e) => startResize("sw", e)}
              className="pointer-events-auto absolute bottom-0 left-0 h-[14px] w-[14px] -translate-x-[7px] translate-y-[7px] rounded-[3px] border-2 border-white bg-brand shadow-[0_1px_6px_rgba(0,0,0,0.22)] cursor-nesw-resize z-30 hover:scale-110 active:scale-95 transition-transform ring-1 ring-black/10"
              title="Drag to resize"
            />
            <div
              onMouseDown={(e) => startResize("se", e)}
              className="pointer-events-auto absolute bottom-0 right-0 h-[14px] w-[14px] translate-x-[7px] translate-y-[7px] rounded-[3px] border-2 border-white bg-brand shadow-[0_1px_6px_rgba(0,0,0,0.22)] cursor-nwse-resize z-30 hover:scale-110 active:scale-95 transition-transform ring-1 ring-black/10"
              title="Drag to resize"
            />
            {/* Edges — rectangular boxes */}
            <div
              onMouseDown={(e) => startResize("w", e)}
              className="pointer-events-auto absolute top-1/2 left-0 h-5 w-[10px] -translate-x-[6px] -translate-y-1/2 rounded-[3px] border-2 border-white bg-white shadow-[0_1px_6px_rgba(0,0,0,0.18)] cursor-ew-resize z-30 hover:bg-brand hover:border-white transition-colors ring-1 ring-black/10"
              title="Drag to adjust width"
            />
            <div
              onMouseDown={(e) => startResize("e", e)}
              className="pointer-events-auto absolute top-1/2 right-0 h-5 w-[10px] translate-x-[6px] -translate-y-1/2 rounded-[3px] border-2 border-white bg-white shadow-[0_1px_6px_rgba(0,0,0,0.18)] cursor-ew-resize z-30 hover:bg-brand hover:border-white transition-colors ring-1 ring-black/10"
              title="Drag to adjust width"
            />
            <div
              onMouseDown={(e) => startResize("n", e)}
              className="pointer-events-auto absolute top-0 left-1/2 h-[10px] w-5 -translate-x-1/2 -translate-y-[6px] rounded-[3px] border-2 border-white bg-white shadow-[0_1px_6px_rgba(0,0,0,0.18)] cursor-ns-resize z-30 hover:bg-brand hover:border-white transition-colors ring-1 ring-black/10 hidden sm:flex"
              title="Drag to adjust height"
            />
            <div
              onMouseDown={(e) => startResize("s", e)}
              className="pointer-events-auto absolute bottom-0 left-1/2 h-[10px] w-5 -translate-x-1/2 translate-y-[6px] rounded-[3px] border-2 border-white bg-white shadow-[0_1px_6px_rgba(0,0,0,0.18)] cursor-ns-resize z-30 hover:bg-brand hover:border-white transition-colors ring-1 ring-black/10 hidden sm:flex"
              title="Drag to adjust height"
            />
          </div>
        </div>

        {/* Inline Caption Editor */}
        {(caption || showCaptionInput) && (
          <div className="mt-2 text-xs">
            <input
              type="text"
              placeholder="Write a caption..."
              value={caption || ""}
              onChange={(e) => updateAttributes({ caption: e.target.value })}
              className={`w-full bg-transparent px-2 py-1 text-text-secondary placeholder:text-text-tertiary focus:outline-none focus:border-b focus:border-brand text-${captionAlign}`}
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
