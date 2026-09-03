"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Zap,
  Play,
  Layers,
  Database,
  Code2,
  FileText,
  BarChart3,
  Copy,
  Check,
  Eye,
  Box,
  Cpu,
  Globe,
} from "lucide-react";
import { FadeIn, ScaleIn } from "@/components/motion";
import { HeroCanvas3D } from "./HeroCanvas3D";

export function Hero3DSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [pollVoted, setPollVoted] = useState<string | null>(null);
  const [pollCounts, setPollCounts] = useState({ headless: 84, decoupled: 26 });

  const containerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const isHovered = useRef(false);


  // 60fps smooth 3D tilt calculation
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

  const copyCode = () => {
    navigator.clipboard.writeText(`const { data } = await openpost.posts.get("modern-web");`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePollVote = (option: "headless" | "decoupled") => {
    if (pollVoted) return;
    setPollVoted(option);
    setPollCounts((prev) => ({
      ...prev,
      [option]: prev[option] + 1,
    }));
  };

  const rotateX = mousePos.y * -14;
  const rotateY = mousePos.x * 16;

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
            <span className="gradient-text-brand">
              Publish at maximum speed.
            </span>
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

        {/* CTA Buttons & 3D Mode Toggle */}
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
            <div
              onClick={() => {
                navigator.clipboard.writeText("npx openpost-cli init my-blog");
                setCopiedCli(true);
                setTimeout(() => setCopiedCli(false), 2000);
              }}
              className="group cursor-pointer inline-flex items-center gap-3 rounded-xl border border-[#2D3440] bg-[#12161D] px-4 py-2 text-xs font-mono text-slate-300 shadow-lg shadow-navy/10 transition hover:border-brand/60 hover:bg-[#1A202C]"
            >
              <span className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">$</span>
                <span className="text-slate-100 font-medium">npx openpost-cli init my-blog</span>
              </span>
              <button
                type="button"
                className="flex items-center gap-1 rounded bg-[#2D3440] px-2 py-0.5 text-[10px] font-bold text-slate-300 group-hover:text-white group-hover:bg-brand group-hover:text-navy transition"
              >
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
              </button>
            </div>
          </div>
        </FadeIn>

        {/* 3D SPATIAL CONTENT CANVAS */}
        <ScaleIn delay={0.24} className="mt-12 sm:mt-16 max-w-5xl mx-auto">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="perspective-1200 relative w-full py-4 transition-transform duration-300 ease-out"
          >
            {/* 3D Spatial Canvas Container */}
            <div
              className="preserve-3d relative w-full rounded-2xl border border-border/80 bg-white/95 shadow-2xl shadow-navy/10 transition-transform duration-300 ease-out"
              style={{
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              }}
            >
              {/* Studio Window Title Bar */}
              <div className="flex items-center justify-between border-b border-border bg-[#F9FAFB] px-4 py-3 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono text-xs text-text-tertiary hidden sm:inline">
                    openpost.app/studio/spatial-canvas
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Cloud Studio
                  </span>
                  <span className="text-text-tertiary">|</span>
                  <span className="rounded bg-brand/10 border border-brand/20 px-2 py-0.5 font-mono text-[11px] font-bold text-navy">
                    Type-Safe AST
                  </span>
                </div>
              </div>

              {/* Main Document Canvas Surface */}
              <div className="p-5 sm:p-8 bg-white rounded-b-2xl relative min-h-[380px] sm:min-h-[440px]">
                {/* Layer: Presentation UI & Document Content */}
                <div>
                  {/* Document Header Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border text-xs text-text-secondary">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-brand/15 px-2.5 py-0.5 font-bold text-navy text-[11px]">
                        Engineering &amp; Architecture
                      </span>
                      <span className="text-text-tertiary">·</span>
                      <span>5 min read</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Published to API
                      </span>
                    </div>
                  </div>

                  {/* Editor Document Content */}
                  <div className="mt-6 max-w-2xl space-y-4">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-navy tracking-tight leading-snug">
                      Building Modern Publishing Workflows with OpenPost
                    </h2>

                    <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                      OpenPost turns editorial writing into structured, reusable content blocks.
                      By storing documents as validated ProseMirror AST nodes instead of arbitrary HTML,
                      content renders with complete security and ultra-fast edge delivery.
                    </p>

                    <div className="p-3.5 rounded-xl bg-surface-dim border border-border flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 font-mono text-text-secondary">
                        <span className="h-2 w-2 rounded-full bg-brand" />
                        <span>Slash Commands: Type <code className="bg-white border border-border px-1.5 py-0.5 rounded text-brand font-bold">/</code> to insert media, polls, or code</span>
                      </div>
                      <span className="font-semibold text-navy shrink-0 hidden md:inline">Tiptap Core</span>
                    </div>
                  </div>
                </div>

                {/* 3D FLOATING SATELLITE NODES */}
                {/* Node 1: Code Block Node (Top Right) */}
                <div
                  className="hidden lg:block absolute -top-6 -right-6 w-80 rounded-xl border border-border bg-[#FAF9F5] p-3.5 shadow-xl shadow-navy/10 transition-transform duration-200"
                  style={{
                    transform: `translateZ(55px) translateX(${mousePos.x * 14}px) translateY(${mousePos.y * 14}px)`,
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-navy">
                      <Code2 className="h-3.5 w-3.5 text-brand" />
                      <span>Headless SDK</span>
                    </div>
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-1 text-[11px] font-semibold text-text-tertiary hover:text-navy transition"
                    >
                      {copiedCode ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      {copiedCode ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="mt-2 text-[11px] font-mono text-navy leading-relaxed overflow-x-auto custom-scrollbar">
                    <code>{`const { data } = await\n  openpost.posts.get("modern-web");`}</code>
                  </pre>
                </div>

                {/* Node 2: Live Poll Node (Bottom Right) */}
                <div
                  className="hidden lg:block absolute -bottom-6 -right-4 w-76 rounded-xl border border-border bg-white p-3.5 shadow-xl shadow-navy/10 transition-transform duration-200"
                  style={{
                    transform: `translateZ(65px) translateX(${mousePos.x * 18}px) translateY(${mousePos.y * 18}px)`,
                  }}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-navy pb-2 border-b border-border">
                    <BarChart3 className="h-3.5 w-3.5 text-[#FE4F01]" />
                    <span>Interactive Poll Block</span>
                  </div>
                  <p className="mt-2 text-[11px] text-text-secondary font-medium">
                    Publishing architecture preference:
                  </p>
                  <div className="mt-2 space-y-1.5 text-xs">
                    <button
                      onClick={() => handlePollVote("headless")}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition ${
                        pollVoted === "headless"
                          ? "border-brand bg-brand/10 font-bold text-navy"
                          : "border-border bg-surface-dim hover:bg-surface-raised text-text-primary"
                      }`}
                    >
                      <span>Headless API</span>
                      <span className="font-mono text-[11px] text-text-tertiary">
                        {Math.round((pollCounts.headless / (pollCounts.headless + pollCounts.decoupled)) * 100)}%
                      </span>
                    </button>
                    <button
                      onClick={() => handlePollVote("decoupled")}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition ${
                        pollVoted === "decoupled"
                          ? "border-brand bg-brand/10 font-bold text-navy"
                          : "border-border bg-surface-dim hover:bg-surface-raised text-text-primary"
                      }`}
                    >
                      <span>Decoupled SSR</span>
                      <span className="font-mono text-[11px] text-text-tertiary">
                        {Math.round((pollCounts.decoupled / (pollCounts.headless + pollCounts.decoupled)) * 100)}%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Node 3: Structured Schema Node (Bottom Left) */}
                <div
                  className="hidden lg:block absolute -bottom-5 -left-4 w-72 rounded-xl border border-border bg-[#F9FAFB] p-3 shadow-xl shadow-navy/10 transition-transform duration-200"
                  style={{
                    transform: `translateZ(45px) translateX(${mousePos.x * -12}px) translateY(${mousePos.y * -12}px)`,
                  }}
                >
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-navy pb-1.5 border-b border-border">
                    <Database className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Schema.org JSON-LD</span>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-text-secondary space-y-0.5">
                    <div className="text-brand font-semibold">&quot;@type&quot;: &quot;BlogPosting&quot;,</div>
                    <div>&quot;headline&quot;: &quot;Building Modern Publishing...&quot;,</div>
                    <div>&quot;inLanguage&quot;: &quot;en-US&quot;,</div>
                    <div className="text-emerald-700 font-semibold">&quot;datePublished&quot;: &quot;2026-09-01&quot;</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScaleIn>
      </div>
    </section>
  );
}


