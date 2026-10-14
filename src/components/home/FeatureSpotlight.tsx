"use client";

import Link from "next/link";
import {
  PenLine,
  ShieldCheck,
  Database,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Command,
  Gauge,
  RefreshCw,
  Braces,
  Timer,
  KeyRound,
  Globe,
  Layers,
  Lock,
  ScrollText,
  Server,
  Cloud,
  Container,
  Check,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

/**
 * Alternating side-by-side feature spotlights.
 *
 * Modern CMS marketing pages (Contentful, Strapi, Sanity) present feature details
 * in two-column rows — copy on one side, a supporting visual on the other — that
 * alternate left/right down the page. This is the "details side by side" layout.
 */

interface Spotlight {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  details: { icon: React.ComponentType<{ className?: string }>; text: string }[];
  link?: { label: string; href: string; external?: boolean };
  visual: React.ReactNode;
  accent: "brand" | "flame" | "emerald" | "indigo";
}

const accentStyles = {
  brand: {
    chip: "border-brand/25 bg-brand/10 text-navy",
    icon: "bg-brand/15 text-brand",
    check: "text-brand",
  },
  flame: {
    chip: "border-[#FE4F01]/25 bg-[#FE4F01]/10 text-navy",
    icon: "bg-[#FE4F01]/12 text-[#FE4F01]",
    check: "text-[#FE4F01]",
  },
  emerald: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: "bg-emerald-100 text-emerald-600",
    check: "text-emerald-600",
  },
  indigo: {
    chip: "border-indigo-200 bg-indigo-50 text-indigo-800",
    icon: "bg-indigo-100 text-indigo-600",
    check: "text-indigo-600",
  },
};

/* ----------------------------- Visual panels ----------------------------- */

function WindowChrome({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-2xl shadow-navy/10">
      <div className="flex items-center justify-between border-b border-border bg-[#F9FAFB] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="font-mono text-[11px] text-text-tertiary">{label}</span>
      </div>
      {children}
    </div>
  );
}

