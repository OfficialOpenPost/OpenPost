"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

interface PostItem {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft" | "scheduled" | "trash";
  updatedAt: string;
  wordCount?: number;
  readingTime?: number;
  category?: { name: string } | string;
  author?: { name: string } | string;
}

export default function DashboardPage() {
  const [blogs, setBlogs] = useState<PostItem[]>([]);
  const [stats, setStats] = useState({
    published: 0,
    drafts: 0,
    scheduled: 0,
    trash: 0,
    categories: 0,
    tags: 0,
    authors: 0,
    media: 0,
    totalWords: 0,
    avgReadingTime: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const projQuery = activeProjId ? `&projectId=${activeProjId}` : "";
      const projHeader: Record<string, string> = activeProjId ? { "X-OpenPost-Project": activeProjId } : {};

      const [blogsRes, catsRes, tagsRes, authorsRes, mediaRes] = await Promise.all([
        fetch(`/api/blogs?limit=50&_t=${Date.now()}${projQuery}`, {
          cache: "no-store",
          headers: projHeader,
        }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/v1/categories${activeProjId ? `?project=${activeProjId}` : ""}`, {
          cache: "no-store",
          headers: projHeader,
        }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/v1/tags${activeProjId ? `?project=${activeProjId}` : ""}`, {
          cache: "no-store",
          headers: projHeader,
        }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/v1/authors${activeProjId ? `?project=${activeProjId}` : ""}`, {
          cache: "no-store",
          headers: projHeader,
        }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/media?limit=1${projQuery}`, {
          cache: "no-store",
          headers: projHeader,
        }).then((r) => r.json()).catch(() => ({ data: [], meta: { total: 0 } })),
      ]);

      const postList: PostItem[] = Array.isArray(blogsRes.data) ? blogsRes.data : [];
      setBlogs(postList);

      const published = postList.filter((b) => b.status === "published").length;
      const drafts = postList.filter((b) => b.status === "draft").length;
      const scheduled = postList.filter((b) => b.status === "scheduled").length;
      const trash = postList.filter((b) => b.status === "trash").length;

      const totalWords = postList.reduce((acc, b) => acc + (b.wordCount || 0), 0);
      const avgReadingTime = postList.length
        ? Math.round(postList.reduce((acc, b) => acc + (b.readingTime || 0), 0) / postList.length)
        : 0;

      setStats({
        published,
        drafts,
        scheduled,
        trash,
        categories: Array.isArray(catsRes.data) ? catsRes.data.length : 0,
        tags: Array.isArray(tagsRes.data) ? tagsRes.data.length : 0,
        authors: Array.isArray(authorsRes.data) ? authorsRes.data.length : 0,
        media: mediaRes.meta?.total ?? (Array.isArray(mediaRes.data) ? mediaRes.data.length : 0),
        totalWords,
        avgReadingTime,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Listen to project switch events
    const handleProjectChange = () => fetchDashboardData();
    window.addEventListener("projectChanged", handleProjectChange);
    return () => window.removeEventListener("projectChanged", handleProjectChange);
  }, []);

  const statCards = [
    { label: "Published", value: stats.published, change: "Live on blog", icon: Eye, color: "emerald" },
    { label: "Drafts", value: stats.drafts, change: "Work in progress", icon: FileText, color: "brand" },
    { label: "Scheduled", value: stats.scheduled, change: "Upcoming release", icon: Clock, color: "orange" },
    { label: "Categories", value: stats.categories, change: "Taxonomy trees", icon: Folder, color: "navy" },
  ];

  return (
    <div className="min-h-screen bg-[#F0F0F1]">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-navy">All CMS systems operational</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-navy">
              Editorial Command Center
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
              <span>· Live multi-website content overview</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-semibold text-navy hover:bg-surface-raised transition shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link
              href="/dashboard/editor"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-navy shadow-md shadow-brand/20 hover:bg-brand-hover hover:text-white transition"
            >
              <PenLine className="h-4 w-4" /> New Article
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="rounded-2xl border border-border bg-white p-5 shadow-xs hover:border-brand/30 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-navy">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Live
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl sm:text-3xl font-extrabold text-navy">
                  {loading ? "..." : s.value}
                </p>
                <p className="text-xs font-bold text-text-primary mt-0.5">{s.label}</p>
                <p className="text-[11px] text-text-tertiary mt-1 pt-2 border-t border-border">{s.change}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid: Recently Edited Articles + Quick Actions */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Recently Edited Posts (8 cols) */}
          <div className="lg:col-span-8 rounded-2xl border border-border bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand" /> Recently Edited Articles
              </h2>
              <Link
                href="/dashboard/blogs"
                className="text-xs font-bold text-brand hover:text-navy inline-flex items-center gap-1 transition"
              >
                View all articles <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {blogs.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border bg-[#FCFCF9] p-8 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-navy">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-navy">No articles written yet</h3>
                  <p className="mt-1 text-xs text-text-secondary max-w-sm mx-auto">
                    Start drafting in the interactive block editor. Your articles will automatically appear here.
                  </p>
                  <Link
                    href="/dashboard/editor"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Article
                  </Link>
                </div>
              ) : (
                blogs.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-[#FCFCF9] p-4 hover:border-brand/40 hover:bg-white transition group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            post.status === "published"
                              ? "bg-emerald-100 text-emerald-800"
                              : post.status === "scheduled"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-brand/15 text-navy"
                          }`}
                        >
                          {post.status}
                        </span>
                        <span className="text-[11px] font-mono text-text-tertiary">
                          /{post.slug}
                        </span>
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-navy group-hover:text-brand transition truncate">
                        {post.title}
                      </h3>
                      <p className="mt-1 text-[11px] text-text-tertiary">
                        {post.wordCount ?? 0} words · {post.readingTime ?? 1} min read · Updated{" "}
                        {new Date(post.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/editor/${post.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-navy hover:bg-brand hover:text-navy transition shadow-xs"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </Link>
                      {post.status === "published" && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-navy hover:bg-surface-raised transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Quick Operations & Stats (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Quick Operations Box */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
                Content Modules
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "New Article", href: "/dashboard/editor", icon: PenLine, bg: "bg-brand/15 text-navy" },
                  { label: "Media Library", href: "/dashboard/media", icon: ImageIcon, bg: "bg-surface-dim text-navy" },
                  { label: "Categories", href: "/dashboard/categories", icon: Folder, bg: "bg-surface-dim text-navy" },
                  { label: "Tags", href: "/dashboard/tags", icon: Tag, bg: "bg-surface-dim text-navy" },
                  { label: "Authors & Team", href: "/dashboard/authors", icon: Users, bg: "bg-surface-dim text-navy" },
                  { label: "Webhooks", href: "/dashboard/webhooks", icon: Webhook, bg: "bg-surface-dim text-navy" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex flex-col items-center justify-center rounded-xl border border-border bg-[#FCFCF9] p-3 text-center hover:border-brand/40 hover:bg-white transition group"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bg} mb-1.5 group-hover:scale-105 transition-transform`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-navy group-hover:text-brand">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Editorial Stats Snapshot */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
                Editorial Snapshot
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-text-secondary">Total Words Drafted</span>
                  <span className="font-mono font-bold text-navy">{stats.totalWords.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-text-secondary">Avg. Reading Time</span>
                  <span className="font-mono font-bold text-navy">{stats.avgReadingTime} mins</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-text-secondary">Active Authors</span>
                  <span className="font-mono font-bold text-navy">{stats.authors}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Media Assets Uploaded</span>
                  <span className="font-mono font-bold text-navy">{stats.media}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
