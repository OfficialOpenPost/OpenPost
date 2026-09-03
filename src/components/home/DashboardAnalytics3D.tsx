"use client";

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Calendar,
  Users,
  Tag,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Clock,
  FileEdit,
  Send,
  Eye,
  Lock,
  Sparkles,
  ArrowRight,
  Activity,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { FadeIn } from "@/components/motion";

type StudioTab = "pipeline" | "rbac" | "audit";

const editorialQueue = [
  {
    id: "post_1",
    title: "Next.js 16 Edge Rendering & Partial Prerendering Guide",
    author: "Sarah Chen",
    role: "Editor",
    status: "Scheduled",
    statusColor: "bg-amber-100 text-amber-800 border-amber-300",
    time: "Today at 4:00 PM UTC",
    wordCount: "1,840 words",
    category: "Architecture",
  },
  {
    id: "post_2",
    title: "Zero-Egress Asset Pipeline on Cloudflare R2",
    author: "Alex Rivera",
    role: "Author",
    status: "In Review",
    statusColor: "bg-blue-100 text-blue-800 border-blue-300",
    time: "Submitted 25m ago",
    wordCount: "1,220 words",
    category: "Cloud & Storage",
  },
  {
    id: "post_3",
    title: "Building Multi-Tenant Headless CMS with PostgreSQL RLS",
    author: "Marcus Vance",
    role: "Owner",
    status: "Published",
    statusColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    time: "Published 2h ago",
    wordCount: "2,450 words",
    category: "Database",
  },
  {
    id: "post_4",
    title: "Tiptap ProseMirror Custom Node Extensions for Editorial Teams",
    author: "Elena Rostova",
    role: "Contributor",
    status: "Draft",
    statusColor: "bg-slate-100 text-slate-700 border-slate-300",
    time: "Edited 5m ago",
    wordCount: "640 words",
    category: "Engineering",
  },
];

const rbacMatrix = [
  {
    action: "Delete Project & Billing",
    owner: true,
    admin: false,
    editor: false,
    author: false,
    contributor: false,
  },
  {
    action: "Invite & Approve Team Members",
    owner: true,
    admin: true,
    editor: false,
    author: false,
    contributor: false,
  },
  {
    action: "Publish & Schedule Any Post",
    owner: true,
    admin: true,
    editor: true,
    author: false,
    contributor: false,
  },
  {
    action: "Publish Own Drafts",
    owner: true,
    admin: true,
    editor: true,
    author: true,
    contributor: false,
  },
  {
    action: "Submit Drafts for Review",
    owner: true,
    admin: true,
    editor: true,
    author: true,
    contributor: true,
  },
  {
    action: "Upload Media to Cloudflare R2",
    owner: true,
    admin: true,
    editor: true,
    author: true,
    contributor: true,
  },
];

const auditLogs = [
  {
    id: "log_1",
    action: "post.scheduled",
    actor: "sarah.chen@openpost.dev (Editor)",
    target: "Next.js 16 Edge Rendering Guide",
    time: "2 mins ago",
    badge: "Cron Queued",
  },
  {
    id: "log_2",
    action: "member.role_updated",
    actor: "marcus.vance@openpost.dev (Owner)",
    target: "alex.rivera promoted to Author",
    time: "14 mins ago",
    badge: "5-Tier RBAC",
  },
  {
    id: "log_3",
    action: "media.uploaded",
    actor: "elena.rostova@openpost.dev (Contributor)",
    target: "hero-diagram-v2.webp (84 KB)",
    time: "42 mins ago",
    badge: "Cloudflare R2",
  },
  {
    id: "log_4",
    action: "webhook.dispatched",
    actor: "system.event_bus",
    target: "https://api.site.com/revalidate (200 OK)",
    time: "1 hour ago",
    badge: "HMAC Signed",
  },
];

