"use client";

import type { Editor } from "@tiptap/core";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Lock,
  Unlock,
  Trash2,
  Image as ImageIcon,
  Link2,
  Sliders,
  Sparkles,
  Info,
  Layers,
  RotateCw,
  Eye,
  WrapText,
  Upload,
} from "lucide-react";
import React, { useState } from "react";

interface ImageSettingsPanelProps {
  editor: Editor;
}

export function ImageSettingsPanel({ editor }: ImageSettingsPanelProps) {
  const attrs = editor.getAttributes("image");
  const {
    src = "",
    alt = "",
    title = "",
    caption = "",
    captionAlign = "center",
    width = "100%",
    height = "",
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
    link = "",
    openLinkInNewTab = true,
    isDecorative = false,
  } = attrs;

  const update = (patch: Record<string, any>) => {
    editor.chain().focus().updateAttributes("image", patch).run();
  };

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

    update({
      layout: nextLayout,
      float: nextFloat,
      wrapMode: nextWrap,
      width: nextWidth,
    });
  };

  const applySpacingPreset = (top: number, right: number, bottom: number, left: number) => {
    update({ marginTop: top, marginRight: right, marginBottom: bottom, marginLeft: left });
  };

  return (
    <div className="space-y-5 text-xs text-navy">
      {/* Header Info */}
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold">
          <ImageIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-navy truncate">Image Properties</p>
          <p className="text-[10px] text-text-tertiary">Float, dimensions & styling</p>
        </div>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteSelection().run()}
          className="p-1.5 rounded-lg text-flame hover:bg-flame/10 transition"
          title="Delete image"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* 1. POSITION & FLOAT */}
      <div>
        <label className="block font-bold text-navy mb-1.5 flex items-center justify-between">
          <span>Position & Flow</span>
          <span className="text-[10px] font-normal text-text-tertiary capitalize">
            {float !== "none" ? `Float ${float}` : layout}
          </span>
        </label>
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-surface-raised border border-border">
          <button
            type="button"
            onClick={() => setLayout("left")}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg font-semibold transition ${
              layout === "left" || float === "left"
                ? "bg-brand text-navy shadow-xs"
                : "text-text-secondary hover:bg-surface"
            }`}
            title="Float Left (Text flows on Right)"
          >
            <AlignLeft className="h-4 w-4" />
            <span className="text-[10px]">Left Wrap</span>
          </button>
          <button
            type="button"
            onClick={() => setLayout("center")}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg font-semibold transition ${
              layout === "center" && float === "none"
                ? "bg-brand text-navy shadow-xs"
                : "text-text-secondary hover:bg-surface"
            }`}
            title="Center Block (Text above & below)"
          >
            <AlignCenter className="h-4 w-4" />
            <span className="text-[10px]">Center</span>
          </button>
          <button
            type="button"
            onClick={() => setLayout("right")}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg font-semibold transition ${
              layout === "right" || float === "right"
                ? "bg-brand text-navy shadow-xs"
                : "text-text-secondary hover:bg-surface"
            }`}
            title="Float Right (Text flows on Left)"
          >
            <AlignRight className="h-4 w-4" />
            <span className="text-[10px]">Right Wrap</span>
          </button>
          <button
            type="button"
            onClick={() => setLayout("wide")}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg font-semibold transition ${
              layout === "wide"
                ? "bg-brand text-navy shadow-xs"
                : "text-text-secondary hover:bg-surface"
            }`}
            title="Full Width Banner"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="text-[10px]">Full Wide</span>
          </button>
        </div>
      </div>

      {/* 2. TEXT WRAPPING OPTIONS */}
      <div>
        <label className="block font-bold text-navy mb-1.5">Text Wrapping</label>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface-raised border border-border">
          {[
            { key: "square", label: "Square (Flow)" },
            { key: "top-bottom", label: "Top & Bottom" },
            { key: "inline", label: "Inline" },
          ].map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => update({ wrapMode: mode.key })}
              className={`py-1.5 text-center text-[11px] font-semibold rounded-lg transition ${
                wrapMode === mode.key
                  ? "bg-brand text-navy shadow-xs"
                  : "text-text-secondary hover:bg-surface"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. SIZE & DIMENSIONS — layout-aware, precise 2% steps, px→% aware */}
      {(() => {
        const floated = float === "left" || float === "right" || layout === "left" || layout === "right";
        const parsePct = () => {
          const raw = String(width || (floated ? "42%" : "100%"));
          if (raw.endsWith("%")) return parseFloat(raw) || (floated ? 42 : 100);
          if (raw.endsWith("px")) return Math.round((parseFloat(raw) || 400) / 8); // ~800px base → 400px≈50%
          return parseFloat(raw) || (floated ? 42 : 100);
        };
        const step = (delta: number) => {
          const cur = parsePct();
          const max = floated ? 65 : 100;
          const next = Math.min(max, Math.max(18, cur + delta));
          update({ width: `${next}%` });
        };
        const presets = floated ? ["25%", "33%", "42%", "50%", "60%"] : ["25%", "50%", "75%", "100%"];
        const curPct = parsePct();
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-navy">Size {floated ? "(Float width)" : "(Block width)"}</label>
              <span className="font-mono text-[10px] text-text-tertiary">{width} {floated && curPct > 65 ? "· capped 65% for wrap" : ""}</span>
            </div>
            <div className="flex flex-wrap gap-1 items-center">
              <button
                type="button"
                onClick={() => step(-2)}
                title="Decrease by 2% — fine adjust for float wrapping"
                className="px-2.5 py-1.5 rounded-lg border font-bold text-xs bg-surface border-border text-navy hover:bg-surface-raised transition"
              >
                −2%
              </button>
              {presets.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => update({ width: sz })}
                  className={`flex-1 py-1.5 rounded-lg border text-center font-bold text-[11px] transition ${
                    width === sz ? "bg-navy text-white border-navy" : "bg-surface border-border text-text-secondary hover:bg-surface-raised"
                  }`}
                >
                  {sz}
                </button>
              ))}
              <button
                type="button"
                onClick={() => step(2)}
                title="Increase by 2% — fine adjust for float wrapping"
                className="px-2.5 py-1.5 rounded-lg border font-bold text-xs bg-surface border-border text-navy hover:bg-surface-raised transition"
              >
                +2%
              </button>
            </div>
            {/* Precise slider */}
            <div className="pt-1">
              <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
                <span>{floated ? "Narrow — more text wraps" : "Compact"}</span>
                <span className="font-mono font-bold text-navy">{curPct}%</span>
                <span>{floated ? "Wide — less wrap" : "Full"}</span>
              </div>
              <input
                type="range"
                min={18}
                max={floated ? 65 : 100}
                step={1}
                value={curPct}
                onChange={(e) => update({ width: `${Number(e.target.value)}%` })}
                className="w-full accent-brand"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-text-tertiary font-medium">Custom Width</span>
                <input
                  type="text"
                  value={width || ""}
                  onChange={(e) => update({ width: e.target.value })}
                  placeholder="e.g. 420px or 48%"
                  className="mt-0.5 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-xs focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-text-tertiary font-medium">Lock Aspect Ratio</span>
                <button
                  type="button"
                  onClick={() => update({ lockAspectRatio: !lockAspectRatio })}
                  className={`mt-0.5 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 font-semibold text-xs transition ${
                    lockAspectRatio ? "bg-brand/10 border-brand text-brand" : "bg-surface border-border text-text-secondary hover:bg-surface-raised"
                  }`}
                >
                  {lockAspectRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  {lockAspectRatio ? "Locked" : "Unlocked"}
                </button>
              </div>
            </div>
            {floated && (
              <p className="text-[10px] leading-relaxed text-text-tertiary bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                Tip: Float widths above ~55% leave little room for text on desktop. Use 30–45% for balanced wrapping.
              </p>
            )}
          </div>
        );
      })()}

      {/* 4. SPACING & MARGINS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-bold text-navy">Margins (Text Gap)</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => applySpacingPreset(0, 0, 0, 0)}
              className="px-1.5 py-0.5 rounded text-[10px] bg-surface-raised hover:bg-surface border border-border font-medium"
            >
              None
            </button>
            <button
              type="button"
              onClick={() => applySpacingPreset(8, 16, 12, 16)}
              className="px-1.5 py-0.5 rounded text-[10px] bg-surface-raised hover:bg-surface border border-border font-medium"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => applySpacingPreset(8, 24, 16, 24)}
              className="px-1.5 py-0.5 rounded text-[10px] bg-surface-raised hover:bg-surface border border-border font-medium"
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => applySpacingPreset(16, 36, 24, 36)}
              className="px-1.5 py-0.5 rounded text-[10px] bg-surface-raised hover:bg-surface border border-border font-medium"
            >
              Wide
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <div>
            <span className="text-[10px] text-text-tertiary">Top</span>
            <input
              type="number"
              value={marginTop}
              onChange={(e) => update({ marginTop: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-surface p-1 text-center font-mono text-xs focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary">Right</span>
            <input
              type="number"
              value={marginRight}
              onChange={(e) => update({ marginRight: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-surface p-1 text-center font-mono text-xs focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary">Bottom</span>
            <input
              type="number"
              value={marginBottom}
              onChange={(e) => update({ marginBottom: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-surface p-1 text-center font-mono text-xs focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary">Left</span>
            <input
              type="number"
              value={marginLeft}
              onChange={(e) => update({ marginLeft: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-surface p-1 text-center font-mono text-xs focus:border-brand focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. APPEARANCE & BORDERS */}
      <div className="space-y-3">
        <label className="font-bold text-navy block">Appearance</label>
        
        {/* Border Radius */}
        <div>
          <div className="flex justify-between text-[10px] text-text-secondary mb-1">
            <span>Corner Radius</span>
            <span className="font-mono font-bold">{borderRadius}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={borderRadius}
            onChange={(e) => update({ borderRadius: Number(e.target.value) })}
            className="w-full accent-brand"
          />
        </div>

        {/* Border Style & Width */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] text-text-tertiary">Border Width</span>
            <input
              type="number"
              min="0"
              max="10"
              value={borderWidth}
              onChange={(e) => update({ borderWidth: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-surface p-1 text-center font-mono text-xs focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary">Style</span>
            <select
              value={borderStyle}
              onChange={(e) => update({ borderStyle: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface p-1 text-xs focus:border-brand focus:outline-none"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary">Color</span>
            <input
              type="color"
              value={borderColor}
              onChange={(e) => update({ borderColor: e.target.value })}
              className="h-7 w-full rounded-lg border border-border cursor-pointer bg-surface p-0.5"
            />
          </div>
        </div>

        {/* Shadow Preset */}
        <div>
          <span className="text-[10px] text-text-tertiary font-medium block mb-1">Shadow Elevation</span>
          <div className="grid grid-cols-5 gap-1">
            {(["none", "sm", "md", "lg", "xl"] as const).map((sh) => (
              <button
                key={sh}
                type="button"
                onClick={() => update({ shadow: sh })}
                className={`py-1 rounded text-center text-[10px] uppercase font-bold border transition ${
                  shadow === sh
                    ? "bg-brand text-navy border-brand"
                    : "bg-surface border-border text-text-secondary hover:bg-surface-raised"
                }`}
              >
                {sh}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity & Rotation */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex justify-between text-[10px] text-text-secondary mb-1">
              <span>Opacity</span>
              <span className="font-mono">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
              className="w-full accent-brand"
            />
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-text-secondary mb-1">
              <span>Rotation</span>
              <span className="font-mono">{rotation}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={rotation}
              onChange={(e) => update({ rotation: Number(e.target.value) })}
              className="w-full accent-brand"
            />
          </div>
        </div>
      </div>

      {/* 6. ACCESSIBILITY & SEO */}
      <div className="space-y-2 pt-2 border-t border-border">
        <label className="font-bold text-navy block">Accessibility & SEO</label>
        <div>
          <div className="flex justify-between text-[10px] text-text-tertiary mb-0.5">
            <span>Alt Text</span>
            <span>{isDecorative ? "Decorative" : `${alt?.length || 0}/125`}</span>
          </div>
          <input
            type="text"
            disabled={isDecorative}
            value={alt || ""}
            onChange={(e) => update({ alt: e.target.value })}
            placeholder="Describe image for screen readers & SEO..."
            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs focus:border-brand focus:outline-none disabled:opacity-50"
          />
        </div>
        <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={isDecorative}
            onChange={(e) => update({ isDecorative: e.target.checked, alt: e.target.checked ? "" : alt })}
            className="rounded text-brand"
          />
          Mark as decorative (omit from screen readers)
        </label>
      </div>

      {/* 7. HYPERLINK */}
      <div className="space-y-2 pt-2 border-t border-border">
        <label className="font-bold text-navy flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5 text-brand" /> Image Link
        </label>
        <input
          type="url"
          value={link || ""}
          onChange={(e) => update({ link: e.target.value })}
          placeholder="https://example.com"
          className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs focus:border-brand focus:outline-none"
        />
        <label className="flex items-center gap-2 text-[11px] text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={openLinkInNewTab}
            onChange={(e) => update({ openLinkInNewTab: e.target.checked })}
            className="rounded text-brand"
          />
          Open link in new tab
        </label>
      </div>

      {/* 8. CAPTION & TITLE */}
      <div className="space-y-2 pt-2 border-t border-border">
        <label className="font-bold text-navy block">Caption</label>
        <input
          type="text"
          value={caption || ""}
          onChange={(e) => update({ caption: e.target.value })}
          placeholder="Write image caption..."
          className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs focus:border-brand focus:outline-none"
        />
        <div className="flex gap-1 pt-1">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => update({ captionAlign: align })}
              className={`flex-1 py-1 rounded text-[10px] font-semibold border capitalize transition ${
                captionAlign === align
                  ? "bg-navy text-white border-navy"
                  : "bg-surface border-border text-text-secondary hover:bg-surface-raised"
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
