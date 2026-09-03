"use client";

import { useState } from "react";
import {
  Search,
  Sparkles,
  CheckCircle2,
  Globe,
  Share2,
  FileCode,
  Check,
  Copy,
  Zap,
  ShieldCheck,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { FadeIn } from "@/components/motion";

type SeoTab = "serp" | "opengraph" | "jsonld";

export function SeoPerformance3D() {
  const [activeTab, setActiveTab] = useState<SeoTab>("serp");
  const [title, setTitle] = useState("Building Scalable Content Pipelines with Next.js 16 & OpenPost");
  const [description, setDescription] = useState(
    "Discover how block-based AST authoring, automatic WebP media conversion, and edge caching deliver type-safe publishing with zero lock-in."
  );
  const [copied, setCopied] = useState(false);

  const titleLength = title.length;
  const descLength = description.length;

  const isTitleGood = titleLength >= 30 && titleLength <= 65;
  const isDescGood = descLength >= 80 && descLength <= 160;

  const jsonLdCode = `{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${title.replace(/"/g, '\\"')}",
  "description": "${description.replace(/"/g, '\\"')}",
  "image": "https://cdn.openpost.app/media/hero-cover.webp",
  "author": {
    "@type": "Person",
    "name": "Sarah Chen",
    "url": "https://myblog.com/authors/sarah-chen"
  },
  "publisher": {
    "@type": "Organization",
    "name": "OpenPost Publication",
    "logo": {
      "@type": "ImageObject",
      "url": "https://myblog.com/logo.png"
    }
  },
  "datePublished": "2026-09-01T12:00:00Z",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://myblog.com/blog/scalable-content-pipelines"
  }
}`;

  const copyJsonLd = () => {
    navigator.clipboard.writeText(jsonLdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="seo" className="bg-white py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12 items-center">
          {/* LEFT SIDE: Interactive SERP & Schema Synthesizer Card */}
          <div className="lg:col-span-7">
            <div className="card-glass-specular rounded-2xl overflow-hidden shadow-2xl shadow-navy/10 border border-border bg-white">
              {/* Studio Header Bar */}
              <div className="flex flex-wrap items-center justify-between border-b border-border bg-[#F9FAFB] px-4 py-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-1 text-xs font-mono font-bold text-navy">
                    openpost.seo/synthesizer
                  </span>
                  <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-mono font-bold hidden sm:inline-block">
                    100/100 SEO Score
                  </span>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-lg bg-surface-dim p-0.5 border border-border text-xs font-semibold">
                    <button
                      onClick={() => setActiveTab("serp")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeTab === "serp" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                      }`}
                    >
                      Google SERP
                    </button>
                    <button
                      onClick={() => setActiveTab("opengraph")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeTab === "opengraph" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                      }`}
                    >
                      OpenGraph Card
                    </button>
                    <button
                      onClick={() => setActiveTab("jsonld")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeTab === "jsonld" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                      }`}
                    >
                      Schema.org
                    </button>
                  </div>

                  {activeTab === "jsonld" && (
                    <button
                      onClick={copyJsonLd}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-navy hover:bg-surface-raised transition shadow-xs"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body: Live Output */}
              <div className="p-4 sm:p-6 bg-white min-h-[380px] flex flex-col justify-between">
                {/* Tab 1: Google SERP Preview */}
                {activeTab === "serp" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-text-tertiary font-mono">
                      <span>Google Search Result Snippet</span>
                      <span className="text-emerald-600 font-bold">Canonical Verified</span>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-[#FCFCF9] space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs text-text-tertiary font-mono">
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand/20 text-brand font-bold text-[10px]">
                          OP
                        </div>
                        <div className="flex items-center gap-1 truncate text-[11px]">
                          <span className="text-slate-800 font-semibold">myblog.com</span>
                          <span>›</span>
                          <span>blog</span>
                          <span>›</span>
                          <span>scalable-content-pipelines</span>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-medium text-[#1A0DAB] hover:underline cursor-pointer leading-snug line-clamp-1">
                        {title || "Untitled Post — OpenPost"}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#4D5156] leading-relaxed line-clamp-2">
                        {description || "Add a meta description to see the search snippet preview live."}
                      </p>

                      <div className="pt-2 flex items-center gap-4 text-[11px] text-text-tertiary font-mono">
                        <span>Sept 1, 2026</span>
                        <span>•</span>
                        <span>Author: Sarah Chen</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">Rich Snippet ✓</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Social OpenGraph Card (Twitter/LinkedIn) */}
                {activeTab === "opengraph" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-text-tertiary font-mono">
                      <span>Twitter &amp; LinkedIn Card (1200 × 630)</span>
                      <span className="text-cyan-600 font-bold">Auto WebP</span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-md">
                      {/* Social Image Header */}
                      <div className="p-6 bg-gradient-to-br from-[#1E242E] via-[#12161D] to-[#0A0D12] text-white border-b border-slate-800 relative">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-brand/20 border border-brand/40 px-2.5 py-0.5 text-[10px] font-bold text-brand font-mono">
                            OpenPost Publication
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">6 min read</span>
                        </div>
                        <h4 className="mt-4 text-base sm:text-lg font-extrabold text-slate-100 line-clamp-2 leading-snug">
                          {title}
                        </h4>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                          <span>By Sarah Chen</span>
                          <span>•</span>
                          <span>Architecture &amp; Cloud</span>
                        </div>
                      </div>

                      {/* Card Lower Bar */}
                      <div className="p-3 bg-[#FAF9F5] flex items-center justify-between text-xs">
                        <div>
                          <p className="font-mono text-[11px] text-text-tertiary">myblog.com</p>
                          <p className="text-xs text-navy font-semibold line-clamp-1 mt-0.5">{title}</p>
                        </div>
                        <Share2 className="h-4 w-4 text-brand shrink-0" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Schema.org JSON-LD Tree */}
                {activeTab === "jsonld" && (
                  <div className="h-full space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-text-tertiary font-mono">
                      <span>Structured Data Markup</span>
                      <span className="text-emerald-600 font-bold">Valid Schema.org</span>
                    </div>

                    <pre className="overflow-x-auto custom-scrollbar text-xs font-mono text-navy leading-relaxed p-4 bg-[#F9FAFB] rounded-xl border border-border max-h-72">
                      <code>{jsonLdCode}</code>
                    </pre>
                  </div>
                )}

                {/* Bottom Card Telemetry */}
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-tertiary">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <Check className="h-3.5 w-3.5" /> Canonical Head Inject
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-navy">
                      <Zap className="h-3.5 w-3.5 text-brand" /> Lossless WebP/AVIF
                    </span>
                  </div>
                  <span className="font-mono text-text-tertiary">
                    Schema.org v3.1
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Clean Editorial Text Content & Interactive Customizer */}
          <div className="lg:col-span-5 space-y-6">
            <FadeIn>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-bold text-navy">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span>SEO Architecture &amp; Media Pipeline</span>
              </div>

              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-navy tracking-tight leading-tight">
                Build search-ready content by default.
              </h2>

              <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
                Automatic Schema.org JSON-LD generation, canonical URLs, OpenGraph social cards, and lossless WebP/AVIF media transcoding out of the box.
              </p>

              {/* Interactive Live Metadata Editor */}
              <div className="mt-6 space-y-3 p-4 rounded-2xl border border-border bg-[#FCFCF9]">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-bold text-navy">SEO Meta Title</label>
                    <span className={`font-mono text-[11px] font-bold ${isTitleGood ? "text-emerald-600" : "text-brand"}`}>
                      {titleLength}/60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none shadow-2xs font-medium"
                    placeholder="Enter article title..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-bold text-navy">Meta Description</label>
                    <span className={`font-mono text-[11px] font-bold ${isDescGood ? "text-emerald-600" : "text-brand"}`}>
                      {descLength}/155 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none shadow-2xs font-medium leading-relaxed"
                    placeholder="Enter meta description..."
                  />
                </div>
              </div>

              {/* 3 Technical Value Checkpoints */}
              <div className="mt-5 space-y-2 pt-2 border-t border-border text-xs text-navy font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Automatic 301 redirects on article slug modifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Cloudflare R2 EXIF metadata stripping &amp; WebP optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Search-engine compliant Schema.org JSON-LD microdata</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}


