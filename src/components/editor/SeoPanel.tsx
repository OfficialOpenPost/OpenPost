"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface SeoData {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  noIndex: boolean;
}

interface SeoPanelProps {
  data: SeoData;
  onChange: (data: SeoData) => void;
  hasFeaturedImage: boolean;
  wordCount: number;
  html: string;
}

export function SeoPanel({ data, onChange, hasFeaturedImage, wordCount, html }: SeoPanelProps) {
  const [tab, setTab] = useState<"seo" | "og" | "twitter">("seo");

  const warnings: string[] = [];
  if (!data.title) warnings.push("Missing SEO title");
  else if (data.title.length > 60) warnings.push(`SEO title too long (${data.title.length}/60)`);
  if (!data.description) warnings.push("Missing meta description");
  else if (data.description.length > 155) warnings.push(`Meta description too long (${data.description.length}/155)`);
  if (!hasFeaturedImage) warnings.push("Missing featured image");
  if (!data.ogImage) warnings.push("Missing OG image");
  if (!html.includes("<img")) warnings.push("No images with alt text detected");
  if (wordCount < 300) warnings.push("Content is short (<300 words)");

  const update = (patch: Partial<SeoData>) => onChange({ ...data, ...patch });

  return (
    <div className="w-full max-w-sm border-l border-border bg-surface flex flex-col">
      <div className="flex gap-1 p-2 border-b border-border bg-surface-raised">
        {[
          ["seo", "SEO"],
          ["og", "OG"],
          ["twitter", "Twitter"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as never)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${tab === key ? "bg-navy text-white" : "text-text-secondary hover:bg-surface"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {tab === "seo" && (
          <>
            <div>
              <label className="text-xs font-semibold text-text-primary">SEO Title</label>
              <input value={data.title} onChange={(e) => update({ title: e.target.value })} placeholder="60 chars max" className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              <p className="mt-1 text-xs text-text-tertiary">{data.title.length}/60</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-primary">Meta Description</label>
              <textarea value={data.description} onChange={(e) => update({ description: e.target.value })} rows={3} placeholder="155 chars max" className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none" />
              <p className="mt-1 text-xs text-text-tertiary">{data.description.length}/155</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-primary">Canonical URL</label>
              <input value={data.canonical} onChange={(e) => update({ canonical: e.target.value })} placeholder="https://example.com/post" className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={data.noIndex} onChange={(e) => update({ noIndex: e.target.checked })} className="rounded border-border text-brand focus:ring-brand/20" />
              Noindex (hide from search)
            </label>
          </>
        )}

        {tab === "og" && (
          <>
            <div>
              <label className="text-xs font-semibold text-text-primary">OG Title</label>
              <input value={data.ogTitle} onChange={(e) => update({ ogTitle: e.target.value })} placeholder="Open Graph title" className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-primary">OG Description</label>
              <textarea value={data.ogDescription} onChange={(e) => update({ ogDescription: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-primary">OG Image URL</label>
              <input value={data.ogImage} onChange={(e) => update({ ogImage: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
          </>
        )}

        {tab === "twitter" && (
          <>
            <div>
              <label className="text-xs font-semibold text-text-primary">Card Type</label>
              <select value={data.twitterCard} onChange={(e) => update({ twitterCard: e.target.value })} className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-primary">Twitter Title</label>
              <input value={data.twitterTitle} onChange={(e) => update({ twitterTitle: e.target.value })} className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-primary">Twitter Description</label>
              <textarea value={data.twitterDescription} onChange={(e) => update({ twitterDescription: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none" />
            </div>
          </>
        )}

        <div className="rounded-xl border border-border bg-surface-raised p-3">
          <p className="text-xs font-bold text-navy flex items-center gap-2">
            {warnings.length === 0 ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-brand" />}
            SEO Warnings {warnings.length === 0 ? "(all good)" : `(${warnings.length})`}
          </p>
          {warnings.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {warnings.map((w) => (
                <li key={w} className="text-xs text-text-secondary flex gap-2">
                  <AlertTriangle className="h-3 w-3 text-brand shrink-0 mt-0.5" /> {w}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-success">No issues detected.</p>
          )}
          <p className="mt-3 flex gap-1.5 text-[11px] leading-relaxed text-text-tertiary">
            <Info className="h-3 w-3 shrink-0 mt-0.5" /> These are structural best-practice checks, not a ranking guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}
