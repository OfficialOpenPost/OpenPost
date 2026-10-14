"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Check,
  Copy,
  Play,
  Gauge,
  RefreshCw,
  Zap,
  CheckCircle2,
  Sparkles,
  PenLine,
  Send,
  Braces,
  Globe,
  Command,
  Layers,
} from "lucide-react";
import { FadeIn, ScaleIn } from "@/components/motion";
import { HeroCanvas3D } from "./HeroCanvas3D";

/* Floating glass chips that annotate the hero illustration */
interface FloatChipProps {
  className: string;
  delay?: string;
  reverse?: boolean;
  children: React.ReactNode;
}

function FloatChip({ className, delay = "0s", reverse = false, children }: FloatChipProps) {
  return (
    <div className={`pointer-events-none absolute z-20 ${className}`}>
      <div
        className={`${reverse ? "animate-subtle-float-reverse" : "animate-subtle-float"}`}
        style={{ animationDelay: delay }}
      >
        <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/85 px-3 py-2 shadow-xl shadow-navy/10 backdrop-blur-md">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Hero3DSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [copiedCli, setCopiedCli] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const isHovered = useRef(false);

  /* 60fps smooth 3D parallax tilt for the illustration */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isHovered.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setMousePos({ x, y });
    });
  }, []);

  const handleMouseEnter = () => {
    isHovered.current = true;
  };

  const handleMouseLeave = () => {
    isHovered.current = false;
    setMousePos({ x: 0, y: 0 });
  };

  const copyCli = () => {
    navigator.clipboard.writeText("npx openpost-cli init my-blog");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const rotateX = mousePos.y * -9;
  const rotateY = mousePos.x * 11;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FEFBF6] via-white to-surface-dim pt-12 pb-20 md:pt-18 md:pb-28 border-b border-border">
      {/* 3D Interactive Particle & Perspective Horizon */}
      <HeroCanvas3D />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Release Pill */}
        <FadeIn delay={0} className="mb-6 flex justify-center">
          <div className="group inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-navy shadow-xs transition hover:border-brand hover:bg-[#FFFBF5]">
            <span className="flex h-2 w-2 relative">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span className="truncate max-w-[210px] sm:max-w-none">
              OpenPost 1.4 — Next-Gen Block CMS &amp; Headless Studio
            </span>
            <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-navy hidden xs:inline-block">
              MIT License
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-text-tertiary transition group-hover:translate-x-0.5 group-hover:text-brand" />
          </div>
        </FadeIn>

        {/* Main Headline */}
        <FadeIn delay={0.08}>
          <h1 className="text-center text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold leading-[1.12] tracking-tight text-navy">
            Write with clarity.
            <br />
            <span className="gradient-text-brand">Publish at maximum speed.</span>
          </h1>
        </FadeIn>

        {/* Subtitle */}
        <FadeIn delay={0.14}>
          <p className="mx-auto mt-5 max-w-2xl text-center text-sm sm:text-base md:text-lg leading-relaxed text-text-secondary">
            A professional open-source CMS with a Notion-smooth block editor,
            automated WebP media pipeline, structured JSON storage, and a
            high-speed headless API for modern web applications.
          </p>
        </FadeIn>

        {/* CTA Buttons */}
        <FadeIn delay={0.2}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-navy px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-navy/15 transition hover:bg-navy-dark hover:scale-[1.02]"
            >
              Start Writing Free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#interactive-editor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3.5 text-sm font-bold text-navy transition hover:bg-surface-raised hover:border-border-hover shadow-xs"
            >
              <Play className="h-4 w-4 text-brand fill-brand" />
              Live Interactive Studio
            </a>

            <a
              href="https://github.com/OfficialOpenPost/OpenPost.git"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3.5 text-sm font-semibold text-text-secondary transition hover:text-navy hover:bg-surface-raised"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>

          {/* Quick CLI Quickstart Box */}
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={copyCli}
              aria-label="Copy CLI command"
              className="group cursor-pointer inline-flex items-center gap-3 rounded-xl border border-[#2D3440] bg-[#12161D] px-4 py-2 text-xs font-mono text-slate-300 shadow-lg shadow-navy/10 transition hover:border-brand/60 hover:bg-[#1A202C]"
            >
              <span className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">$</span>
                <span className="text-slate-100 font-medium">npx openpost-cli init my-blog</span>
              </span>
              <span className="flex items-center gap-1 rounded bg-[#2D3440] px-2 py-0.5 text-[10px] font-bold text-slate-300 group-hover:text-white group-hover:bg-brand group-hover:text-navy transition">
                {copiedCli ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </FadeIn>

        {/* HERO ILLUSTRATION — animated 3D parallax centerpiece */}
        <ScaleIn delay={0.24} className="mt-12 sm:mt-16 max-w-5xl mx-auto">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="perspective-1200 relative w-full py-6"
          >
            {/* Aurora glow behind the illustration */}
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-brand/20 via-flame/10 to-brand/15 blur-3xl opacity-70 animate-pulse-soft pointer-events-none" />

            {/* Tilt group (illustration + chips move together) */}
            <div
              className="preserve-3d relative w-full transition-transform duration-300 ease-out"
              style={{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}
            >
              {/* SIDE-BY-SIDE ILLUSTRATION: Block Editor → Publish → Live Article */}
              <div className="grid gap-3 sm:gap-4 md:grid-cols-[1fr_auto_1fr] items-stretch">

                {/* LEFT: Block Editor illustration */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-xl shadow-navy/10">
                  {/* Window chrome */}
                  <div className="flex items-center justify-between border-b border-border bg-[#F9FAFB] px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="font-mono text-[10px] text-text-tertiary">block-editor</span>
                    <span className="flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                      <RefreshCw className="h-2.5 w-2.5" /> Saved
                    </span>
                  </div>

                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 border-b border-border bg-white px-3 py-1.5">
                    {["B", "I", "U", "H1", "H2"].map((t) => (
                      <span key={t} className="flex h-5 min-w-5 items-center justify-center rounded bg-surface-dim px-1 text-[9px] font-bold text-text-secondary">
                        {t}
                      </span>
                    ))}
                    <span className="h-3 w-px bg-border mx-0.5" />
                    <span className="flex items-center gap-0.5 rounded bg-brand/15 border border-brand/30 px-1.5 py-0.5 text-[9px] font-bold text-navy">
                      <Command className="h-2.5 w-2.5" /> Slash
                    </span>
                  </div>

                  {/* Document body */}
                  <div className="relative p-3 bg-white min-h-[168px]">
                    <div className="h-3 w-4/5 rounded bg-navy/85" />
                    <div className="mt-2.5 space-y-1.5">
                      <div className="h-1.5 w-full rounded bg-border" />
                      <div className="h-1.5 w-11/12 rounded bg-border" />
                      <div className="h-1.5 w-9/12 rounded bg-border" />
                    </div>

                    {/* Embedded media thumbnail (CSS art) */}
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-[#FCFCF9] p-2">
                      <div className="h-8 w-12 shrink-0 rounded bg-gradient-to-br from-brand/60 to-flame/50" />
                      <div className="flex-1 space-y-1">
                        <div className="h-1.5 w-3/4 rounded bg-border" />
                        <div className="h-1.5 w-1/2 rounded bg-border" />
                      </div>
                    </div>

                    {/* Floating slash-command menu */}
                    <div className="absolute right-2.5 bottom-2.5 w-32 rounded-lg border border-border bg-white p-1 shadow-xl shadow-navy/15 animate-subtle-float">
                      <p className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-text-tertiary">Insert</p>
                      {[
                        { icon: Layers, label: "Gallery" },
                        { icon: PenLine, label: "Callout" },
                        { icon: Braces, label: "Code" },
                      ].map((o) => (
                        <div key={o.label} className="flex items-center gap-1.5 rounded px-1.5 py-1 text-[10px] font-semibold text-navy hover:bg-surface-dim">
                          <o.icon className="h-2.5 w-2.5 text-brand" /> {o.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Editor footer */}
                  <div className="flex items-center justify-between border-t border-border bg-[#F9FAFB] px-3 py-1.5 text-[9px] text-text-tertiary">
                    <span className="font-mono">1,480 words</span>
                    <span className="flex items-center gap-1 font-bold text-navy"><Gauge className="h-2.5 w-2.5 text-brand" /> SEO 98</span>
                  </div>
                </div>

                {/* CENTER: animated publish flow */}
                <div className="hidden md:flex flex-col items-center justify-center gap-1.5 py-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white shadow-lg shadow-navy/20 animate-pulse-soft">
                    <Send className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Publish</span>
                  {/* animated dashed connector */}
                  <span className="h-16 w-0.5 bg-gradient-to-b from-brand via-flame to-transparent" />
                  <span className="flex items-center gap-1 rounded-full bg-brand/15 border border-brand/30 px-2 py-0.5 text-[9px] font-bold text-navy">
                    <Zap className="h-2.5 w-2.5" /> 24ms
                  </span>
                </div>

                {/* RIGHT: Live published article + API illustration */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-xl shadow-navy/10">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 border-b border-border bg-[#F9FAFB] px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="flex-1 truncate rounded bg-white border border-border px-1.5 py-0.5 font-mono text-[9px] text-text-tertiary">
                      myblog.com/<span className="text-brand font-bold">modern-web
                    </span>
                    </span>
                  </div>

                  {/* Published article */}
                  <div className="p-3 bg-white min-h-[168px]">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[8px] font-bold text-navy">ARCHITECTURE</span>
                      <span className="text-[9px] text-text-tertiary">5 min read</span>
                    </div>
                    <div className="mt-2 h-3 w-full rounded bg-navy/85" />
                    <div className="mt-1.5 h-3 w-3/5 rounded bg-navy/85" />

                    {/* Hero image (CSS art) */}
                    <div className="mt-2.5 h-14 w-full rounded-lg bg-gradient-to-br from-navy via-navy-light to-[#1E242E] relative overflow-hidden">
                      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(rgba(254,166,17,0.5) 1px, transparent 1px)", backgroundSize: "8px 8px" }} />
                      <span className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white/90">Modern Publishing</span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      <div className="h-1.5 w-full rounded bg-border" />
                      <div className="h-1.5 w-10/12 rounded bg-border" />
                    </div>

                    {/* SEO + perf badges */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Indexable
                      </span>
                      <span className="flex items-center gap-1 rounded bg-brand/10 border border-brand/25 px-1.5 py-0.5 text-[9px] font-bold text-navy">
                        <Globe className="h-2.5 w-2.5" /> Edge CDN
                      </span>
                    </div>
                  </div>

                  {/* Live API response footer */}
                  <div className="border-t border-border bg-[#0D1117] px-3 py-2 font-mono text-[9px] leading-relaxed">
                    <span className="text-emerald-400">200 OK</span>
                    <span className="text-slate-600"> · </span>
                    <span className="text-brand">GET /api/v1/posts</span>
                    <div className="text-slate-400 truncate">{'{ "status": "published" }'}</div>
                  </div>
                </div>
              </div>

              {/* Floating context chips — SEO score (top left) */}
              <FloatChip className="-top-4 -left-3 sm:-left-6" delay="0s">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-navy">
                  <Gauge className="h-4 w-4 text-brand" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                    SEO Score
                  </span>
                  <span className="block text-sm font-extrabold text-navy">98/100</span>
                </span>
              </FloatChip>

              {/* Autosave (top right) */}
              <FloatChip className="-top-5 right-0 sm:-right-6" delay="1.2s" reverse>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <RefreshCw className="h-4 w-4" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-extrabold text-navy">Autosaved</span>
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    2s debounce
                  </span>
                </span>
              </FloatChip>

              {/* Edge latency (bottom left) */}
              <FloatChip className="bottom-3 -left-3 sm:-left-8" delay="0.6s">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FE4F01]/12 text-[#FE4F01]">
                  <Zap className="h-4 w-4" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-extrabold text-navy">24ms</span>
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                    Edge response
                  </span>
                </span>
              </FloatChip>

              {/* Published status (bottom right) */}
              <FloatChip className="bottom-4 right-0 sm:-right-8" delay="1.8s" reverse>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-extrabold text-navy">Published</span>
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                    16+ block types
                  </span>
                </span>
              </FloatChip>
            </div>
          </div>
        </ScaleIn>

        {/* Trust strip under the illustration */}
        <FadeIn delay={0.35}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
              <Sparkles className="h-3.5 w-3.5 text-brand" /> No credit card required
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Self-host or cloud
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
              <Zap className="h-3.5 w-3.5 text-[#FE4F01]" /> Deploy in 5 minutes
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
