"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Rocket,
  Database,
  Cloud,
  Terminal,
  Webhook,
  PenTool,
  Shield,
  Server,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Code2,
} from "lucide-react";
import { DocsSearchTrigger } from "@/components/docs/DocsSearch";

export default function DocsLandingPage() {
  const [copiedCmd, setCopiedCmd] = useState(false);

  const copyQuickCommand = () => {
    navigator.clipboard.writeText("npx openpost-cli");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const coreGuides = [
    {
      icon: Rocket,
      title: "5-Minute Quickstart",
      desc: "Clone the repo, run migrations in Supabase, and publish your first post.",
      href: "/docs/getting-started/quickstart",
      badge: "Start Here",
      badgeColor: "bg-brand/10 text-brand border-brand/20",
    },
    {
      icon: Database,
      title: "Supabase & Postgres Setup",
      desc: "Run SQL migrations 001–016, configure the Session pooler, and approve your first admin.",
      href: "/docs/supabase-setup",
      badge: "SQL",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      icon: Cloud,
      title: "Cloudflare R2 Media",
      desc: "Set up R2 bucket, configure CORS policies, custom domains, and WebP compression.",
      href: "/docs/cloudflare-setup",
      badge: "Media",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      icon: Terminal,
      title: "Headless REST API",
      desc: "Integrate any frontend with cursor pagination, published-only endpoints, and ETags.",
      href: "/docs/api/overview",
      badge: "REST",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  const categories = [
    {
      title: "Writing Studio & Editor",
      icon: PenTool,
      desc: "Tiptap engine, 16 custom Slash blocks, 6 image layouts, 2s autosave, and SEO snippet inspector.",
      links: [
        { label: "Editor & 16 Slash Blocks", href: "/docs/editor" },
        { label: "Image Layouts & Resizing", href: "/docs/editor#image-layouts" },
        { label: "Autosave & Crash Recovery", href: "/docs/editor#autosave-engine" },
      ],
    },
    {
      title: "REST API Reference",
      icon: Terminal,
      desc: "Full endpoint documentation with query parameters, request bodies, and cURL snippets.",
      links: [
        { label: "Posts & Revisions API", href: "/docs/api/posts" },
        { label: "Categories & Tags API", href: "/docs/api/taxonomies" },
        { label: "Authors API", href: "/docs/api/authors" },
        { label: "Polls & Voting API", href: "/docs/api/polls" },
        { label: "Media & Presign API", href: "/docs/api/media" },
      ],
    },
    {
      title: "Webhooks & Automation",
      icon: Webhook,
      desc: "Publish/update lifecycle events, HMAC SHA-256 signature verification, and deploy triggers.",
      links: [
        { label: "Webhooks Engine Guide", href: "/docs/webhooks" },
        { label: "HMAC Signature Verification", href: "/docs/webhooks#hmac-signature-verification" },
        { label: "Vercel & Netlify Deploy Hooks", href: "/docs/webhooks#deploy-hooks" },
      ],
    },
    {
      title: "CLI & Frontend Starters",
      icon: Code2,
      desc: "One command CLI to connect any Next.js, Remix, or Astro frontend with browser handshake.",
      links: [
        { label: "OpenPost CLI (openpost-cli)", href: "/docs/cli" },
        { label: "Next.js Frontend Integration", href: "/docs/frontend" },
        { label: "ContentRenderer Component", href: "/docs/frontend#content-renderer" },
      ],
    },
    {
      title: "Security & Multi-Tenancy",
      icon: Shield,
      desc: "Row-Level Security (RLS), RBAC permissions matrix, SSRF defenses, and project workspaces.",
      links: [
        { label: "Projects & Multi-Tenancy", href: "/docs/projects" },
        { label: "Security & RBAC Matrix", href: "/docs/security" },
      ],
    },
    {
      title: "Deployment & Operations",
      icon: Server,
      desc: "Deploying to Vercel, Docker Compose production stack, cron scheduler, and troubleshooting.",
      links: [
        { label: "Deployment & Self-Hosting", href: "/docs/deployment" },
        { label: "Scheduled Posts Cron", href: "/docs/api/cron-health" },
        { label: "Troubleshooting Guide", href: "/docs/troubleshooting" },
      ],
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#FEA611]/10 via-white to-white p-8 sm:p-12 shadow-xs">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 shadow-2xs">
            <BookOpen className="h-3.5 w-3.5 text-brand" />
            <span className="text-xs font-semibold text-navy">OpenPost Documentation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-navy">
            Documentation & Developer Hub
          </h1>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            Everything you need to set up, build, customize, and self-host OpenPost. Simple guides, clear commands, and complete API specifications.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={copyQuickCommand}
              className="flex items-center gap-2.5 rounded-xl bg-navy px-4 py-3 font-mono text-xs font-bold text-slate-200 hover:bg-navy-dark transition-all shadow-sm"
            >
              <Terminal className="h-4 w-4 text-brand" />
              <span>npx openpost-cli</span>
              {copiedCmd ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 text-slate-400 hover:text-white" />
              )}
            </button>

            <Link
              href="/docs/getting-started/quickstart"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-xs font-bold text-navy hover:bg-brand-hover transition-all shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/docs/api/overview"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-xs font-bold text-navy hover:bg-surface-raised transition-all"
            >
              <span>REST API Reference</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Core Quick Guides */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Essential Guides</h2>
          <span className="text-xs text-text-tertiary">Step-by-step setup</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coreGuides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link
                key={guide.title}
                href={guide.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-white p-6 hover:border-brand/40 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${guide.badgeColor}`}>
                      {guide.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-navy group-hover:text-brand transition-colors">
                    {guide.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
                    {guide.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-1 text-xs font-bold text-brand group-hover:translate-x-0.5 transition-transform">
                  <span>Read guide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Code Snippet / Integration preview */}
      <section className="rounded-2xl border border-border bg-[#1E242E] text-slate-100 p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" /> Quick Integration
            </div>
            <h3 className="text-lg font-bold text-white">Fetch Published Posts in 3 Lines</h3>
          </div>
          <span className="font-mono text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            Next.js App Router (React Server Component)
          </span>
        </div>

        <div className="overflow-x-auto font-mono text-xs sm:text-[13px] leading-relaxed text-slate-200">
          <pre>{`// app/blog/page.tsx
export default async function BlogPage() {
  const res = await fetch("https://your-openpost.com/api/v1/posts?limit=10", {
    headers: { "X-OpenPost-Token": process.env.OPENPOST_TOKEN! },
    next: { revalidate: 60 } // Next.js ISR edge cache
  });
  const { data: posts } = await res.json();

  return (
    <div className="grid gap-6">
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.readingTime} min read · {new Date(post.publishedAt).toLocaleDateString()}</p>
        </article>
      ))}
    </div>
  );
}`}</pre>
        </div>
      </section>

      {/* Categorized Documentation Directory */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy">Explore All Documentation</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className="rounded-2xl border border-border bg-white p-5 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2.5 font-bold text-navy text-sm mb-2">
                    <Icon className="h-4 w-4 text-brand" />
                    <span>{cat.title}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {cat.desc}
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-border">
                  {cat.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex items-center justify-between text-xs text-text-secondary hover:text-brand transition-colors py-1"
                    >
                      <span className="truncate">{link.label}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-brand shrink-0 ml-1" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
