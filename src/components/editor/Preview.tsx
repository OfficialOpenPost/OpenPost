"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone, Folder, Clock, Calendar } from "lucide-react";
import { SharedRender } from "@/components/render/SharedRender";
import { EDITOR_STYLES } from "@/components/editor/editor-styles";

type Viewport = "desktop" | "tablet" | "mobile";

interface PreviewProps {
  title: string;
  html: string;
  json?: Record<string, unknown>;
  category?: string;
  coverImage?: string;
  wordCount?: number;
  readingTime?: number;
}

const widths: Record<Viewport, string> = {
  desktop: "max-w-5xl",
  tablet: "max-w-2xl",
  mobile: "max-w-[400px]",
};

export function Preview({
  title,
  html,
  json,
  category = "Article",
  coverImage,
  wordCount,
  readingTime,
}: PreviewProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");

  return (
    <div className="w-full bg-[#F4F5F7] min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Preview Mode
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {([
            ["desktop", Monitor, "Desktop (1024px)"],
            ["tablet", Tablet, "Tablet (768px)"],
            ["mobile", Smartphone, "Mobile (390px)"],
          ] as const).map(([v, Icon, label]) => (
            <button
              key={v}
              onClick={() => setViewport(v)}
              className={`flex h-8 px-2.5 items-center gap-1.5 rounded-lg text-xs font-bold transition ${
                viewport === v
                  ? "bg-navy text-white shadow-xs"
                  : "text-slate-600 hover:text-navy hover:bg-white/60"
              }`}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="capitalize">{v}</span>
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-slate-500">
          {wordCount || 0} words · ~{readingTime || 2} min read
        </div>
      </div>

      <div className="mx-auto p-3 sm:p-6 md:p-8 transition-all duration-300">
        <div
          data-preview-viewport={viewport}
          className={`mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 overflow-hidden w-full transition-all duration-300 ${widths[viewport]} ${
            viewport === "mobile" ? "preview-mobile" : ""
          }`}
        >
          {/* Cover Image if available */}
          {coverImage && (
            <div className="w-full h-[220px] sm:h-[320px] overflow-hidden bg-slate-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-5 sm:p-8 md:p-10 space-y-6">
            {/* Category and Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 font-bold text-blue-700">
                <Folder className="h-3 w-3" /> {category}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Calendar className="h-3.5 w-3.5" /> {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="h-3.5 w-3.5" /> {readingTime || 2} min read
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-navy leading-tight font-display">
              {title || "Untitled"}
            </h1>

            <div className={`tiptap prose prose-lg prose-navy max-w-none pt-4 border-t border-slate-100 ${viewport === "mobile" ? "preview-mobile" : ""}`} data-preview-viewport={viewport}>
              {json ? (
                <SharedRender content={json} viewport={viewport} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Preview matches public frontend &amp; mobile responsive layout via SharedRender
        </p>
      </div>
    </div>
  );
}
