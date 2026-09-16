"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import {
  Target,
  Zap,
  Shield,
  Heart,
  Users,
  Globe,
  ArrowRight,
  Sparkles,
  Code2,
  BookOpen,
  Rocket,
  Lock,
  Pencil,
  Layers,
  GitBranch,
  CheckCircle2,
} from "lucide-react";

const timeline = [
  {
    year: "2025",
    title: "The frustration",
    desc: "Existing CMS tools forced a choice: simplicity or power. We wanted both — and we wanted to own our data.",
    icon: Pencil,
  },
  {
    year: "2025",
    title: "Open-source launch",
    desc: "Released under MIT license. Supabase for auth & Postgres, Cloudflare R2 for media, Next.js for the frontend.",
    icon: Rocket,
  },
  {
    year: "2026",
    title: "Cloud & CLI",
    desc: "Launched managed cloud (openpost.app) and openpost-cli for one-command blog scaffolding.",
    icon: Layers,
  },
  {
    year: "2026",
    title: "What's next",
    desc: "Multi-language support, collaborative editing, plugin system, and a theme marketplace — all open-source.",
    icon: GitBranch,
  },
];

const features = [
  {
    icon: Zap,
    title: "Under 50ms latency",
    desc: "Tiptap editor with instant response. No loading spinners while you type. Autosave every 2 seconds with IndexedDB crash recovery.",
  },
  {
    icon: Shield,
    title: "5-tier RBAC",
    desc: "OWNER, ADMIN, EDITOR, AUTHOR, CONTRIBUTOR — server-enforced via Supabase RLS. No client-side trust.",
  },
  {
    icon: Globe,
    title: "Headless API",
    desc: "RESTful v1 API with project-scoped Bearer tokens. Build any frontend — Next.js, Astro, Svelte, or native apps.",
  },
  {
    icon: Lock,
    title: "SSRF & XSS protection",
    desc: "Webhook URL validation, private IP blocking, ProseMirror JSON AST (no raw HTML injection).",
  },
  {
    icon: Code2,
    title: "MIT licensed",
    desc: "Fork it, self-host it, modify it. No vendor lock-in. Your data lives in your Postgres and R2 bucket.",
  },
  {
    icon: BookOpen,
    title: "Structured content",
    desc: "Posts stored as ProseMirror JSON — portable, versionable, and renderer-agnostic. Export anytime.",
  },
];

