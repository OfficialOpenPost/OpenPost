"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Eye,
  Clock,
  Trash2,
  Plus,
  TrendingUp,
  Users,
  ArrowUpRight,
  Calendar,
  PenLine,
  Image as ImageIcon,
  Webhook,
  Activity,
  Edit3,
  CheckCircle2,
  Folder,
  Tag,
  Settings,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Layers,
  BarChart3,
} from "lucide-react";

interface RecentBlog {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft" | "scheduled" | "trash";
  updatedAt: string;
  createdAt: string;
  publishedAt?: string | null;
  wordCount?: number;
  readingTime?: number;
  category?: { id: string; name: string; slug: string } | null;
  author?: { name: string; email: string } | null;
  seo?: any;
}

interface DashboardStats {
  published: number;
  drafts: number;
  scheduled: number;
  trash: number;
  totalArticles: number;
  categories: number;
  tags: number;
  authors: number;
  media: number;
  webhooks: number;
  totalWords: number;
  avgReadingTime: number;
}

const statusBadgeConfig = {
  published: {
    label: "Published",
    bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  draft: {
    label: "Draft",
    bg: "bg-brand/10 text-brand-dark border-brand/20",
    dot: "bg-brand",
  },
  scheduled: {
    label: "Scheduled",
    bg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    dot: "bg-amber-500",
  },
  trash: {
    label: "In Trash",
    bg: "bg-flame/10 text-flame border-flame/20",
    dot: "bg-flame",
  },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    published: 0,
    drafts: 0,
    scheduled: 0,
    trash: 0,
    totalArticles: 0,
    categories: 0,
    tags: 0,
    authors: 0,
    media: 0,
    webhooks: 0,
    totalWords: 0,
    avgReadingTime: 0,
  });
  const [recentBlogs, setRecentBlogs] = useState<RecentBlog[]>([]);
  const [userRole, setUserRole] = useState<string>("OWNER");
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const params = new URLSearchParams();
      if (activeProjId) params.set("projectId", activeProjId);
      params.set("_t", Date.now().toString());

      const projHeaders: Record<string, string> = activeProjId ? { "X-OpenPost-Project": activeProjId } : {};

      const res = await fetch(`/api/dashboard/stats?${params.toString()}`, {
        cache: "no-store",
        headers: projHeaders,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setStats(json.data.stats);
          setRecentBlogs(json.data.recentBlogs || []);
          if (json.data.userRole) setUserRole(json.data.userRole);
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Fetch user name for personalized welcome
    fetch("/api/auth/user-status")
      .then((r) => r.json())
      .then((data) => {
        if (data.displayName) setUserName(data.displayName);
      })
      .catch(() => {});
    const handleProjectChange = () => fetchDashboard();
    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, [fetchDashboard]);

  const statCards = [
    {
      label: "Published Articles",
      value: stats.published,
      subtext: `${stats.totalArticles > 0 ? Math.round((stats.published / stats.totalArticles) * 100) : 0}% of total catalog`,
      icon: Eye,
      accent: "from-emerald-500/20 to-emerald-500/5",
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      link: "/dashboard/blogs?status=published",
    },
    {
      label: "Work in Progress",
      value: stats.drafts,
      subtext: "Unpublished drafts",
      icon: FileText,
      accent: "from-brand/20 to-brand/5",
      iconColor: "text-brand-dark bg-brand/15 border-brand/30",
      link: "/dashboard/blogs?status=draft",
    },
    {
      label: "Scheduled Posts",
      value: stats.scheduled,
      subtext: "Upcoming releases",
      icon: Clock,
      accent: "from-amber-500/20 to-amber-500/5",
      iconColor: "text-amber-600 bg-amber-50 border-amber-200",
      link: "/dashboard/blogs?status=scheduled",
    },
    {
      label: "Media Assets",
      value: stats.media,
      subtext: "R2 cloud assets",
      icon: ImageIcon,
      accent: "from-navy/20 to-navy/5",
      iconColor: "text-navy bg-navy/10 border-navy/20",
      link: "/dashboard/media",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F0F0F1] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Hero */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                All CMS Systems Online
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-navy/15 bg-navy/5 px-2.5 py-0.5 text-xs font-bold text-navy">
                <ShieldCheck className="h-3 w-3 text-brand" /> {userRole}
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-navy">
              {userName ? `Welcome back, ${userName}` : "Editorial Studio Command"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary flex items-center gap-2 flex-wrap">
              <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
              <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="hidden sm:inline">·</span>
              <span className="text-text-tertiary">Total words written: {stats.totalWords.toLocaleString()}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchDashboard}
              aria-label="Refresh dashboard data"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-semibold text-navy hover:bg-surface-raised transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-brand" : ""}`} /> Refresh
            </button>
            <Link
              href="/dashboard/editor"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 sm:px-5 py-2.5 text-xs font-bold text-navy shadow-md shadow-brand/20 hover:bg-brand-hover hover:text-white transition"
            >
              <PenLine className="h-4 w-4" /> Create Article
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards Grid (Adaptive Responsive Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
            >
              <Link
                href={card.link}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-white p-5 shadow-xs hover:border-brand/40 hover:shadow-md transition-all duration-200 block"
              >
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-linear-to-br ${card.accent} blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-300`} />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{card.label}</span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${card.iconColor}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl sm:text-4xl font-black tracking-tight text-navy">
                      {loading ? "..." : card.value}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-text-tertiary">
                    <span>{card.subtext}</span>
                    <ArrowUpRight className="h-3 w-3 text-text-tertiary group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Catalog Distribution Overview Bar */}
        {stats.totalArticles > 0 && (
          <div className="rounded-2xl border border-border/80 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-navy mb-3">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-brand" /> Content Pipeline ({stats.totalArticles} Total Articles)
              </span>
              <span className="text-text-tertiary font-medium">Avg reading time: ~{stats.avgReadingTime || 1} min</span>
            </div>
            <div className="h-3 w-full rounded-full bg-surface-dim overflow-hidden flex shadow-inner">
              {stats.published > 0 && (
                <div
                  style={{ width: `${(stats.published / stats.totalArticles) * 100}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Published: ${stats.published}`}
                />
              )}
              {stats.drafts > 0 && (
                <div
                  style={{ width: `${(stats.drafts / stats.totalArticles) * 100}%` }}
                  className="bg-brand h-full transition-all duration-500"
                  title={`Drafts: ${stats.drafts}`}
                />
              )}
              {stats.scheduled > 0 && (
                <div
                  style={{ width: `${(stats.scheduled / stats.totalArticles) * 100}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title={`Scheduled: ${stats.scheduled}`}
                />
              )}
              {stats.trash > 0 && (
                <div
                  style={{ width: `${(stats.trash / stats.totalArticles) * 100}%` }}
                  className="bg-flame h-full transition-all duration-500"
                  title={`Trash: ${stats.trash}`}
                />
              )}
            </div>
            <div className="mt-3 flex items-center gap-4 sm:gap-6 flex-wrap text-xs text-text-secondary font-medium">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {stats.published} Published</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand" /> {stats.drafts} Drafts</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> {stats.scheduled} Scheduled</span>
              {stats.trash > 0 && (
                <Link href="/dashboard/blogs?status=trash" className="flex items-center gap-1.5 text-flame hover:underline">
                  <span className="h-2 w-2 rounded-full bg-flame" /> {stats.trash} in Trash
                </Link>
              )}
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout: Recent Posts (8 Cols) + Resources/Quick Tools (4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Recent Articles Column */}
          <div className="lg:col-span-8 rounded-2xl border border-border/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <div>
                <h2 className="text-base font-bold text-navy flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand" /> Recently Updated Articles
                </h2>
                <p className="text-xs text-text-tertiary mt-0.5">Latest editorial modifications</p>
              </div>
              <Link
                href="/dashboard/blogs"
                className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-brand transition"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-border/60">
              {loading ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-brand" />
                  <span className="text-xs font-bold text-navy">Loading recent articles...</span>
                </div>
              ) : recentBlogs.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-dim text-text-tertiary mb-3">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-navy">No articles created yet</p>
                  <p className="text-xs text-text-secondary mt-1">Start writing your first article with the rich Tiptap editor.</p>
                  <Link
                    href="/dashboard/editor"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-navy hover:bg-brand-hover transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Write Article
                  </Link>
                </div>
              ) : (
                recentBlogs.map((blog) => {
                  const cfg = statusBadgeConfig[blog.status] || statusBadgeConfig.draft;
                  return (
                    <div
                      key={blog.id}
                      className="group py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-dim/30 px-2 -mx-2 rounded-xl transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${cfg.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {blog.category && (
                            <span className="text-[11px] font-semibold text-text-secondary bg-surface-dim px-2 py-0.5 rounded-md border border-border/50">
                              {blog.category.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-navy truncate group-hover:text-brand transition">
                          {blog.title || "Untitled Article"}
                        </h3>
                        <p className="text-[11px] text-text-tertiary mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>By {blog.author?.name || "Author"}</span>
                          <span>·</span>
                          <span>{blog.wordCount || 0} words</span>
                          <span>·</span>
                          <span>Updated {new Date(blog.updatedAt).toLocaleDateString()}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <Link
                          href={`/dashboard/editor/${blog.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-navy hover:bg-surface-raised transition shadow-2xs"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </Link>
                        {blog.status === "published" && (
                          <Link
                            href={`/blog/${blog.slug}`}
                            target="_blank"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-border bg-white text-text-secondary hover:text-navy hover:bg-surface-raised transition shadow-2xs"
                            title="View published article"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Taxonomy & Studio Quick Panels (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Quick Metrics Resource Card */}
            <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-brand" /> Content Studio Assets
              </h3>

              <div className="space-y-3">
                <Link
                  href="/dashboard/categories"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-raised border border-border/60 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy">
                      <Folder className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-navy group-hover:text-brand transition">Categories</p>
                      <p className="text-[10px] text-text-tertiary">Hierarchical taxonomies</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-navy px-2 py-0.5 rounded-md bg-white border border-border">
                    {stats.categories}
                  </span>
                </Link>

                <Link
                  href="/dashboard/tags"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-raised border border-border/60 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-navy group-hover:text-brand transition">Content Tags</p>
                      <p className="text-[10px] text-text-tertiary">Topic metadata</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-navy px-2 py-0.5 rounded-md bg-white border border-border">
                    {stats.tags}
                  </span>
                </Link>

                <Link
                  href="/dashboard/authors"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-raised border border-border/60 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-navy group-hover:text-brand transition">Author Profiles</p>
                      <p className="text-[10px] text-text-tertiary">Bylines & social links</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-navy px-2 py-0.5 rounded-md bg-white border border-border">
                    {stats.authors}
                  </span>
                </Link>

                <Link
                  href="/dashboard/webhooks"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-raised border border-border/60 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy">
                      <Webhook className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-navy group-hover:text-brand transition">Webhooks</p>
                      <p className="text-[10px] text-text-tertiary">Real-time sync triggers</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-navy px-2 py-0.5 rounded-md bg-white border border-border">
                    {stats.webhooks}
                  </span>
                </Link>
              </div>
            </div>

            {/* CLI & Headless Developer Connect Card */}
            <div className="rounded-2xl border border-navy/20 bg-linear-to-br from-navy to-[#0F172A] p-5 text-white shadow-md">
              <div className="flex items-center gap-2 text-brand">
                <Terminal className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">CLI & Headless API</span>
              </div>
              <p className="mt-2 text-xs text-white/80 leading-relaxed">
                Connect your frontend Next.js / Astro blog starter in seconds with the official CLI.
              </p>
              <div className="mt-3 rounded-xl bg-black/40 border border-white/10 p-2.5 font-mono text-[11px] text-brand select-all">
                npx openpost-cli init my-blog
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10">
                <Link
                  href="/cli/connect"
                  className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-brand transition"
                >
                  CLI Connect Code <ArrowUpRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/docs"
                  className="text-xs text-white/60 hover:text-white transition"
                >
                  API Docs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
