"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Sparkles,
  CheckCircle2,
  Globe,
  Share2,
  Activity,
  Zap,
} from "lucide-react";
import { FadeIn } from "@/components/motion";

export function SeoPerformance3D() {
  const [title, setTitle] = useState("10 Tips for High-Speed Blog Publishing with Headless CMS");
  const [description, setDescription] = useState(
    "Discover how next-gen block editors, automated WebP compression, and edge caching help content rank #1 on Google with sub-50ms latency."
  );

  const titleLength = title.length;
  const descLength = description.length;

  const isTitleGood = titleLength >= 30 && titleLength <= 65;
  const isDescGood = descLength >= 80 && descLength <= 160;

  return (
    <section id="seo" className="bg-white py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              SEO Engine &amp; Media Pipeline
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Rank #1 on Google by default.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Automatic Schema.org JSON-LD generation, OpenGraph metadata previews, and WebP/AVIF image transcoding.
            </p>
          </div>
        </FadeIn>

        {/* Small Thumbnail Architecture Banner */}
        <div className="mt-8 mx-auto max-w-4xl rounded-2xl border border-border bg-[#FCFCF9] p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
          <div className="relative h-20 w-32 shrink-0 rounded-xl overflow-hidden border border-border">
            <Image
              src="/images/seo_pipeline_3d.jpg"
              alt="SEO Optimization Engine"
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                <Activity className="h-3 w-3" /> 100/100 Lighthouse
              </span>
              <span className="rounded-full bg-brand/15 text-navy px-2 py-0.5 text-[10px] font-bold">
                Structured Schema.org
              </span>
            </div>
            <p className="mt-1 text-xs text-text-secondary font-medium">
              Google Rich Snippets, automated canonical headers, and social media image generation.
            </p>
          </div>
        </div>

        {/* Interactive SEO Simulator (Light Mode) */}
        <div className="mt-8 mx-auto max-w-5xl grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Real-time Editor Inputs */}
          <div className="lg:col-span-5 space-y-4 rounded-2xl border border-border bg-[#F9FAFB] p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              Meta &amp; SERP Customizer
            </h3>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-text-primary">SEO Meta Title</label>
                <span className={`font-mono text-[11px] ${isTitleGood ? "text-emerald-600 font-bold" : "text-brand"}`}>
                  {titleLength}/60 chars
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-text-primary">Meta Description</label>
                <span className={`font-mono text-[11px] ${isDescGood ? "text-emerald-600 font-bold" : "text-brand"}`}>
                  {descLength}/155 chars
                </span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-border space-y-1.5 text-xs text-text-secondary">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Canonical tag generated automatically
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> WebP 1200x630 OpenGraph card synthesized
              </div>
            </div>
          </div>

          {/* Right Column: Google SERP & Social Card Preview (100% Light Mode) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Google Search Result Preview */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-brand" /> Google Search SERP Preview
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800">
                  Rank #1 Ready
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[11px] text-text-tertiary font-mono">
                  <span>https://myblog.com</span>
                  <span>›</span>
                  <span>blog</span>
                  <span>›</span>
                  <span>10-tips-high-speed-cms</span>
                </div>
                <h4 className="text-base font-semibold text-blue-700 hover:underline cursor-pointer leading-tight line-clamp-1">
                  {title || "Untitled Post — OpenPost"}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {description || "Add a meta description to see live search snippet preview..."}
                </p>
              </div>
            </div>

            {/* Social Share Card Preview (Light Mode) */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-[#FE4F01]" /> Social OpenGraph Card
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-surface-dim">
                <div className="p-4 bg-gradient-to-r from-brand/20 to-flame/15 border-b border-border">
                  <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-navy shadow-xs">
                    OpenPost Publication
                  </span>
                  <h4 className="mt-2 text-sm font-bold text-navy line-clamp-1">{title}</h4>
                </div>
                <div className="p-3 bg-white">
                  <p className="font-mono text-[10px] text-text-tertiary">myblog.com</p>
                  <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
