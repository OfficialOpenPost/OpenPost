"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  LayoutGrid,
  Calendar,
  Users,
  Tag,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

export function DashboardAnalytics3D() {
  const [counts, setCounts] = useState<{ posts: number; categories: number; authors: number }>({
    posts: 0,
    categories: 0,
    authors: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/posts?limit=100").then((r) => r.json()).catch(() => ({})),
      fetch("/api/v1/categories").then((r) => r.json()).catch(() => ({})),
      fetch("/api/v1/authors").then((r) => r.json()).catch(() => ({})),
    ]).then(([p, c, a]) => {
      setCounts({
        posts: Array.isArray(p.data) ? p.data.length : (p.meta?.total ?? 0),
        categories: Array.isArray(c.data) ? c.data.length : 0,
        authors: Array.isArray(a.data) ? a.data.length : 0,
      });
    });
  }, []);

  return (
    <section id="dashboard" className="bg-[#FAF9F5] py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Content Pipeline
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Your editorial operations at a glance.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Drafts, scheduled posts, category taxonomies, and multi-author team permissions.
            </p>
          </div>
        </FadeIn>

        {/* Small Preview Banner with Real Database Counts */}
        <FadeIn delay={0.15}>
          <div className="mt-8 mx-auto max-w-4xl rounded-2xl border border-border bg-white p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xs hover:border-brand/30 transition-all duration-300">
            <div className="relative h-24 w-36 shrink-0 rounded-xl overflow-hidden border border-border">
              <Image
                src="/images/dashboard_analytics_3d.jpg"
                alt="Dashboard Command Center"
                fill
                sizes="144px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  {counts.posts} Published Articles
                </span>
                <span className="rounded-full bg-brand/15 text-navy px-2 py-0.5 text-[10px] font-bold">
                  {counts.categories} Active Categories
                </span>
                <span className="rounded-full bg-surface-dim text-text-secondary border border-border px-2 py-0.5 text-[10px] font-bold">
                  {counts.authors} Authors in Database
                </span>
              </div>
              <p className="mt-1.5 text-xs text-text-secondary font-medium">
                Real-time article counters, scheduled publication calendar, and granular audit history.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* 3 Pillar Cards with Staggered Entrance */}
        <Stagger className="mt-8 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto" stagger={0.1}>
          <StaggerItem>
            <div className="pro-card rounded-2xl border border-border bg-white p-6 shadow-xs h-full flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-navy">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-navy">Scheduled Publishing</h3>
                <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                  Set precise publication timestamps. Background cron triggers edge cache invalidation and social webhooks automatically.
                </p>
              </div>
              <div className="mt-4 flex gap-2 pt-2 border-t border-border">
                <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-mono text-text-tertiary">Cron Sync</span>
                <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-mono text-text-tertiary">Webhooks</span>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="pro-card rounded-2xl border border-border bg-white p-6 shadow-xs h-full flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FE4F01]/15 text-[#FE4F01]">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-navy">Team Roles &amp; RBAC</h3>
                <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                  Owner, Admin, Editor, Author, and Contributor permissions. Protect sensitive workflows and enforce review checkpoints.
                </p>
              </div>
              <div className="mt-4 flex gap-2 pt-2 border-t border-border">
                <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-mono text-text-tertiary">5 Roles</span>
                <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-mono text-text-tertiary">Audit Logs</span>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="pro-card rounded-2xl border border-border bg-white p-6 shadow-xs h-full flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Tag className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-navy">Taxonomy &amp; Slugs</h3>
                <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                  Organize articles with nested categories and multi-tag filtering. Automatic unique slug sanitization and 301 redirects.
                </p>
              </div>
              <div className="mt-4 flex gap-2 pt-2 border-t border-border">
                <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-mono text-text-tertiary">Nested Tree</span>
                <span className="rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-mono text-text-tertiary">Clean URLs</span>
              </div>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
