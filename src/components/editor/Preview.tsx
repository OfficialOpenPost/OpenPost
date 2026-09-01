"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { SharedRender } from "@/components/render/SharedRender";

type Viewport = "desktop" | "tablet" | "mobile";

interface PreviewProps {
  title: string;
  html: string;
  json?: Record<string, unknown>;
}

const widths: Record<Viewport, string> = {
  desktop: "max-w-[960px]",
  tablet: "max-w-[720px]",
  mobile: "max-w-[400px]",
};

export function Preview({ title, html, json }: PreviewProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");

  return (
    <div className="w-full bg-surface-raised min-h-screen">
      <div className="sticky top-0 z-10 flex items-center justify-center gap-2 border-b border-border bg-surface p-3">
        {([
          ["desktop", Monitor],
          ["tablet", Tablet],
          ["mobile", Smartphone],
        ] as const).map(([v, Icon]) => (
          <button
            key={v}
            onClick={() => setViewport(v)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${viewport === v ? "bg-navy text-white border-navy" : "bg-surface border-border text-text-secondary hover:bg-surface-raised"}`}
            title={v}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="mx-auto p-4 sm:p-6 md:p-10 transition-all duration-300">
        <div className={`mx-auto bg-surface rounded-2xl shadow-xl border border-border overflow-hidden w-full ${widths[viewport]}`}>
          <div className="p-8 md:p-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-navy">{title || "Untitled"}</h1>
            <div className="mt-6">
              {json ? <SharedRender content={json} /> : <div className="prose prose-slate max-w-none prose-p:leading-7 prose-a:text-flame prose-blockquote:border-brand" dangerouslySetInnerHTML={{ __html: html }} />}
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-text-tertiary">Preview — renders same as public frontend via SharedRender</p>
      </div>
    </div>
  );
}
