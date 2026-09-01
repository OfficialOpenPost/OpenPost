"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, X, Pipette } from "lucide-react";

interface ColorPickerPopoverProps {
  currentColor?: string;
  onSelectColor: (color: string | null) => void;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  isHighlight?: boolean;
}

const TEXT_PALETTE = [
  // Neutrals / Darks
  "#111827", "#1E293B", "#334155", "#475569", "#64748B", "#94A3B8",
  // Brand / Warm
  "#FEA611", "#FE4F01", "#FE990E", "#F14802", "#D97706", "#B45309",
  // Blues & Purples
  "#2563EB", "#1D4ED8", "#0284C7", "#0D9488", "#7C3AED", "#6D28D9",
  // Greens & Reds
  "#16A34A", "#15803D", "#059669", "#DC2626", "#B91C1C", "#E11D48",
];

const HIGHLIGHT_PALETTE = [
  "rgba(254, 166, 17, 0.3)", // Brand Yellow
  "rgba(254, 79, 1, 0.25)",  // Brand Orange
  "rgba(59, 130, 246, 0.25)", // Blue
  "rgba(16, 185, 129, 0.25)", // Green
  "rgba(236, 72, 153, 0.25)", // Pink
  "rgba(168, 85, 247, 0.25)", // Purple
  "rgba(245, 158, 11, 0.3)",  // Amber
  "rgba(239, 68, 68, 0.25)",  // Red
  "rgba(20, 184, 166, 0.25)", // Teal
  "rgba(100, 116, 139, 0.25)", // Slate
];

export function ColorPickerPopover({
  currentColor,
  onSelectColor,
  title,
  isOpen,
  onClose,
  isHighlight = false,
}: ColorPickerPopoverProps) {
  const [customColor, setCustomColor] = useState(currentColor || "#000000");
  const popoverRef = useRef<HTMLDivElement>(null);

  const palette = isHighlight ? HIGHLIGHT_PALETTE : TEXT_PALETTE;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute top-full mt-1.5 left-0 z-50 w-60 rounded-xl border border-border bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-100 text-navy"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
        <span className="text-xs font-bold text-navy">{title}</span>
        <button
          type="button"
          onClick={() => {
            onSelectColor(null);
            onClose();
          }}
          className="text-[10px] font-semibold text-text-tertiary hover:text-flame transition"
        >
          Reset default
        </button>
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-6 gap-1.5 mb-3">
        {palette.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              onSelectColor(color);
              onClose();
            }}
            className="group relative flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 transition hover:scale-110 shadow-2xs"
            style={{ backgroundColor: color }}
            title={color}
          >
            {currentColor === color && (
              <Check className="h-3.5 w-3.5 text-white drop-shadow-md" />
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="pt-2 border-t border-border flex items-center gap-2">
        <span className="text-[11px] font-semibold text-text-secondary">Custom</span>
        <div className="relative flex-1 flex items-center gap-1.5">
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              onSelectColor(e.target.value);
            }}
            className="h-7 w-7 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
                onSelectColor(e.target.value);
              }
            }}
            className="h-7 w-full rounded-md border border-border bg-surface-raised px-2 font-mono text-xs focus:border-brand focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
