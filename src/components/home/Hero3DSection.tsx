"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  Star,
  CheckCircle2,
  Zap,
  Play,
  Layers,
  Database,
  Shield,
} from "lucide-react";
import { FadeIn, ScaleIn } from "@/components/motion";
import { HeroCanvas3D } from "./HeroCanvas3D";

export function Hero3DSection() {
  const [realStats, setRealStats] = useState<{ posts: number; categories: number; tags: number; authors: number }>({
    posts: 0,
    categories: 0,
    tags: 0,
    authors: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/posts?limit=100").then((r) => r.json()).catch(() => ({})),
      fetch("/api/v1/categories").then((r) => r.json()).catch(() => ({})),
      fetch("/api/v1/tags").then((r) => r.json()).catch(() => ({})),
      fetch("/api/v1/authors").then((r) => r.json()).catch(() => ({})),
    ]).then(([p, c, t, a]) => {
      setRealStats({
        posts: Array.isArray(p.data) ? p.data.length : (p.meta?.total ?? 0),
        categories: Array.isArray(c.data) ? c.data.length : 0,
        tags: Array.isArray(t.data) ? t.data.length : 0,
        authors: Array.isArray(a.data) ? a.data.length : 0,
      });
    });
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FEFBF6] via-white to-surface-dim pt-12 pb-20 md:pt-18 md:pb-28 border-b border-border">
      {/* Lightweight Ambient Grid Background */}
      <HeroCanvas3D />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Release Pill */}
        <FadeIn delay={0} className="mb-6 flex justify-center">
          <div className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-white px-4 py-1.5 text-sm font-semibold text-navy shadow-xs transition hover:border-brand hover:bg-[#FFFBF5]">
            <span className="flex h-2 w-2 relative">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span>OpenPost 1.4 — Next-Gen Block CMS &amp; Headless Studio</span>
            <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-bold text-navy">
              MIT License
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-text-tertiary transition group-hover:translate-x-0.5 group-hover:text-brand" />
          </div>
        </FadeIn>

        {/* Main Headline */}
        <FadeIn delay={0.1}>
          <h1 className="text-center text-3xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold leading-[1.12] tracking-tight text-navy">
            Write with clarity.
            <br />
            <span className="gradient-text-brand">
              Publish at maximum speed.
            </span>
          </h1>
        </FadeIn>

        {/* Subtitle */}
        <FadeIn delay={0.15}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base sm:text-lg leading-relaxed text-text-secondary">
            A professional blogging CMS with a Notion-smooth block editor,
            automated WebP media pipeline, real-time SEO intelligence, and a
            high-speed headless API for modern web applications.
          </p>
        </FadeIn>

        {/* CTA Buttons */}
        <FadeIn delay={0.2}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-navy px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-navy/15 transition hover:bg-navy-dark hover:scale-[1.02]"
            >
              Start Writing Free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#interactive-editor"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-7 py-3.5 text-sm font-bold text-navy transition hover:bg-surface-raised hover:border-border-hover shadow-xs"
            >
              <Play className="h-4 w-4 text-brand fill-brand" />
              Live Interactive Studio
            </a>

            <a
              href="https://github.com/OfficialOpenPost/OpenPost.git"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3.5 text-sm font-semibold text-text-secondary transition hover:text-navy hover:bg-surface-raised"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </FadeIn>

        {/* Compact & Crisp Studio Preview Card */}
        <ScaleIn delay={0.25} className="mt-14 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border bg-white shadow-xl shadow-navy/5 overflow-hidden">
            {/* Top Window Bar */}
            <div className="flex items-center justify-between border-b border-border bg-[#F9FAFB] px-4 py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 font-mono text-xs text-text-tertiary">
                  openpost.app/studio/my-article
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Synced
                </span>
                <span className="text-text-tertiary">|</span>
                <span className="font-mono text-text-secondary flex items-center gap-1">
                  <Zap className="h-3 w-3 text-brand" /> 18ms Latency
                </span>
              </div>
            </div>

            {/* Split Preview Grid: Small Image + Highlights */}
            <div className="p-5 sm:p-6 grid gap-6 md:grid-cols-12 items-center bg-white">
              {/* Compact Image Card */}
              <div className="md:col-span-5 relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-border shadow-xs">
                <Image
                  src="/images/hero_3d_mockup.jpg"
                  alt="OpenPost Studio Preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  priority
                  className="object-cover"
                />
              </div>

              {/* Right Side Overview Pills */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider text-brand">
                    Writing Studio Engine
                  </span>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-sm font-bold">
                    SEO Score 98/100
                  </span>
                </div>

                <h3 className="text-lg font-bold text-navy leading-snug">
                  Block-based ergonomics with automatic WebP media optimization
                </h3>

                <p className="text-sm text-text-secondary leading-relaxed">
                  Type <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-brand font-bold">/</code> to insert headings, code snippets, interactive polls, and media. Structured JSON storage eliminates XSS risks.
                </p>

                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-surface-raised border border-border px-2.5 py-1 text-text-secondary font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Tiptap Core
                  </span>
                  <span className="rounded-lg bg-surface-raised border border-border px-2.5 py-1 text-text-secondary font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Auto WebP/AVIF
                  </span>
                  <span className="rounded-lg bg-surface-raised border border-border px-2.5 py-1 text-text-secondary font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Headless REST API
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScaleIn>

        {/* Real Stats Row from Database */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 max-w-4xl mx-auto">
          {[
            { value: `${realStats.posts} Articles`, label: "Published in Database", sub: "Live Prisma count" },
            { value: `${realStats.categories} Categories`, label: "Taxonomies Active", sub: "Nested category trees" },
            { value: "16+", label: "Content Block Types", sub: "Code, Polls, Tables, FAQs" },
            { value: "100%", label: "Free & Open Source", sub: "MIT License on GitHub" },
          ].map((stat, i) => (
            <FadeIn key={stat.label} delay={0.08 * i}>
              <div className="rounded-xl border border-border bg-white p-4 text-center shadow-xs">
                <p className="text-2xl sm:text-3xl font-extrabold text-navy">{stat.value}</p>
                <p className="mt-0.5 text-xs font-bold text-text-primary">{stat.label}</p>
                <p className="text-[11px] text-text-tertiary mt-0.5">{stat.sub}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