export function DashboardAnalytics3D() {
  const [activeTab, setActiveTab] = useState<StudioTab>("pipeline");
  const [counts, setCounts] = useState<{ posts: number; categories: number; authors: number }>({
    posts: 2,
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
        posts: Array.isArray(p.data) ? p.data.length : (p.meta?.total ?? 2),
        categories: Array.isArray(c.data) ? c.data.length : 0,
        authors: Array.isArray(a.data) ? a.data.length : 0,
      });
    });
  }, []);

  return (
    <section id="dashboard" className="bg-[#FAF9F5] py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12 items-center">
          {/* LEFT SIDE: Interactive Command Center Studio Card */}
          <div className="lg:col-span-7">
            <div className="card-glass-specular rounded-2xl overflow-hidden shadow-2xl shadow-navy/10 border border-border bg-white">
              {/* Studio Window Header with Tab Switcher */}
              <div className="flex flex-wrap items-center justify-between border-b border-border bg-[#F9FAFB] px-4 py-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-1 text-xs font-mono font-bold text-navy">
                    openpost.dashboard/operations
                  </span>
                </div>

                {/* Studio Tab Buttons */}
                <div className="flex rounded-lg bg-surface-dim p-0.5 border border-border text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("pipeline")}
                    className={`px-2.5 py-1 rounded-md transition ${
                      activeTab === "pipeline" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                    }`}
                  >
                    Workflow
                  </button>
                  <button
                    onClick={() => setActiveTab("rbac")}
                    className={`px-2.5 py-1 rounded-md transition ${
                      activeTab === "rbac" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                    }`}
                  >
                    5-Tier RBAC
                  </button>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`px-2.5 py-1 rounded-md transition ${
                      activeTab === "audit" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                    }`}
                  >
                    Audit Trail
                  </button>
                </div>
              </div>

              {/* Studio Content View */}
              <div className="p-4 sm:p-6 bg-white min-h-[380px] flex flex-col justify-between">
                {/* Tab 1: Editorial Workflow Pipeline */}
                {activeTab === "pipeline" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-text-tertiary font-mono">
                      <span>Article Title &amp; Category</span>
                      <span>Author · Status</span>
                    </div>

                    <div className="space-y-2">
                      {editorialQueue.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border bg-[#FCFCF9] hover:bg-white hover:border-brand/40 transition-all shadow-2xs gap-2"
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-navy truncate">{item.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-text-tertiary">
                              <span className="font-semibold text-brand">{item.category}</span>
                              <span>•</span>
                              <span>{item.wordCount}</span>
                              <span>•</span>
                              <span>{item.time}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-medium text-navy hidden sm:inline">
                              {item.author}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${item.statusColor}`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 2: 5-Tier Canonical RBAC Matrix */}
                {activeTab === "rbac" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border text-[10px] font-bold text-text-tertiary uppercase font-mono">
                          <th className="py-2 px-2.5">Permission Action</th>
                          <th className="py-2 px-2 text-center text-brand">Owner</th>
                          <th className="py-2 px-2 text-center text-navy">Admin</th>
                          <th className="py-2 px-2 text-center text-text-secondary">Editor</th>
                          <th className="py-2 px-2 text-center text-text-secondary">Author</th>
                          <th className="py-2 px-2 text-center text-text-tertiary">Contrib</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rbacMatrix.map((r, i) => (
                          <tr key={i} className="hover:bg-[#FAF9F5] transition">
                            <td className="py-2 px-2.5 font-medium text-navy text-[11px]">
                              {r.action}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {r.owner ? <Check className="h-3.5 w-3.5 text-emerald-600 inline" /> : <X className="h-3.5 w-3.5 text-slate-300 inline" />}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {r.admin ? <Check className="h-3.5 w-3.5 text-emerald-600 inline" /> : <X className="h-3.5 w-3.5 text-slate-300 inline" />}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {r.editor ? <Check className="h-3.5 w-3.5 text-emerald-600 inline" /> : <X className="h-3.5 w-3.5 text-slate-300 inline" />}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {r.author ? <Check className="h-3.5 w-3.5 text-emerald-600 inline" /> : <X className="h-3.5 w-3.5 text-slate-300 inline" />}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {r.contributor ? <Check className="h-3.5 w-3.5 text-emerald-600 inline" /> : <X className="h-3.5 w-3.5 text-slate-300 inline" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 3: Audit Trail & Activity Feed */}
                {activeTab === "audit" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-text-tertiary font-mono">
                      <span>Event &amp; Target</span>
                      <span>Actor · Time</span>
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl border border-border bg-[#FCFCF9] gap-1 text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-brand/15 px-1.5 py-0.5 font-bold text-navy text-[10px]">
                              {log.action}
                            </span>
                            <span className="text-navy font-semibold">{log.target}</span>
                          </div>
                          <div className="flex items-center gap-2 text-text-tertiary text-[10px]">
                            <span>{log.actor}</span>
                            <span>•</span>
                            <span>{log.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Studio Status Telemetry */}
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-tertiary">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <Check className="h-3.5 w-3.5" /> Supabase RLS Active
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-navy">
                      <ShieldCheck className="h-3.5 w-3.5 text-brand" /> 5-Tier Canonical RBAC
                    </span>
                  </div>
                  <span className="font-mono text-text-tertiary">
                    Multi-Tenant Guard v2.2
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Clean Editorial Text Content (No Outer Card) */}
          <div className="lg:col-span-5 space-y-6">
            <FadeIn>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-bold text-navy">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span>Editorial Operations &amp; Governance</span>
              </div>

              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-navy tracking-tight leading-tight">
                Your editorial operations at a glance.
              </h2>

              <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
                Drafts, scheduled publishing calendars, nested taxonomies, and multi-author team permissions engineered for high-velocity newsrooms.
              </p>

              {/* 3 Operations Highlights */}
              <div className="mt-6 space-y-3">
                <div className="p-3.5 rounded-xl border border-border bg-white shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-navy text-xs">
                    <Calendar className="h-4 w-4 text-brand" />
                    <span>Scheduled Publishing &amp; Automated Cron</span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
                    Schedule posts down to the minute. Background cron handles atomic status updates and edge cache purging automatically.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-white shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-navy text-xs">
                    <Users className="h-4 w-4 text-[#FE4F01]" />
                    <span>Strict 5-Tier RBAC &amp; Safe Invalidation</span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
                    Canonical roles (<code className="text-navy font-bold">OWNER &gt; ADMIN &gt; EDITOR &gt; AUTHOR &gt; CONTRIBUTOR</code>) enforced at database and API layers.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-white shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-navy text-xs">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    <span>Complete Audit Logs &amp; Webhook Traces</span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
                    Every mutation, invite, publish, and role change is logged to immutable audit records with HMAC-signed webhooks.
                  </p>
                </div>
              </div>

              {/* Verification Badges */}
              <div className="mt-5 space-y-2 pt-2 border-t border-border text-xs text-navy font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Row Level Security (RLS) tenant isolation per project</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Granular post revisions with one-click restore history</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