function EditorVisual() {
  return (
    <WindowChrome label="openpost-studio/draft.md">
      <div className="p-5 bg-white">
        <div className="flex flex-wrap items-center gap-1.5">
          {["H1", "H2", "B", "I", "Link", "Code", "Poll"].map((t) => (
            <span
              key={t}
              className="rounded-md border border-border bg-surface-dim px-2 py-1 text-[11px] font-bold text-text-secondary"
            >
              {t}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-700">
            <RefreshCw className="h-3 w-3" /> Autosaved
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-[#FCFCF9] p-4">
          <div className="h-3 w-2/3 rounded bg-navy/80" />
          <div className="mt-3 space-y-2">
            <div className="h-2 w-full rounded bg-border" />
            <div className="h-2 w-11/12 rounded bg-border" />
            <div className="h-2 w-4/5 rounded bg-border" />
          </div>

          {/* Slash command menu */}
          <div className="mt-4 w-full max-w-[220px] rounded-xl border border-border bg-white p-1.5 shadow-xl shadow-navy/10">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Insert block
            </p>
            {[
              { icon: Layers, label: "Code Block" },
              { icon: PenLine, label: "Callout" },
              { icon: Sparkles, label: "Featured Image" },
            ].map((o) => (
              <div
                key={o.label}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-navy hover:bg-surface-dim"
              >
                <o.icon className="h-3.5 w-3.5 text-brand" />
                {o.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary">
          <span className="font-mono">1,480 words · 5 min read</span>
          <span className="flex items-center gap-1 font-bold text-navy">
            <Gauge className="h-3.5 w-3.5 text-brand" /> SEO 98/100
          </span>
        </div>
      </div>
    </WindowChrome>
  );
}

function ApiVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-2xl shadow-navy/10">
      <div className="flex items-center gap-2 bg-[#12161D] px-4 py-3">
        <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
          GET
        </span>
        <span className="truncate font-mono text-xs text-slate-300">
          /api/v1/posts?limit=3
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 24ms
        </span>
      </div>
      <pre className="overflow-x-auto bg-[#0D1117] p-4 font-mono text-[11px] leading-relaxed text-emerald-300">
        <code>{`{
  "success": true,
  "data": [
    {
      "title": "Modern Publishing…",
      "slug": "modern-publishing",
      "status": "published",
      "author": { "name": "Sarah Chen" },
      "category": { "name": "Architecture" }
    }
  ],
  "pagination": { "total": 42 }
}`}</code>
      </pre>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-white px-4 py-2.5 text-[11px] text-text-tertiary">
        <span className="flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-brand" /> Bearer op_live_64hex
        </span>
        <span className="font-mono">cache: s-maxage=60</span>
      </div>
    </div>
  );
}

function RbacVisual() {
  const permissions = ["Create", "Edit others", "Publish", "Manage team", "Delete"];
  const matrix: Record<string, boolean[]> = {
    Owner: [true, true, true, true, true],
    Admin: [true, true, true, true, false],
    Editor: [true, true, true, false, false],
    Author: [true, false, false, false, false],
    Contributor: [true, false, false, false, false],
  };
  return (
    <WindowChrome label="access-control.matrix">
      <div className="overflow-x-auto bg-white p-4">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              <th className="pb-2 pr-3">Role</th>
              {permissions.map((p) => (
                <th key={p} className="pb-2 px-1.5 text-center">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(matrix).map(([role, perms], i) => (
              <tr key={role} className="border-t border-border">
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-1.5 font-bold text-navy">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[9px] font-black text-white">
                      {5 - i}
                    </span>
                    {role}
                  </span>
                </td>
                {perms.map((allowed, j) => (
                  <td key={j} className="py-2.5 px-1.5 text-center">
                    {allowed ? (
                      <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="mx-auto block h-4 w-4 rounded-full bg-surface-raised text-center text-[10px] leading-4 text-text-tertiary">
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
          <Lock className="h-3.5 w-3.5" /> Enforced server-side + Supabase Row Level Security
        </div>
      </div>
    </WindowChrome>
  );
}

function DataVisual() {
  return (
    <WindowChrome label="deployment.targets">
      <div className="space-y-3 bg-white p-4">
        {[
          { icon: Cloud, name: "Vercel + Supabase", meta: "Recommended · ~5 min", badge: "Live", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { icon: Container, name: "Docker Compose", meta: "Self-host · any VPS", badge: "Full control", tone: "bg-blue-50 text-blue-700 border-blue-200" },
          { icon: Server, name: "Bare Metal / Node 18+", meta: "Manual · zero lock-in", badge: "Flexible", tone: "bg-purple-50 text-purple-700 border-purple-200" },
        ].map((d) => (
          <div
            key={d.name}
            className="flex items-center gap-3 rounded-xl border border-border bg-[#FCFCF9] p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
              <d.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-navy">{d.name}</p>
              <p className="truncate text-[11px] text-text-tertiary">{d.meta}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${d.tone}`}>
              {d.badge}
            </span>
          </div>
        ))}
        <div className="rounded-xl bg-navy px-3 py-2.5 font-mono text-[11px] text-slate-300">
          <span className="text-emerald-400">$</span> npx openpost-cli init my-blog
        </div>
      </div>
    </WindowChrome>
  );
}

/* ------------------------------- Spotlights ------------------------------ */

const spotlights: Spotlight[] = [
  {
    id: "editor",
    eyebrow: "Block Editing",
    title: (
      <>
        A writing experience
        <br />
        <span className="gradient-text-brand">your team will love.</span>
      </>
    ),
    description:
      "A Notion-smooth block editor built on Tiptap and ProseMirror. Documents are stored as validated JSON — never raw HTML — so what you write is exactly what ships, with zero markup surprises.",
    details: [
      { icon: Command, text: "16+ content blocks with slash commands and drag-and-drop" },
      { icon: Timer, text: "2s debounced autosave + IndexedDB crash recovery" },
      { icon: Braces, text: "Structured AST storage — type-safe and fully versioned" },
      { icon: Gauge, text: "Live word count, reading time, and SEO scoring as you type" },
    ],
    link: { label: "Explore the studio", href: "/#interactive-editor" },
    visual: <EditorVisual />,
    accent: "brand",
  },
  {
    id: "api",
    eyebrow: "Headless Delivery",
    title: (
      <>
        One API.
        <br />
        <span className="gradient-text-brand">Every frontend.</span>
      </>
    ),
    description:
      "A clean REST API serves your content to Next.js, Astro, Remix, or anything that can fetch JSON. Query structured posts, authors, and taxonomies with cursor pagination and edge caching built in.",
    details: [
      { icon: Globe, text: "Sub-50ms responses cached at the global edge" },
      { icon: KeyRound, text: "Project-scoped Bearer tokens, hashed with SHA-256" },
      { icon: Layers, text: "Cursor pagination, ISR tags, and search out of the box" },
      { icon: Braces, text: "First-class SDK snippets for 5 frameworks" },
    ],
    link: { label: "Try the live playground", href: "/#api" },
    visual: <ApiVisual />,
    accent: "emerald",
  },
  {
    id: "security",
    eyebrow: "Access Control",
    title: (
      <>
        Security that ships
        <br />
        <span className="gradient-text-brand">turned on by default.</span>
      </>
    ),
    description:
      "Five granular roles map to real editorial responsibilities. Every permission is checked on the server and enforced again at the database with Row Level Security — a client-side bypass simply isn't possible.",
    details: [
      { icon: ShieldCheck, text: "Owner · Admin · Editor · Author · Contributor" },
      { icon: Lock, text: "Supabase Row Level Security on every project table" },
      { icon: ScrollText, text: "Complete audit trail for every team action" },
      { icon: KeyRound, text: "HMAC webhooks, SSRF guards, and rate limiting" },
    ],
    link: { label: "See the workflow", href: "/#workflow" },
    visual: <RbacVisual />,
    accent: "indigo",
  },
  {
    id: "ownership",
    eyebrow: "Data Ownership",
    title: (
      <>
        Own your content.
        <br />
        <span className="gradient-text-brand">Forever.</span>
      </>
    ),
    description:
      "100% open source under the MIT license, built on native PostgreSQL and Prisma. Take direct SQL access, host on your own infrastructure, and never worry about vendor lock-in or surprise pricing tiers.",
    details: [
      { icon: Database, text: "Native Postgres schema — direct SQL & Prisma access" },
      { icon: Cloud, text: "Zero-egress Cloudflare R2 media storage" },
      { icon: Container, text: "Deploy to Vercel, Docker, or bare metal" },
      { icon: Check, text: "MIT licensed — audit it, fork it, ship it" },
    ],
    link: { label: "Read deployment docs", href: "/docs" },
    visual: <DataVisual />,
    accent: "flame",
  },
];

export function FeatureSpotlight() {
  return (
    <section id="spotlight" className="relative bg-[#FAF9F5] py-20 sm:py-28 border-b border-border overflow-hidden">
      {/* Ambient background blooms */}
      <div className="absolute top-1/4 -left-40 h-[420px] w-[420px] rounded-full bg-brand/[0.04] blur-[110px]" />
      <div className="absolute bottom-1/4 -right-40 h-[420px] w-[420px] rounded-full bg-[#FE4F01]/[0.04] blur-[110px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-4 py-1.5 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-bold text-navy uppercase tracking-wide">
                Why teams choose OpenPost
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-navy tracking-tight leading-tight">
              Everything you need to
              <br />
              <span className="gradient-text-brand">publish with confidence.</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
              Four pillars of a modern headless CMS — editing, delivery, security, and
              ownership — explained side by side.
            </p>
          </div>
        </FadeIn>

        {/* Alternating side-by-side rows */}
        <div className="mt-16 sm:mt-20 space-y-16 sm:space-y-24">
          {spotlights.map((s, idx) => {
            const reversed = idx % 2 === 1;
            const accent = accentStyles[s.accent];
            return (
              <div
                key={s.id}
                className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
              >
                {/* Copy column */}
                <FadeIn
                  direction={reversed ? "right" : "left"}
                  className={reversed ? "lg:order-2" : "lg:order-1"}
                >
                  <div className="max-w-xl">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wide ${accent.chip}`}
                    >
                      {s.eyebrow}
                    </span>

                    <h3 className="mt-4 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight leading-[1.15]">
                      {s.title}
                    </h3>

                    <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed">
                      {s.description}
                    </p>

                    <Stagger className="mt-6 space-y-3" stagger={0.08}>
                      {s.details.map((d) => (
                        <StaggerItem key={d.text}>
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${accent.icon}`}
                            >
                              <d.icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-sm text-navy font-medium leading-snug">
                              {d.text}
                            </span>
                          </div>
                        </StaggerItem>
                      ))}
                    </Stagger>

                    {s.link && (
                      <div className="mt-7">
                        <Link
                          href={s.link.href}
                          target={s.link.external ? "_blank" : undefined}
                          rel={s.link.external ? "noreferrer" : undefined}
                          className="group inline-flex items-center gap-1.5 text-sm font-bold text-navy hover:text-brand transition"
                        >
                          {s.link.label}
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </FadeIn>

                {/* Visual column */}
                <FadeIn
                  direction={reversed ? "left" : "right"}
                  delay={0.1}
                  className={reversed ? "lg:order-1" : "lg:order-2"}
                >
                  <div className="relative">
                    {/* Soft backdrop tint behind the panel */}
                    <div
                      className={`absolute -inset-3 rounded-3xl blur-xl opacity-60 ${
                        s.accent === "emerald"
                          ? "bg-emerald-100"
                          : s.accent === "indigo"
                          ? "bg-indigo-100"
                          : s.accent === "flame"
                          ? "bg-[#FFF0EB]"
                          : "bg-brand/10"
                      }`}
                    />
                    <div className="relative">{s.visual}</div>
                  </div>
                </FadeIn>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
