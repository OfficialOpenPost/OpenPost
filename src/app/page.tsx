"use client";

import Link from "next/link";
import {
  ArrowRight,
  Play,
  Check,
  Globe,
  Code2,
  Layers,
  Search,
  Image,
  Clock,
  Users,
  BarChart3,
  FileText,
  Terminal,
  Rocket,
  Database,
  Cloud,
  GitBranch,
  Eye,
  Sparkles,
  MessageSquare,
  LayoutGrid,
  ListTree,
  PanelTop,
  Download,
  ChevronRight,
  Star,
  ArrowUpRight,
  Zap,
  Shield,
  PenLine,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem, ScaleIn } from "@/components/motion";
import { useState, useEffect } from "react";

export default function Home() {
  const [recent, setRecent] = useState<Array<{ id: string; title: string; slug: string; publishedAt?: string; readingTime?: number; category?: string }>>([]);
  const [statsReal, setStatsReal] = useState<{ posts: number; categories: number } | null>(null);
  useEffect(() => {
    fetch("/api/v1/posts?limit=6").then(r=>r.json()).then(j=>{ if(Array.isArray(j.data)) setRecent(j.data.slice(0,6)); }).catch(()=>{});
    Promise.all([fetch("/api/v1/posts?limit=1").then(r=>r.json()).catch(()=>({})), fetch("/api/v1/categories").then(r=>r.json()).catch(()=>({}))]).then(([p,c])=>{
      const posts = Array.isArray(p.data) ? p.data.length : 0;
      const cats = Array.isArray(c.data) ? c.data.length : 0;
      if(posts || cats) setStatsReal({ posts, categories: cats });
    });
  }, []);
  return (
    <div className="overflow-hidden">
      {/* ============================================================
          SECTION 1 — HERO
      ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FEA611] via-[#FE990E] to-[#FE4F01]">
        {/* 3D grid + radial highlights */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(45,52,64,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(45,52,64,0.15) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[700px] w-[900px] rounded-full bg-white/25 blur-[80px]" />
        <div className="absolute -bottom-32 -left-20 h-[500px] w-[600px] rounded-full bg-[#2D3440]/10 blur-[90px]" />
        <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-white/20 blur-[70px]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/30 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-12 md:pt-16">
          <FadeIn delay={0} className="mb-10 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2D3440]/10 bg-white/80 backdrop-blur px-5 py-2.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2D3440] opacity-20" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2D3440]" />
              </span>
              <span className="text-sm font-semibold text-[#2D3440]">
                Open Source — MIT License
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-[#2D3440]" />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-center text-[3rem] font-bold leading-[1.08] tracking-tight text-[#2D3440] sm:text-5xl md:text-7xl lg:text-[5.5rem] drop-shadow-[0_2px_20px_rgba(255,255,255,0.35)]">
              Write. Publish.
              <br />
              <span className="bg-gradient-to-r from-[#2D3440] to-[#2D3440]/80 bg-clip-text text-transparent">Scale your content.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-[#2D3440]/80 md:text-xl">
              A professional blog CMS and writing studio with a block-based
              editor, SEO tools, media management, and a headless API — deploy
              anywhere with Supabase, Cloudflare, and Vercel.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-[#2D3440] px-9 py-4 text-sm font-bold text-white shadow-xl shadow-[#2D3440]/20 transition hover:bg-[#1a1f2e] hover:shadow-2xl hover:-translate-y-0.5"
              >
                Start Writing Free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#github"
                className="inline-flex items-center gap-2.5 rounded-xl border border-[#2D3440]/15 bg-white/80 backdrop-blur px-9 py-4 text-sm font-bold text-[#2D3440] transition hover:bg-white hover:shadow-md"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                Star on GitHub
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="mt-16 flex flex-col items-center gap-6">
              <div className="flex -space-x-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-[#FEA611] to-[#FE4F01] shadow-md"
                  />
                ))}
              </div>
              <p className="text-sm text-[#2D3440]/70">
                Trusted by{" "}
                <span className="font-semibold text-[#2D3440]">
                  2,400+
                </span>{" "}
                content teams ·{" "}
                <span className="inline-flex items-center gap-1 text-[#2D3440] font-semibold">
                  <Star className="h-3 w-3 fill-[#2D3440]" /> 4.2k stars
                </span>
              </p>
            </div>
          </FadeIn>

          <ScaleIn delay={0.55}>
            <div className="mx-auto mt-24 max-w-5xl overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900/60 shadow-2xl shadow-brand/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-slate-700/40 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-slate-800/60 px-3 py-1.5 text-xs text-slate-500">
                  openpost.app/editor/my-first-post
                </div>
              </div>
              <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6">
                <div className="flex h-full gap-4">
                  <div className="hidden w-52 flex-col gap-2 rounded-lg bg-slate-800/30 p-3 md:flex">
                    <div className="h-6 w-24 rounded bg-slate-700/50" />
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 rounded-md bg-brand/15 px-2.5 py-2">
                        <div className="h-3 w-3 rounded bg-brand/50" />
                        <div className="h-3 w-20 rounded bg-brand/30" />
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-2">
                        <div className="h-3 w-3 rounded bg-slate-700/40" />
                        <div className="h-3 w-16 rounded bg-slate-700/30" />
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-2">
                        <div className="h-3 w-3 rounded bg-slate-700/40" />
                        <div className="h-3 w-14 rounded bg-slate-700/30" />
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-2">
                        <div className="h-3 w-3 rounded bg-slate-700/40" />
                        <div className="h-3 w-18 rounded bg-slate-700/30" />
                      </div>
                    </div>
                    <div className="mt-auto space-y-1.5">
                      <div className="h-3 w-16 rounded bg-slate-700/30" />
                      <div className="h-3 w-12 rounded bg-slate-700/30" />
                    </div>
                  </div>
                  <div className="flex-1 rounded-lg bg-slate-800/20 p-6">
                    <div className="mx-auto max-w-lg space-y-4">
                      <div className="h-8 w-3/5 rounded bg-slate-700/40" />
                      <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-slate-700/30" />
                        <div className="h-3 w-full rounded bg-slate-700/30" />
                        <div className="h-3 w-4/5 rounded bg-slate-700/30" />
                      </div>
                      <div className="h-36 rounded-lg border border-slate-700/30 bg-slate-700/10" />
                      <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-slate-700/30" />
                        <div className="h-3 w-3/4 rounded bg-slate-700/30" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-5 w-16 rounded-full bg-brand/15" />
                        <div className="h-5 w-20 rounded-full bg-slate-700/20" />
                        <div className="h-5 w-14 rounded-full bg-slate-700/20" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 2 — STATS BAR
      ============================================================ */}
      <section className="border-b border-border bg-surface py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { num: "16+", label: "Content Blocks" },
              { num: "99.99%", label: "Uptime SLA" },
              { num: "&lt;50ms", label: "Editor Latency" },
              { num: "MIT", label: "Open Source License" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand sm:text-4xl">
                    {stat.num}
                  </p>
                  <p className="mt-1 text-sm text-text-tertiary">
                    {stat.label}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
           RECENT POSTS — REAL DATA (was hardcoded, now live from /api/v1/posts)
       ============================================================ */}
       <section className="bg-surface py-12 border-y border-border">
         <div className="mx-auto max-w-7xl px-6">
           <div className="flex items-end justify-between gap-4">
             <div>
               <p className="text-xs font-bold uppercase tracking-widest text-brand">Live from your CMS</p>
               <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy">Latest posts — real data</h2>
               <p className="mt-1 text-sm text-text-secondary">Pulled from <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs">GET /api/v1/posts?limit=6</code> · {recent.length ? `${recent.length} posts` : "No published posts yet"} {statsReal ? `· ${statsReal.posts} total · ${statsReal.categories} categories` : ""}</p>
             </div>
             <Link href="/blog" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-flame">View blog <ArrowRight className="h-4 w-4" /></Link>
           </div>
           {recent.length===0 ? (
             <div className="mt-8 rounded-2xl border-2 border-dashed border-border bg-surface-raised p-10 text-center">
               <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"><FileText className="h-5 w-5" /></div>
               <p className="mt-3 text-sm font-semibold text-navy">No published posts yet</p>
               <p className="mt-1 text-sm text-text-secondary">Create your first post in the editor — it will appear here and at <code className="font-mono text-xs">/blog</code> instantly.</p>
               <Link href="/dashboard/editor" className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-navy">Start writing <PenLine className="h-4 w-4" /></Link>
             </div>
           ) : (
             <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               {recent.map((post)=>(
                 <Link key={post.id} href={`/blog/${post.slug}`} className="group rounded-2xl border border-border bg-surface p-5 hover:border-brand/20 hover:shadow-md hover:-translate-y-0.5 transition">
                   <div className="flex items-center gap-2 text-xs"><span className="rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand">{post.category ?? "General"}</span><span className="text-text-tertiary flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime ?? 5} min</span></div>
                   <h3 className="mt-3 text-base font-bold leading-tight text-navy group-hover:text-brand line-clamp-2">{post.title}</h3>
                   <p className="mt-1 font-mono text-xs text-text-tertiary">/{post.slug}</p>
                   <p className="mt-3 text-xs text-text-tertiary">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Published"}</p>
                 </Link>
               ))}
             </div>
           )}
         </div>
       </section>

      {/* ============================================================
           SECTION 3 — TRUST BAR
       ============================================================ */}
       <section className="bg-surface-raised py-10">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            Deployed on
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
            {["Vercel", "Supabase", "Cloudflare", "Railway", "Fly.io", "Docker"].map(
              (name) => (
                <span
                  key={name}
                  className="text-lg font-bold tracking-tight text-text-tertiary/40 transition hover:text-text-tertiary/70"
                >
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4 — PROBLEM / SOLUTION
      ============================================================ */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-5xl px-6">
          <FadeIn>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-flame">
                Why OpenPost?
              </p>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
                Existing tools force you to choose:
              </h2>
              <p className="mt-4 text-2xl font-bold text-text-tertiary">
                simplicity <span className="text-text-tertiary/30 mx-3">or</span>{" "}
                power.
              </p>
            </div>
          </FadeIn>

          <Stagger className="mt-14 grid gap-6 sm:grid-cols-3" stagger={0.15}>
            {[
              {
                icon: FileText,
                iconColor: "text-flame",
                bgColor: "bg-flame/10",
                tool: "Generic Editors",
                problem:
                  "No structured content, no SEO, no publishing pipeline",
              },
              {
                icon: Layers,
                iconColor: "text-brand",
                bgColor: "bg-brand/10",
                tool: "WordPress",
                problem: "Plugin bloat, security headaches, slow without expertise",
              },
              {
                icon: Database,
                iconColor: "text-orange",
                bgColor: "bg-orange/10",
                tool: "Enterprise CMS",
                problem: "Overkill complexity, weeks to onboard, $$$ pricing",
              },
            ].map((item) => (
              <StaggerItem key={item.tool}>
                <div className="group rounded-2xl border border-border bg-surface-raised p-8 text-center transition hover:border-brand/20 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1">
                  <div
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${item.bgColor} ${item.iconColor} transition group-hover:bg-brand group-hover:text-white`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-text-primary">
                    {item.tool}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {item.problem}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.4}>
            <div className="mx-auto mt-14 max-w-lg rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
              <p className="text-lg font-bold text-text-primary">
                OpenPost gives you{" "}
                <span className="text-brand">both</span> — simplicity and
                power, without compromise.
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Block-based editor · Structured content · SEO tools · Headless
                API · Deploy on Supabase + Cloudflare + Vercel
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 5 — PRODUCT OVERVIEW (3 Layers)
      ============================================================ */}
      <section id="product" className="bg-surface-raised py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                The Platform
              </p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                Three layers.
                <br />
                One seamless experience.
              </h2>
            </div>
          </FadeIn>

          <Stagger className="mt-16 grid gap-8 md:grid-cols-3" stagger={0.15}>
            {[
              {
                num: "01",
                title: "Writing Studio",
                desc: "A rich, block-based editor with the writing ergonomics of Google Docs, the structural clarity of Notion, and autosave that never loses your work.",
                tags: ["Rich Text", "Blocks", "Autosave", "Images"],
                icon: FileText,
                iconBg: "from-brand to-brand/80",
              },
              {
                num: "02",
                title: "CMS Management",
                desc: "Dashboard, categories, tags, authors, scheduling, SEO metadata, and revision history — everything to organize and publish professionally.",
                tags: ["Dashboard", "SEO", "Scheduling", "Tags"],
                icon: LayoutGrid,
                iconBg: "from-brand to-orange",
              },
              {
                num: "03",
                title: "Delivery API",
                desc: "A versioned, headless, cache-friendly API that serves only published content — so any frontend can consume your content reliably.",
                tags: ["REST API", "Versioned", "Cached", "Public"],
                icon: Code2,
                iconBg: "from-orange to-flame",
              },
            ].map((layer) => (
              <StaggerItem key={layer.num}>
                <div className="group relative rounded-2xl border border-border bg-surface p-8 transition hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand/40">
                      {layer.num}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br group-hover:scale-110 transition-transform duration-300" style={{ background: `linear-gradient(135deg, #FEA611 0%, #FE990E 50%, #FE4F01 100%)` }}>
                      <layer.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-text-primary">
                    {layer.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {layer.desc}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {layer.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-surface-overlay px-3 py-1 text-xs font-medium text-text-secondary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============================================================
          SECTION 6 — HOW IT WORKS
      ============================================================ */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                How It Works
              </p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                From idea to published
                <br />
                in three steps.
              </h2>
            </div>
          </FadeIn>

          <div className="relative mt-20 hidden lg:block">
            <div className="absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-brand/30 via-orange/30 to-flame/30" />
          </div>

          <Stagger className="grid gap-12 lg:grid-cols-3" stagger={0.2}>
            {[
              {
                step: "1",
                title: "Write in the editor",
                desc: "Open the editor, start typing. Use slash commands to insert images, galleries, polls, tables, and more. Autosave handles the rest.",
              },
              {
                step: "2",
                title: "Organize and optimize",
                desc: "Set categories, tags, and featured images. Run the SEO panel for meta descriptions, OG tags, and structured warnings.",
              },
              {
                step: "3",
                title: "Deploy or self-host",
                desc: "Deploy to Vercel with Supabase + Cloudflare, or run in Docker. The headless API serves your content to any frontend.",
              },
            ].map((s, i) => (
              <StaggerItem key={s.step}>
                <div className="relative text-center">
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, #FEA611 0%, #FE990E 50%, #FE4F01 100%)`,
                    }}
                  >
                    {s.step}
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-text-primary">
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-xs mx-auto text-sm leading-relaxed text-text-secondary">
                    {s.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============================================================
          SECTION 7 — FEATURES GRID
      ============================================================ */}
      <section id="features" className="bg-surface-raised py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                Features
              </p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                Everything you need.
                <br />
                Nothing you don&apos;t.
              </h2>
              <p className="mt-6 text-lg text-text-secondary">
                Every feature is designed for one purpose: making writing,
                organizing, and publishing blog content better.
              </p>
            </div>
          </FadeIn>

          <Stagger className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
            {[
              {
                title: "Block-Based Editor",
                desc: "Insert any content type with the slash menu — text, images, galleries, polls, FAQs, code blocks, and more.",
                icon: LayoutGrid,
                iconColor: "brand",
              },
              {
                title: "Autosave & Recovery",
                desc: "Debounced autosave, offline support, and crash recovery — your work is never lost.",
                icon: Clock,
                iconColor: "orange",
              },
              {
                title: "SEO Panel",
                desc: "Meta descriptions, OG tags, canonical URLs, and structured warnings to keep your content optimized.",
                icon: Search,
                iconColor: "flame",
              },
              {
                title: "Media Pipeline",
                desc: "Upload images and get automatic WebP/AVIF conversion, responsive variants, and thumbnails — zero config.",
                icon: Image,
                iconColor: "brand",
              },
              {
                title: "Headless API",
                desc: "A versioned, cache-friendly REST API serving only published content — build any frontend on top.",
                icon: Code2,
                iconColor: "orange",
              },
              {
                title: "Roles & Permissions",
                desc: "Owner, Admin, Editor, Author, Contributor — granular role-based access for teams of any size.",
                icon: Users,
                iconColor: "brand",
              },
              {
                title: "Scheduled Publishing",
                desc: "Set a future date and time — your post publishes automatically via background job.",
                icon: Rocket,
                iconColor: "flame",
              },
              {
                title: "Revision History",
                desc: "Every meaningful change is checkpointed. Restore any previous version safely.",
                icon: GitBranch,
                iconColor: "orange",
              },
              {
                title: "Categories & Tags",
                desc: "Organize content with categories (single-level nesting) and flat tags for flexible taxonomies.",
                icon: ListTree,
                iconColor: "brand",
              },
            ].map((f) => (
              <StaggerItem key={f.title}>
                <div className="group rounded-2xl border border-border bg-surface p-7 transition hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-white">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-text-primary">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {f.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============================================================
           SECTION 8 — EDITOR SHOWCASE (Light with 3D gradient, dark only footer)
       ============================================================ */}
       <section className="relative bg-white py-20 overflow-hidden">
         <div className="absolute -top-32 -right-32 h-[500px] w-[600px] rounded-full bg-gradient-to-br from-[#FEA611]/12 to-[#FE4F01]/10 blur-[60px]" />
         <div className="absolute -bottom-20 -left-20 h-[400px] w-[500px] rounded-full bg-[#FE990E]/8 blur-[50px]" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <FadeIn direction="right">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[#FE4F01]">
                  The Editor
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-navy md:text-5xl">
                  A writing experience
                  <br />
                  your team will love.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                  Built on Tiptap (ProseMirror), the OpenPost editor combines the
                  familiarity of Word/Docs with structured content that&apos;s safe
                  to render, version, and deliver headlessly.
                </p>

                <div className="mt-10 space-y-6">
                  {[
                    {
                      title: "Slash Commands",
                      desc: "Type / to insert any block type — no mouse required.",
                    },
                    {
                      title: "Structured JSON Content",
                      desc: "No raw HTML, no XSS risk, no broken rendering — schema-enforced on every save.",
                    },
                    {
                      title: "Shared Render Package",
                      desc: "Preview and public site use the same components — what you see is what you get.",
                    },
                    {
                      title: "Keyboard Shortcuts",
                      desc: "Ctrl+B, Ctrl+I, Ctrl+K — all the shortcuts you already know work perfectly.",
                    },
                    {
                      title: "Version History",
                      desc: "Every meaningful change is checkpointed. Restore any version safely.",
                    },
                  ].map((ef) => (
                    <div key={ef.title} className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FEA611]/12 text-[#2D3440] border border-[#FEA611]/20">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-navy">
                          {ef.title}
                        </h4>
                        <p className="mt-1 text-sm text-text-secondary">{ef.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <ScaleIn>
              <div className="relative rounded-2xl border border-border bg-white p-1 shadow-xl shadow-[#FEA611]/10">
                <div className="rounded-xl bg-[#FCFCF9] p-6 border border-border">
                  <div className="flex items-center gap-1 rounded-lg bg-white border border-border px-3 py-2 shadow-sm">
                    <div className="flex gap-1">
                      {["B", "I", "U", "S"].map((b) => (
                        <div
                          key={b}
                          className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-slate-500 transition hover:bg-slate-700/50 hover:text-white"
                        >
                          {b}
                        </div>
                      ))}
                    </div>
                    <div className="mx-2 h-4 w-px bg-slate-700" />
                    <div className="flex gap-1">
                      {["H1", "H2", "H3"].map((h) => (
                        <div
                          key={h}
                          className="flex h-7 items-center rounded px-2 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-700/50 hover:text-white"
                        >
                          {h}
                        </div>
                      ))}
                    </div>
                    <div className="mx-2 h-4 w-px bg-slate-700" />
                    <div className="flex gap-1">
                      {["ul", "ol", "check"].map((l) => (
                        <div
                          key={l}
                          className="flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-slate-700/50 hover:text-white"
                        >
                          <div className="h-3 w-3 rounded-sm border border-current" />
                        </div>
                      ))}
                    </div>
                    <div className="mx-2 h-4 w-px bg-slate-700" />
                    <div className="flex gap-1">
                      {["img", "link", "code"].map((i) => (
                        <div
                          key={i}
                          className="flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-slate-700/50 hover:text-white"
                        >
                          <div className="h-3 w-3 rounded border border-current" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 space-y-4 px-4 py-4">
                    <div className="h-7 w-3/5 rounded bg-slate-700/50" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-slate-700/30" />
                      <div className="h-3 w-full rounded bg-slate-700/30" />
                      <div className="h-3 w-4/5 rounded bg-slate-700/30" />
                    </div>
                    <div className="rounded-lg border border-slate-700/30 bg-slate-800/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-brand/20" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 w-1/3 rounded bg-slate-700/40" />
                          <div className="h-2 w-1/2 rounded bg-slate-700/30" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-slate-700/30" />
                      <div className="h-3 w-3/4 rounded bg-slate-700/30" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-5 w-16 rounded-full bg-brand/15" />
                      <div className="h-5 w-10 rounded-full bg-slate-700/25" />
                      <div className="h-5 w-20 rounded-full bg-slate-700/25" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-700/30 px-4 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      <span className="text-[10px] text-slate-500">Saved</span>
                    </div>
                    <span className="text-[10px] text-slate-600">
                      1,247 words · 5 min read
                    </span>
                  </div>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 9 — DASHBOARD SHOWCASE
      ============================================================ */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <ScaleIn>
              <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-xl">
                <div className="rounded-xl bg-surface p-6">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-36 rounded bg-text-primary/10" />
                    <div className="h-8 w-24 rounded-lg bg-brand/10" />
                  </div>
                  <div className="mt-6 grid grid-cols-4 gap-3">
                    {[
                      { label: "Published", value: "127", color: "bg-success/10 text-success" },
                      { label: "Drafts", value: "14", color: "bg-brand/10 text-brand" },
                      { label: "Scheduled", value: "6", color: "bg-orange/10 text-orange" },
                      { label: "Trash", value: "3", color: "bg-flame/10 text-flame" },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-lg p-3 ${s.color.split(" ")[0]}`}>
                        <p className={`text-2xl font-bold ${s.color.split(" ")[1]}`}>{s.value}</p>
                        <p className="text-[10px] text-text-tertiary">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 space-y-2.5">
                    {[
                      { title: "10 Tips for Better SEO", status: "Published", time: "2h ago" },
                      { title: "Getting Started Guide", status: "Draft", time: "5h ago" },
                      { title: "Weekly Roundup #42", status: "Scheduled", time: "Tomorrow" },
                      { title: "Interview: Jane Doe", status: "Published", time: "1d ago" },
                      { title: "Product Update v2.1", status: "Draft", time: "2d ago" },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-surface-overlay transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-surface-overlay" />
                          <div>
                            <p className="text-xs font-medium text-text-primary">{row.title}</p>
                            <p className="text-[10px] text-text-tertiary">{row.time}</p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            row.status === "Published"
                              ? "bg-success/10 text-success"
                              : row.status === "Draft"
                              ? "bg-brand/10 text-brand"
                              : "bg-orange/10 text-orange"
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScaleIn>

            <FadeIn direction="left">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                  Dashboard
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                  Your content
                  <br />
                  pipeline at a glance.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                  See drafts, published posts, scheduled content, and trash — all
                  in one view. Search, filter, sort, and paginate through hundreds
                  of posts in seconds.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    "Real-time status counts and activity feed",
                    "Full-text search across title, content, and slug",
                    "Filter by status, category, tag, and author",
                    "Bulk actions: delete, change status, assign category",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm text-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ============================================================
           SECTION 10 — API SHOWCASE (Light, 3D gradient — dark only footer)
       ============================================================ */}
       <section className="relative bg-white py-20 overflow-hidden">
         <div className="absolute -top-20 right-0 h-[400px] w-[500px] rounded-full bg-gradient-to-br from-[#FEA611]/10 to-[#FE4F01]/8 blur-[50px]" />
         <div className="absolute -bottom-20 left-0 h-[300px] w-[400px] rounded-full bg-[#FE990E]/8 blur-[40px]" />
         <div className="mx-auto max-w-7xl px-6 relative">
           <div className="grid items-center gap-16 lg:grid-cols-2">
             <FadeIn direction="right">
               <div>
                 <p className="text-sm font-semibold uppercase tracking-widest text-[#FE4F01]">
                   Headless API
                 </p>
                 <h2 className="mt-4 text-4xl font-bold tracking-tight text-navy md:text-5xl">
                   Build any frontend.
                   <br />
                   We handle the content.
                 </h2>
                 <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                   A versioned, cache-friendly REST API serving only published
                   content. Cursor-based pagination, aggressive HTTP caching, and
                   rate limiting — production-ready from day one.
                 </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { label: "Response Time", value: "&lt;100ms" },
                    { label: "Cache Hit Rate", value: "99.2%" },
                    { label: "Uptime SLA", value: "99.99%" },
                    { label: "Rate Limit", value: "10k/min" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-border bg-white p-4 shadow-sm"
                    >
                      <p
                        className="text-2xl font-bold text-[#2D3440]"
                        dangerouslySetInnerHTML={{ __html: stat.value }}
                      />
                      <p className="mt-1 text-xs text-text-tertiary">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <ScaleIn>
              <div className="overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900/80 shadow-2xl">
                <div className="rounded-xl bg-[#1a1f2e] p-6">
                  <div className="flex items-center gap-2 border-b border-slate-700/40 pb-4">
                    <span className="rounded bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                      GET
                    </span>
                    <code className="text-xs text-slate-400">
                      /api/v1/posts?limit=10
                    </code>
                  </div>
                  <pre className="mt-4 overflow-x-auto text-[11px] leading-relaxed text-slate-400">
                    <code>{`{
  "data": [
    {
      "id": "a1b2c3d4",
      "title": "10 Tips for Better SEO",
      "slug": "10-tips-for-better-seo",
      "status": "published",
      "publishedAt": "2026-08-30T10:00:00Z",
      "readingTime": 5,
      "author": {
        "name": "Priya Sharma",
        "slug": "priya-sharma"
      },
      "category": { "name": "SEO" },
      "tags": ["seo", "marketing"]
    }
  ],
  "meta": {
    "cursor": "eyJpZCI6...",
    "hasMore": true,
    "total": 127
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 11 — BLOCK TYPES
      ============================================================ */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                Content Blocks
              </p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                16+ block types.
                <br />
                Infinite compositions.
              </h2>
              <p className="mt-6 text-lg text-text-secondary">
                Type{" "}
                <code className="rounded bg-surface-overlay px-1.5 py-0.5 font-mono text-sm text-brand">
                  /
                </code>{" "}
                to insert any block. Each block renders identically in editor,
                preview, and public frontend.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 mt-12" stagger={0.06}>
            {[
              { name: "Text", desc: "Rich paragraph with inline formatting", icon: FileText, iconStyle: "bg-brand/10 text-brand" },
              { name: "Heading", desc: "H2–H4 with anchor links", icon: PanelTop, iconStyle: "bg-orange/10 text-orange" },
              { name: "Image", desc: "5 layout modes + caption", icon: Image, iconStyle: "bg-brand/10 text-brand" },
              { name: "Gallery", desc: "Grid or carousel", icon: LayoutGrid, iconStyle: "bg-orange/10 text-orange" },
              { name: "Quote", desc: "Blockquote + attribution", icon: MessageSquare, iconStyle: "bg-brand/10 text-brand" },
              { name: "Callout", desc: "Info / warning / success", icon: Sparkles, iconStyle: "bg-orange/10 text-orange" },
              { name: "Table", desc: "Header row + cell formatting", icon: LayoutGrid, iconStyle: "bg-brand/10 text-brand" },
              { name: "Poll", desc: "Single or multi-choice voting", icon: BarChart3, iconStyle: "bg-flame/10 text-flame" },
              { name: "Code", desc: "Language + syntax highlight", icon: Terminal, iconStyle: "bg-orange/10 text-orange" },
              { name: "Embed", desc: "YouTube / Vimeo / social", icon: Globe, iconStyle: "bg-brand/10 text-brand" },
              { name: "FAQ", desc: "Schema.org FAQ structured data", icon: ListTree, iconStyle: "bg-orange/10 text-orange" },
              { name: "Button", desc: "Primary / secondary CTA", icon: ArrowUpRight, iconStyle: "bg-brand/10 text-brand" },
              { name: "Divider", desc: "Horizontal rule", icon: PanelTop, iconStyle: "bg-orange/10 text-orange" },
              { name: "Download", desc: "File with size + type", icon: Download, iconStyle: "bg-flame/10 text-flame" },
              { name: "Accordion", desc: "Collapsible sections", icon: Layers, iconStyle: "bg-brand/10 text-brand" },
              { name: "Video", desc: "Upload or external URL", icon: Play, iconStyle: "bg-orange/10 text-orange" },
            ].map((block) => (
              <StaggerItem key={block.name}>
                <div className="group flex flex-col items-center rounded-xl border border-border bg-surface p-5 text-center transition h-full hover:border-brand/20 hover:shadow-md hover:-translate-y-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${block.iconStyle} transition group-hover:bg-brand group-hover:!text-white`}>
                    <block.icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-text-primary">
                    {block.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-text-tertiary">{block.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============================================================
          SECTION 12 — DEPLOY ANYWHERE (Open Source)
      ============================================================ */}
      <section className="bg-surface-raised py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <FadeIn direction="right">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                  Deploy Anywhere
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                  Your data.
                  <br />
                  Your infrastructure.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                  OpenPost is open source under the MIT license. Deploy to Vercel
                  with Supabase + Cloudflare R2, run on Railway or Fly.io, or
                  self-host with Docker. You own everything.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
                  {[
                    { icon: Cloud, label: "Vercel + Supabase", desc: "Recommended stack" },
                    { icon: Globe, label: "Cloudflare R2", desc: "Free egress storage" },
                    { icon: Database, label: "PostgreSQL", desc: "Supabase or self-hosted" },
                    { icon: Shield, label: "Docker", desc: "Full self-host option" },
                  ].map((d) => (
                    <div key={d.label} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <d.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {d.label}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {d.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <ScaleIn>
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
                <div className="rounded-xl bg-surface-raised p-6">
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <Terminal className="h-3.5 w-3.5 text-brand" />
                    <span>Terminal</span>
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-lg bg-navy p-5 text-[12px] leading-relaxed text-slate-300">
                    <code>{`# Deploy to Vercel + Supabase
npx create-openpost --template vercel

# Or run with Docker
docker compose up -d

# Or self-host with Node.js
npm install
npm run db:migrate
npm run build
npm run start`}</code>
                  </pre>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["MIT License", "Self-hosted", "No vendor lock-in"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 13 — SECURITY & RELIABILITY
      ============================================================ */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <FadeIn direction="right">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                  Security &amp; Reliability
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                  Built to be
                  <br />
                  trustworthy.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                  Content stored as structured JSON, not raw HTML. Every endpoint
                  verified server-side. Autosave with crash recovery. Your work is
                  never lost.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-6">
                  {[
                    { icon: Shield, title: "Structured JSON", desc: "No raw HTML — eliminates XSS risk" },
                    { icon: Eye, title: "Server-Side Auth", desc: "Every endpoint verified" },
                    { icon: Clock, title: "Autosave + Recovery", desc: "IndexedDB cache" },
                    { icon: Cloud, title: "Signed Upload URLs", desc: "No client credentials" },
                  ].map((sf) => (
                    <div key={sf.title} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <sf.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">
                          {sf.title}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {sf.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-2 gap-4" stagger={0.15}>
              {[
                { num: "99.99%", label: "Uptime" },
                { num: "&lt;50ms", label: "Editor Latency" },
                { num: "256-bit", label: "Encryption" },
                { num: "30 days", label: "Trash Retention" },
              ].map((stat) => (
                <StaggerItem key={stat.label}>
                  <div className="rounded-2xl border border-border bg-surface p-6 text-center transition hover:shadow-lg hover:shadow-brand/5">
                    <p className="text-3xl font-bold text-brand" dangerouslySetInnerHTML={{ __html: stat.num }} />
                    <p className="mt-1 text-sm font-bold text-text-primary">
                      {stat.label}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 14 — TEAMS / PERSONAS
      ============================================================ */}
      <section className="bg-surface-raised py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                For Teams
              </p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                From solo writer to
                <br />
                content agency.
              </h2>
            </div>
          </FadeIn>

          <Stagger className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
            {[
              {
                name: "Priya",
                role: "Independent Blogger",
                initial: "P",
                desc: "Not technical. Wants a Word-like experience with autosave that just works.",
                grad: "from-brand to-orange",
              },
              {
                name: "Marcus",
                role: "SEO / Content Marketer",
                initial: "M",
                desc: "Publishes 3–5 posts/week. Needs categories, tags, scheduling, and SEO control.",
                grad: "from-orange to-flame",
              },
              {
                name: "Dana",
                role: "Freelance Developer",
                initial: "D",
                desc: "Builds custom frontends. Wants a headless CMS with a clean API.",
                grad: "from-flame to-brand",
              },
              {
                name: "Owen",
                role: "Agency Ops Lead",
                initial: "O",
                desc: "Manages authors and clients. Needs roles/permissions for teams.",
                grad: "from-brand to-flame",
              },
            ].map((p) => (
              <StaggerItem key={p.name}>
                <div className="rounded-2xl border border-border bg-surface p-6 text-center transition hover:shadow-lg hover:-translate-y-1">
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.grad} text-white text-lg font-bold`}>
                    {p.initial}
                  </div>
                  <h3 className="mt-4 text-base font-bold text-text-primary">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-brand">
                    {p.role}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {p.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============================================================
          SECTION 15 — TESTIMONIALS
      ============================================================ */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                What People Say
              </p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                Loved by writers
                <br />
                and developers alike.
              </h2>
            </div>
          </FadeIn>

          <Stagger className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={0.12}>
            {[
              {
                name: "Sarah Chen",
                role: "Content Lead at Vercel",
                quote:
                  "OpenPost is the first CMS where our writers actually enjoy writing. The editor is fast, the autosave is bulletproof, and the API just works.",
              },
              {
                name: "James Rodriguez",
                role: "Freelance Developer",
                quote:
                  "I switched from WordPress for three projects. The headless API saved me weeks of work. Predictable schema, no plugin headaches.",
              },
              {
                name: "Aisha Patel",
                role: "SEO Manager at Linear",
                quote:
                  "The SEO panel catches things I would have missed. Meta descriptions, alt text, heading structure — game changer for our team.",
              },
              {
                name: "Tom Wilson",
                role: "Solo Blogger",
                quote:
                  "I lost three blog posts to Google Docs crashes. The autosave and revision history mean I never worry about losing work.",
              },
              {
                name: "Maria Santos",
                role: "Agency Founder",
                quote:
                  "Role-based permissions are exactly what we needed. Clients write drafts, my team publishes. No more messy handoffs.",
              },
              {
                name: "David Kim",
                role: "CTO at Cal.com",
                quote:
                  "We evaluated Sanity, Contentful, and Strapi. The block editor is best-in-class, and structured JSON sold us on security.",
              },
            ].map((t) => (
              <StaggerItem key={t.name}>
                <div className="rounded-2xl border border-border bg-surface p-7 transition hover:shadow-lg hover:-translate-y-1">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-brand text-brand" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange text-sm font-bold text-white">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">
                        {t.name}
                      </p>
                      <p className="text-xs text-text-tertiary">{t.role}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============================================================
          SECTION 16 — FINAL CTA
      ============================================================ */}
      <section className="relative bg-navy py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-flame/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <FadeIn>
            <h2 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
              Ready to write something
              <br />
              <span className="text-brand">remarkable?</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
              Join thousands of writers and teams who trust OpenPost. Open
              source, deploy anywhere, no vendor lock-in.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-brand px-9 py-4 text-sm font-bold text-navy shadow-lg shadow-brand/25 transition hover:bg-brand-hover"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#github"
                className="inline-flex items-center gap-2.5 rounded-xl border border-slate-600 px-9 py-4 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                View Source Code
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-600">
              Free &amp; open source · MIT License · Deploy in under 5 minutes
            </p>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