const principles = [
  {
    title: "Writing first",
    desc: "Every feature passes one test: does this make writing, organizing, or publishing blog content better? If not, we don't build it.",
    color: "from-brand to-amber-500",
  },
  {
    title: "Own your data",
    desc: "Self-hosted means your Postgres, your R2 bucket, your server. Cloud means export in one click. No lock-in, ever.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Security by default",
    desc: "RLS on every table. Bearer tokens hashed with SHA-256. Rate limiting on sensitive endpoints. No shortcuts.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Small scope, deep quality",
    desc: "We're not a website builder, not a marketing suite, not an e-commerce platform. We're a blogging CMS — and we do it well.",
    color: "from-purple-500 to-pink-500",
  },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-navy overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(254,166,17,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(254,166,17,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 relative">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold text-brand">Our Story</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
              A CMS built by
              <br />
              <span className="text-brand">writers, for writers.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              OpenPost started with a simple frustration: existing tools force you to choose between
              simplicity and power. We built a CMS that gives you both — open-source, fast, and yours to own.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-bold text-navy hover:bg-brand-hover transition"
              >
                Start Writing Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-8 py-3.5 text-sm font-bold text-slate-300 hover:border-slate-500 hover:text-white transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Origin story */}
      <section className="bg-surface py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <FadeIn>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand">Why we built this</p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                  The blogging tools we wanted didn&apos;t exist.
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-text-secondary">
                  <p>
                    WordPress is powerful but bloated. Medium is elegant but proprietary. Ghost is great
                    until you hit the limits of their hosted offering. Every tool we tried came with a catch:
                    vendor lock-in, plugin sprawl, or a pricing model that penalizes growth.
                  </p>
                  <p>
                    We wanted something different: a fast, focused writing tool that stores content as
                    structured data (not locked-in HTML), runs on your own infrastructure, and has a clean
                    API for building custom frontends. So we built it.
                  </p>
                  <p>
                    OpenPost is the CMS we wished existed — now available to everyone under the MIT license.
                  </p>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="rounded-2xl border border-border bg-surface-raised p-8">
                  <div className="space-y-4">
                    {[
                      "Structured JSON content, not locked-in HTML",
                      "5-tier RBAC with Supabase RLS",
                      "Self-hosted or managed cloud",
                      "Headless API for any frontend",
                      "MIT licensed — fork and own it",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                        <span className="text-sm font-medium text-text-primary">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-2xl bg-brand/10 blur-2xl" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-surface-raised py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">Journey</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                From frustration to launch
              </h2>
              <p className="mt-4 text-base text-text-secondary">
                A short history of how OpenPost came to be.
              </p>
            </div>
          </FadeIn>
          <div className="mt-16 relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div
                    className={`relative flex items-start gap-8 ${
                      i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    <div className="hidden md:block md:w-1/2" />
                    <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-brand border-4 border-surface-raised z-10" />
                    <div className="ml-16 md:ml-0 md:w-1/2 md:px-8">
                      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-brand">{item.year}</span>
                            <h3 className="text-base font-bold text-text-primary">{item.title}</h3>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">Capabilities</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                What makes OpenPost different
              </h2>
              <p className="mt-4 text-base text-text-secondary">
                Every feature is designed for one purpose: professional blogging without compromise.
              </p>
            </div>
          </FadeIn>
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {features.map((f) => (
              <StaggerItem key={f.title}>
                <div className="group rounded-2xl border border-border bg-surface-raised p-7 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 transition hover:-translate-y-1 h-full">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-text-primary">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{f.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-surface-raised py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">Principles</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                What we stand for
              </h2>
              <p className="mt-4 text-base text-text-secondary">
                Four beliefs that guide every product decision we make.
              </p>
            </div>
          </FadeIn>
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2" stagger={0.1}>
            {principles.map((p) => (
              <StaggerItem key={p.title}>
                <div className="group relative rounded-2xl border border-border bg-white p-8 overflow-hidden hover:shadow-lg transition h-full">
                  <div
                    className={`absolute top-0 right-0 h-32 w-32 bg-gradient-to-br ${p.color} opacity-5 rounded-bl-[80px] group-hover:opacity-10 transition`}
                  />
                  <h3 className="text-lg font-bold text-text-primary">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{p.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Open source callout */}
      <section className="bg-surface py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <FadeIn>
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl border border-border bg-surface-raised p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text-primary">Open Source</h3>
                      <p className="text-xs text-text-tertiary">MIT Licensed</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Full source code on GitHub",
                      "Self-host in 5 minutes with Docker or Vercel",
                      "Contributions welcome — issues, PRs, docs",
                      "Transparent roadmap and changelog",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                        <span className="text-sm text-text-secondary">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="order-1 lg:order-2">
                <p className="text-sm font-semibold uppercase tracking-widest text-brand">
                  Community-driven
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                  Built in the open,
                  <br />
                  <span className="text-brand">for everyone.</span>
                </h2>
                <p className="mt-6 text-base leading-relaxed text-text-secondary">
                  OpenPost is open-source because we believe publishing tools should be transparent,
                  auditable, and owned by their users. No black boxes, no hidden telemetry, no bait-and-switch
                  licensing.
                </p>
                <p className="mt-4 text-base leading-relaxed text-text-secondary">
                  Whether you self-host or use our cloud, you get the same codebase. The only difference is who
                  manages the infrastructure.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">
                    MIT Licensed
                  </span>
                  <span className="rounded-full bg-surface-raised border border-border px-4 py-2 text-sm font-medium text-text-secondary">
                    Self-hostable
                  </span>
                  <span className="rounded-full bg-surface-raised border border-border px-4 py-2 text-sm font-medium text-text-secondary">
                    No vendor lock-in
                  </span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-navy py-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/10 blur-[100px]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Ready to own your publishing?
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Start writing in minutes. Free tier includes 1 project, unlimited posts, and full API access.
              No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-bold text-navy hover:bg-brand-hover transition"
              >
                Start Writing Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-8 py-3.5 text-sm font-bold text-slate-300 hover:border-slate-500 hover:text-white transition"
              >
                Talk to Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
