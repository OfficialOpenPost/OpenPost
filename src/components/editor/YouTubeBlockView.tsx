"use client";

import React, { useState, useRef, useEffect } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  Video,
  Play,
  Settings,
  Trash2,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Tv,
  Clock,
  Sparkles,
  ExternalLink,
  Volume2,
  VolumeX,
  Repeat,
  ShieldCheck,
  Smartphone,
  Square,
  Monitor,
  Check,
  X,
  Film,
} from "lucide-react";

export function parseVideoUrl(url: string): {
  provider: "youtube" | "vimeo" | "custom";
  videoId: string;
  embedUrl: string;
} | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // 1. YouTube watch, embed, short link, or shorts
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      provider: "youtube",
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    };
  }

  // 2. Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      provider: "vimeo",
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
    };
  }

  // 3. Direct video URL or custom
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      provider: "custom",
      videoId: trimmed,
      embedUrl: trimmed,
    };
  }

  return null;
}

export function YouTubeBlockView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const {
    src = "",
    url = "",
    videoId = "",
    provider = "youtube",
    caption = "",
    title = "",
    align = "center",
    layout = "center",
    width = "100%",
    aspectRatio = "16:9",
    autoplay = false,
    muted = false,
    loop = false,
    controls = true,
    startTime = 0,
    privacyEnhanced = true,
  } = node.attrs;

  const currentUrl = src || url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : "");
  const [isEditing, setIsEditing] = useState(!currentUrl);
  const [editUrl, setEditUrl] = useState(currentUrl);
  const [editCaption, setEditCaption] = useState(caption);
  const [editTitle, setEditTitle] = useState(title);
  const [editAspectRatio, setEditAspectRatio] = useState(aspectRatio || "16:9");
  const [editStartTime, setEditStartTime] = useState(startTime || "");
  const [editAutoplay, setEditAutoplay] = useState(autoplay || false);
  const [editMuted, setEditMuted] = useState(muted || false);
  const [editLoop, setEditLoop] = useState(loop || false);
  const [editControls, setEditControls] = useState(controls ?? true);
  const [editPrivacy, setEditPrivacy] = useState(privacyEnhanced ?? true);

  // Resize drag states
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveLayout = layout || align || "center";
  const effectiveProvider = provider || (parseVideoUrl(currentUrl)?.provider ?? "youtube");
  const effectiveVideoId = videoId || (parseVideoUrl(currentUrl)?.videoId ?? "");

  // Build final iframe embed URL with query params
  const buildEmbedSrc = () => {
    if (effectiveProvider === "youtube" && effectiveVideoId) {
      const base = editPrivacy
        ? `https://www.youtube-nocookie.com/embed/${effectiveVideoId}`
        : `https://www.youtube.com/embed/${effectiveVideoId}`;
      const params = new URLSearchParams();
      if (editAutoplay) params.set("autoplay", "1");
      if (editMuted) params.set("mute", "1");
      if (editLoop) {
        params.set("loop", "1");
        params.set("playlist", effectiveVideoId);
      }
      if (!editControls) params.set("controls", "0");
      if (editStartTime) {
        const seconds = parseTimeToSeconds(String(editStartTime));
        if (seconds > 0) params.set("start", String(seconds));
      }
      params.set("rel", "0");
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    }

    if (effectiveProvider === "vimeo" && effectiveVideoId) {
      const base = `https://player.vimeo.com/video/${effectiveVideoId}`;
      const params = new URLSearchParams();
      if (editAutoplay) params.set("autoplay", "1");
      if (editMuted) params.set("muted", "1");
      if (editLoop) params.set("loop", "1");
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    }

    return currentUrl;
  };

  const parseTimeToSeconds = (t: string): number => {
    if (!t) return 0;
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    const parts = t.split(":").map((p) => parseInt(p, 10) || 0);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const getAspectClass = (ar: string) => {
    switch (ar) {
      case "9:16":
        return "aspect-[9/16] max-w-[360px] mx-auto";
      case "1:1":
        return "aspect-square max-w-[540px] mx-auto";
      case "4:3":
        return "aspect-[4/3]";
      case "16:9":
      default:
        return "aspect-video";
    }
  };

  // Drag-to-resize handles
  const handleMouseDownResize = (e: React.MouseEvent, direction: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    const currentW = containerRef.current?.offsetWidth || 640;
    setResizeStartWidth(currentW);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = direction === "right" ? moveEvent.clientX - e.clientX : e.clientX - moveEvent.clientX;
      const newWidthPx = Math.max(320, Math.min(1200, currentW + delta * 2));
      updateAttributes({ width: `${newWidthPx}px` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleSaveModal = () => {
    const parsed = parseVideoUrl(editUrl);
    if (!parsed) {
      alert("Please enter a valid YouTube, Vimeo, or video URL.");
      return;
    }

    updateAttributes({
      src: editUrl.trim(),
      url: editUrl.trim(),
      videoId: parsed.videoId,
      provider: parsed.provider,
      caption: editCaption.trim(),
      title: editTitle.trim(),
      aspectRatio: editAspectRatio,
      startTime: editStartTime,
      autoplay: editAutoplay,
      muted: editMuted,
      loop: editLoop,
      controls: editControls,
      privacyEnhanced: editPrivacy,
    });
    setIsEditing(false);
  };

  const setAlignPreset = (newAlign: string) => {
    updateAttributes({ align: newAlign, layout: newAlign });
  };

  const setWidthPreset = (newWidth: string) => {
    updateAttributes({ width: newWidth });
  };

  // Wrapper positioning classes
  const containerAlignmentClass =
    effectiveLayout === "left"
      ? "float-left mr-8 mb-6 clear-none max-w-[48%]"
      : effectiveLayout === "right"
      ? "float-right ml-8 mb-6 clear-none max-w-[48%]"
      : effectiveLayout === "wide"
      ? "w-full my-8 clear-both"
      : "mx-auto my-8 clear-both";

  const widthStyle: React.CSSProperties = {
    width: effectiveLayout === "wide" ? "100%" : width || "100%",
    maxWidth: "100%",
  };

  return (
    <NodeViewWrapper className={`relative group my-8 select-none ${containerAlignmentClass}`}>
      <div
        ref={containerRef}
        style={widthStyle}
        className={`relative mx-auto rounded-3xl transition-all duration-200 ${
          selected ? "ring-2 ring-brand shadow-lg" : "hover:shadow-md"
        }`}
      >
        {/* ── 1. Floating Action Pill Bar (When Hovered/Selected) ── */}
        <div
          className={`absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-2xl bg-navy/95 backdrop-blur-md px-3 py-1.5 text-white shadow-xl transition-all duration-200 ${
            selected || isEditing ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
          }`}
        >
          {/* Alignment Buttons */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-white/20">
            <button
              type="button"
              onClick={() => setAlignPreset("left")}
              title="Float Left (Wrap Text)"
              className={`rounded-lg p-1.5 text-xs transition ${
                effectiveLayout === "left" ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/15"
              }`}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAlignPreset("center")}
              title="Center Align"
              className={`rounded-lg p-1.5 text-xs transition ${
                effectiveLayout === "center" ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/15"
              }`}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAlignPreset("right")}
              title="Float Right (Wrap Text)"
              className={`rounded-lg p-1.5 text-xs transition ${
                effectiveLayout === "right" ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/15"
              }`}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAlignPreset("wide")}
              title="Full Width"
              className={`rounded-lg p-1.5 text-xs transition ${
                effectiveLayout === "wide" ? "bg-brand text-navy font-bold" : "text-slate-300 hover:bg-white/15"
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Width Presets */}
          <div className="flex items-center gap-1 px-2 border-r border-white/20 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setWidthPreset("50%")}
              className={`px-2 py-0.5 rounded-md transition ${
                width === "50%" ? "bg-brand text-navy" : "text-slate-300 hover:bg-white/15"
              }`}
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setWidthPreset("75%")}
              className={`px-2 py-0.5 rounded-md transition ${
                width === "75%" ? "bg-brand text-navy" : "text-slate-300 hover:bg-white/15"
              }`}
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => setWidthPreset("100%")}
              className={`px-2 py-0.5 rounded-md transition ${
                width === "100%" ? "bg-brand text-navy" : "text-slate-300 hover:bg-white/15"
              }`}
            >
              100%
            </button>
          </div>

          {/* Edit & Delete Action Buttons */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1 text-xs font-bold text-white transition"
            >
              <Settings className="h-3.5 w-3.5 text-brand" /> Edit Video
            </button>
            <button
              type="button"
              onClick={deleteNode}
              title="Delete Video Block"
              className="rounded-lg p-1.5 text-rose-300 hover:bg-rose-500/30 hover:text-white transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── 2. Resize Handles (Left & Right) ── */}
        {selected && (
          <>
            <div
              onMouseDown={(e) => handleMouseDownResize(e, "left")}
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-2 cursor-ew-resize rounded-full bg-brand shadow-md hover:scale-125 transition-transform"
            />
            <div
              onMouseDown={(e) => handleMouseDownResize(e, "right")}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-2 cursor-ew-resize rounded-full bg-brand shadow-md hover:scale-125 transition-transform"
            />
          </>
        )}

        {/* ── 3. Main Video Player / Embed Frame ── */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-950 shadow-md">
          {currentUrl ? (
            <div className={`relative w-full ${getAspectClass(aspectRatio)}`}>
              <iframe
                src={buildEmbedSrc()}
                title={title || "Embedded Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          ) : (
            /* Empty State Card */
            <div
              onClick={() => setIsEditing(true)}
              className="p-12 text-center flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-50 hover:bg-slate-100 transition border-2 border-dashed border-slate-300 rounded-3xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-brand shadow-xs">
                <Video className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">Add YouTube or Video Embed</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Click to paste YouTube, Shorts, or Vimeo URL with custom player controls.
                </p>
              </div>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-navy shadow-xs"
              >
                <Play className="h-3.5 w-3.5" /> Configure Video
              </button>
            </div>
          )}

          {/* Video Metadata / Caption Bar */}
          {(caption || title) && currentUrl && (
            <div className="p-3 bg-white border-t border-slate-100 text-center">
              {title && <p className="text-xs font-bold text-navy truncate">{title}</p>}
              {caption && <p className="text-[11px] text-slate-500 italic mt-0.5">{caption}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Comprehensive Edit Video Modal Dialog ── */}
      {isEditing && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-xl rounded-3xl border border-border bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-raised">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-navy font-black shadow-xs">
                  <Film className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy font-display">Configure YouTube & Video Block</h3>
                  <p className="text-[11px] text-text-tertiary">
                    Embed YouTube, Vimeo, or Shorts with precision player formatting.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full p-1.5 text-text-tertiary hover:bg-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* URL Input */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Video URL (YouTube / Shorts / Vimeo) *
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white pl-9 pr-3 py-2.5 text-xs text-navy font-mono focus:border-brand focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-text-tertiary mt-1">
                  Supports standard watch links, shortened youtu.be, embed links, and YouTube Shorts.
                </p>
              </div>

              {/* Title & Caption */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Video Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js 16 Architectural Deep Dive"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Caption / Credit (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Source: OpenPost Keynote 2026"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">Aspect Ratio Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "16:9", label: "16:9 Widescreen", icon: Monitor },
                    { id: "4:3", label: "4:3 Classic", icon: Tv },
                    { id: "1:1", label: "1:1 Square", icon: Square },
                    { id: "9:16", label: "9:16 Shorts / Reel", icon: Smartphone },
                  ].map((ar) => {
                    const Icon = ar.icon;
                    const isSelected = editAspectRatio === ar.id;
                    return (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => setEditAspectRatio(ar.id)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                          isSelected
                            ? "border-brand bg-brand/10 text-navy font-bold shadow-2xs"
                            : "border-border bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="text-[10px] leading-tight">{ar.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Time Input */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Start Time (Optional)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="e.g. 01:45 or 105 (seconds)"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white pl-9 pr-3 py-2 text-xs text-navy font-mono focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Advanced Player Controls & Privacy Toggles */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <span className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Player Options & Privacy
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy">
                    <input
                      type="checkbox"
                      checked={editControls}
                      onChange={(e) => setEditControls(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand"
                    />
                    Show Video Controls
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy">
                    <input
                      type="checkbox"
                      checked={editMuted}
                      onChange={(e) => setEditMuted(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand"
                    />
                    Start Muted
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy">
                    <input
                      type="checkbox"
                      checked={editAutoplay}
                      onChange={(e) => setEditAutoplay(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand"
                    />
                    Autoplay on Load
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy">
                    <input
                      type="checkbox"
                      checked={editLoop}
                      onChange={(e) => setEditLoop(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand"
                    />
                    Loop Video
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Privacy-Enhanced Mode (youtube-nocookie.com)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editPrivacy}
                    onChange={(e) => setEditPrivacy(e.target.checked)}
                    className="rounded border-border text-brand focus:ring-brand"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-surface-raised">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition shadow-xs"
              >
                <Check className="h-4 w-4" /> Save Video Block
              </button>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
