"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  ArrowUpDown,
  FileText,
  Eye,
  Edit3,
  Clock,
  CheckCircle2,
  Archive,
  SearchX,
  AlertTriangle,
  RefreshCw,
  Folder,
  Tag,
  Calendar,
  ShieldAlert,
  HelpCircle,
  X,
  MessageSquareQuote,
  ShieldCheck,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

type Status = "all" | "draft" | "published" | "scheduled" | "trash";

interface Post {
  id: string;
  title: string;
  slug: string;
  status: Exclude<Status, "all">;
  author: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
  updatedAt: string;
  wordCount: number;
  readingTime: number;
  trashReason?: string;
  trashedBy?: string;
  trashedAt?: string;
}

const statusStyles: Record<Exclude<Status, "all">, string> = {
  draft: "bg-brand/10 text-brand-dark border-brand/20",
  published: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  scheduled: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  trash: "bg-flame/10 text-flame border-flame/20",
};

const COMMON_TRASH_REASONS = [
  "Outdated information",
  "Duplicate article",
  "Author requested removal",
  "Low quality / inaccurate",
  "Draft no longer needed",
  "Replaced by updated post",
];

export default function BlogsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState<Status>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "title" | "updated">("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Trashing (Soft Delete) state
  const [trashTarget, setTrashTarget] = useState<Post | null>(null);
  const [trashReason, setTrashReason] = useState("");
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState<string | null>(null);

  // Permanent Delete (Admin Final Delete) state
  const [permanentTarget, setPermanentTarget] = useState<Post | null>(null);
  const [permanentLoading, setPermanentLoading] = useState(false);
  const [permanentError, setPermanentError] = useState<string | null>(null);

  const [categoryList, setCategoryList] = useState<Array<{ id: string; name: string }>>([]);
  const [userRole, setUserRole] = useState<string>("OWNER");

  const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const projQuery = activeProjId ? `&projectId=${activeProjId}` : "";
      const catQuery = activeProjId ? `?project=${activeProjId}` : "";
      const projHeaders: Record<string, string> = activeProjId ? { "X-OpenPost-Project": activeProjId } : {};

      const [blogsRes, catsRes, statsRes] = await Promise.all([
        fetch(`/api/blogs?limit=100&_t=${Date.now()}${projQuery}`, {
          cache: "no-store",
          headers: projHeaders,
        }).then((r) => r.json()),
        fetch(`/api/v1/categories${catQuery}`, {
          cache: "no-store",
          headers: projHeaders,
        }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/dashboard/stats${activeProjId ? `?projectId=${activeProjId}` : ""}`, {
          cache: "no-store",
          headers: projHeaders,
        }).then((r) => r.json()).catch(() => ({ data: {} })),
      ]);

      if (statsRes?.data?.userRole) {
        setUserRole(statsRes.data.userRole);
      }

      if (Array.isArray(catsRes.data)) {
        setCategoryList(catsRes.data);
      }

      if (Array.isArray(blogsRes.data)) {
        const mapped: Post[] = blogsRes.data.map((b: any) => {
          const seo = typeof b.seo === "object" && b.seo !== null ? b.seo : {};
          return {
            id: b.id,
            title: b.title || "Untitled Article",
            slug: b.slug,
            status: b.status as Exclude<Status, "all">,
            author: b.author?.name ?? "Author",
            category: b.category?.name ?? "Uncategorized",
            tags: [],
            publishedAt: b.publishedAt ?? b.createdAt ?? null,
            updatedAt: b.updatedAt ?? b.createdAt ?? "",
            wordCount: b.wordCount ?? 0,
            readingTime: b.readingTime ?? 1,
            trashReason: seo.trashReason,
            trashedBy: seo.trashedBy,
            trashedAt: seo.trashedAt,
          };
        });
        setPosts(mapped);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    const handleProjectChanged = () => fetchPosts();
    window.addEventListener("projectChanged", handleProjectChanged);
    return () => window.removeEventListener("projectChanged", handleProjectChanged);
  }, [fetchPosts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, selectedCategory, sort]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    categoryList.forEach((c) => set.add(c.name));
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [categoryList, posts]);

  const filtered = useMemo(() => {
    let out = [...posts];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      out = out.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.trashReason && p.trashReason.toLowerCase().includes(q))
      );
    }
    if (status !== "all") {
      out = out.filter((p) => p.status === status);
    }
    if (selectedCategory !== "all") {
      out = out.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (sort === "title") {
      out.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "oldest") {
      out.sort((a, b) => (a.publishedAt ?? a.updatedAt).localeCompare(b.publishedAt ?? b.updatedAt));
    } else {
      out.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    }
    return out;
  }, [posts, debouncedSearch, status, selectedCategory, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  // 1. Soft Delete with Reason
  const handleConfirmMoveToTrash = async () => {
    if (!trashTarget) return;
    setTrashLoading(true);
    setTrashError(null);
    try {
      const res = await fetch(`/api/blogs/${trashTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trashReason.trim() || "No reason specified" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error?.message ?? "Failed to move article to trash");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === trashTarget.id
            ? {
                ...p,
                status: "trash" as const,
                trashReason: trashReason.trim() || "No reason specified",
              }
            : p
        )
      );
      setTrashTarget(null);
      setTrashReason("");
    } catch (e: any) {
      setTrashError(e.message);
    } finally {
      setTrashLoading(false);
    }
  };

  // 2. Final Permanent Delete (Admin/Owner)
  const handleConfirmPermanentDelete = async () => {
    if (!permanentTarget) return;
    setPermanentLoading(true);
    setPermanentError(null);
    try {
      const res = await fetch(`/api/blogs/${permanentTarget.id}?permanent=true`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permanent: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error?.message ?? "Permanent delete failed. Only administrators can delete from trash.");

      setPosts((prev) => prev.filter((p) => p.id !== permanentTarget.id));
      setPermanentTarget(null);
    } catch (e: any) {
      setPermanentError(e.message);
    } finally {
      setPermanentLoading(false);
    }
  };

  const handleRestore = async (post: Post) => {
    try {
      const res = await fetch(`/api/blogs/${post.id}/restore`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error?.message ?? "Restore failed");
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: (j.data?.status ?? "draft") as any, trashReason: undefined } : p))
      );
    } catch (err: any) {
      alert(err.message || "Failed to restore article");
    }
  };

  const handleBulkTrash = async () => {
    for (const id of selected) {
      await fetch(`/api/blogs/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Bulk moved to trash" }),
      }).catch(() => {});
    }
    setPosts((prev) =>
      prev.map((p) => (selected.has(p.id) ? { ...p, status: "trash" as const, trashReason: "Bulk moved to trash" } : p))
    );
    setSelected(new Set());
  };

  return (
    <div className="min-h-screen bg-[#F0F0F1] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
              Articles & Publications
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary flex items-center gap-2 flex-wrap">
              <span>{posts.length} total articles</span>
              <span>·</span>
              <span className="text-emerald-600 font-semibold">{posts.filter((p) => p.status === "published").length} published</span>
              <span>·</span>
              <span className="text-brand font-semibold">{posts.filter((p) => p.status === "draft").length} drafts</span>
              {posts.some((p) => p.status === "trash") && (
                <>
                  <span>·</span>
                  <span className="text-flame font-semibold">{posts.filter((p) => p.status === "trash").length} in trash</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchPosts}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-navy hover:bg-surface-raised transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-brand" : ""}`} /> Refresh
            </button>
            <Link
              href="/dashboard/editor"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D3440] px-5 py-2.5 text-sm font-bold text-white hover:bg-navy transition shadow-sm"
            >
              <Plus className="h-4 w-4" /> New Article
            </Link>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, slug, category, or delete reason..."
              className="h-11 w-full rounded-2xl border border-border bg-white pl-10 pr-4 text-sm placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
            />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            {/* Category Dropdown Filter */}
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 shadow-xs">
              <Folder className="h-4 w-4 text-text-tertiary" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-11 bg-transparent text-xs sm:text-sm font-medium text-navy focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown Filter */}
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 shadow-xs">
              <Filter className="h-4 w-4 text-text-tertiary" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="h-11 bg-transparent text-xs sm:text-sm font-medium text-navy focus:outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="trash">Trash</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 shadow-xs">
              <ArrowUpDown className="h-4 w-4 text-text-tertiary" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as never)}
                className="h-11 bg-transparent text-xs sm:text-sm font-medium text-navy focus:outline-none cursor-pointer"
              >
                <option value="newest">Recently Updated</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Quick-Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 select-none">
          {[
            { key: "all", label: "All Articles", count: posts.length },
            { key: "published", label: "Published", count: posts.filter((p) => p.status === "published").length },
            { key: "draft", label: "Drafts", count: posts.filter((p) => p.status === "draft").length },
            { key: "scheduled", label: "Scheduled", count: posts.filter((p) => p.status === "scheduled").length },
            { key: "trash", label: "Trash Bin", count: posts.filter((p) => p.status === "trash").length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key as Status)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                status === tab.key
                  ? "bg-navy text-white border-navy shadow-xs"
                  : "bg-white border-border text-text-secondary hover:bg-surface-raised"
              }`}
            >
              {tab.label}{" "}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  status === tab.key ? "bg-white/20 text-white" : "bg-surface-dim text-text-tertiary"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-brand/20 bg-brand/5 p-3.5 shadow-xs">
            <span className="text-xs sm:text-sm font-bold text-navy">{selected.size} articles selected</span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleBulkTrash}
                className="rounded-xl border border-flame/30 bg-white px-3.5 py-1.5 text-xs font-bold text-flame hover:bg-flame/10 transition shadow-xs cursor-pointer"
              >
                Move Selected to Trash
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-xl bg-navy px-3.5 py-1.5 text-xs font-bold text-white hover:bg-navy/90 transition shadow-xs cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* Move to Trash Modal (Soft Delete with Reason) */}
        {trashTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-extrabold text-navy text-base">Move Article to Trash</h3>
                </div>
                <button
                  onClick={() => {
                    setTrashTarget(null);
                    setTrashReason("");
                    setTrashError(null);
                  }}
                  className="rounded-lg p-1 text-text-tertiary hover:text-navy hover:bg-surface-raised transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                <p className="text-xs sm:text-sm text-text-secondary">
                  Moving <span className="font-bold text-navy">"{trashTarget.title}"</span> to trash. The article will be unindexed and unpublished.
                </p>

                {/* Reason Requirement */}
                <div className="mt-4">
                  <label className="block text-xs font-bold text-navy mb-1.5 flex items-center gap-1.5">
                    <MessageSquareQuote className="h-3.5 w-3.5 text-brand" /> Deletion Reason (Required for Audit Log)
                  </label>
                  
                  {/* Common Preset Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {COMMON_TRASH_REASONS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTrashReason(preset)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          trashReason === preset
                            ? "bg-navy text-white border-navy font-bold"
                            : "bg-surface text-text-secondary border-border hover:bg-surface-raised"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={trashReason}
                    onChange={(e) => setTrashReason(e.target.value)}
                    placeholder="Enter why this article is being moved to trash..."
                    rows={3}
                    className="w-full rounded-xl border border-border p-3 text-xs sm:text-sm placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-inner"
                  />
                </div>

                {trashError && (
                  <p className="mt-3 rounded-xl bg-flame/10 p-3 text-xs text-flame font-medium">
                    {trashError}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setTrashTarget(null);
                    setTrashReason("");
                    setTrashError(null);
                  }}
                  className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-navy hover:bg-surface-raised transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={trashLoading}
                  onClick={handleConfirmMoveToTrash}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-flame px-5 py-2 text-xs font-bold text-white hover:bg-flame/90 transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {trashLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Confirm Move to Trash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permanent Deletion Confirmation Modal (ADMIN & OWNER Only) */}
        {permanentTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-3xl border border-flame/40 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5 text-flame">
                  <ShieldAlert className="h-5 w-5" />
                  <h3 className="font-extrabold text-navy text-base">Permanent Article Purge (Admin Only)</h3>
                </div>
                <button
                  onClick={() => {
                    setPermanentTarget(null);
                    setPermanentError(null);
                  }}
                  className="rounded-lg p-1 text-text-tertiary hover:text-navy hover:bg-surface-raised transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-flame/20 bg-flame/5 p-3.5 text-xs text-flame leading-relaxed">
                  <strong className="block font-bold">⚠️ Warning: Irreversible Action</strong>
                  Permanently purging <span className="font-bold underline">{permanentTarget.title}</span> will delete the database record, all associated revisions, media attachments, and reader comments permanently.
                </div>

                {permanentTarget.trashReason && (
                  <div className="rounded-xl border border-border bg-surface p-3 text-xs">
                    <span className="font-bold text-navy">Original Move-to-Trash Reason:</span>
                    <p className="mt-0.5 text-text-secondary italic">"{permanentTarget.trashReason}"</p>
                  </div>
                )}

                {permanentError && (
                  <p className="rounded-xl bg-flame/10 p-3 text-xs text-flame font-medium">
                    {permanentError}
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setPermanentTarget(null);
                    setPermanentError(null);
                  }}
                  className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-navy hover:bg-surface-raised transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={permanentLoading}
                  onClick={handleConfirmPermanentDelete}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-flame px-5 py-2 text-xs font-bold text-white hover:bg-flame/90 transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {permanentLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Purge Article Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-dim border-b border-border">
                <tr className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === paginated.length && paginated.length > 0}
                      onChange={(e) =>
                        setSelected(e.target.checked ? new Set(paginated.map((p) => p.id)) : new Set())
                      }
                      className="rounded border-border text-brand focus:ring-brand/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">Title & Identification</th>
                  <th className="px-4 py-3.5">Status & Reason</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Author</th>
                  <th className="px-4 py-3.5 hidden lg:table-cell">Category</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">Word Count</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-brand" />
                        <p className="text-xs font-bold text-navy">Loading articles...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="mx-auto max-w-sm">
                        {posts.length === 0 ? (
                          <>
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
                              <FileText className="h-7 w-7 text-brand" />
                            </div>
                            <p className="mt-4 text-base font-bold text-navy">No articles yet</p>
                            <p className="mt-1.5 text-xs text-text-secondary">
                              Create your first article to get started with your blog.
                            </p>
                            <Link
                              href="/dashboard/editor"
                              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2D3440] px-5 py-2.5 text-sm font-bold text-white hover:bg-navy transition shadow-sm"
                            >
                              <Plus className="h-4 w-4" /> New Article
                            </Link>
                          </>
                        ) : (
                          <>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-dim">
                              <SearchX className="h-6 w-6 text-text-tertiary" />
                            </div>
                            <p className="mt-4 text-sm font-bold text-navy">No matching articles</p>
                            <p className="mt-1 text-xs text-text-secondary">
                              Try adjusting search keywords, status filter, or category selection.
                            </p>
                            <button
                              onClick={() => {
                                setSearch("");
                                setStatus("all");
                                setSelectedCategory("all");
                              }}
                              className="mt-4 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-navy hover:bg-surface-raised transition shadow-xs cursor-pointer"
                            >
                              Reset Filters
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((post) => (
                    <tr key={post.id} className="hover:bg-surface-dim/40 transition">
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(post.id)}
                          onChange={() => toggleSelect(post.id)}
                          className="rounded border-border text-brand focus:ring-brand/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5 max-w-xs sm:max-w-md">
                        <Link
                          href={`/dashboard/editor/${post.id}`}
                          className="text-sm font-bold text-navy hover:text-brand transition line-clamp-1 block"
                        >
                          {post.title}
                        </Link>
                        <p className="text-[11px] font-mono text-text-tertiary mt-0.5">
                          /{post.slug} · ~{post.readingTime} min read
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                              statusStyles[post.status]
                            }`}
                          >
                            {post.status === "published" && <CheckCircle2 className="h-3 w-3" />}
                            {post.status === "scheduled" && <Clock className="h-3 w-3" />}
                            {post.status === "draft" && <Edit3 className="h-3 w-3" />}
                            {post.status === "trash" && <Trash2 className="h-3 w-3" />}
                            {post.status}
                          </span>
                          {post.status === "trash" && post.trashReason && (
                            <span className="text-[10px] text-flame/90 font-medium bg-flame/5 px-2 py-0.5 rounded border border-flame/20 max-w-xs truncate" title={post.trashReason}>
                              Reason: {post.trashReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs font-medium text-text-secondary">
                        {post.author}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-surface-dim border border-border/80 px-2.5 py-1 text-xs font-semibold text-text-secondary">
                          <Folder className="h-3 w-3 text-text-tertiary" /> {post.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-xs font-mono text-text-secondary">
                        {post.wordCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {post.status !== "trash" && (
                            <>
                              <Link
                                href={`/dashboard/editor/${post.id}`}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-text-secondary hover:bg-surface-raised hover:text-navy transition shadow-2xs"
                                title="Edit Article"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Link>
                              {post.status === "published" && (
                                <Link
                                  href={`/blog/${post.slug}`}
                                  target="_blank"
                                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-text-secondary hover:bg-surface-raised hover:text-navy transition shadow-2xs"
                                  title="View Published Page"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Link>
                              )}
                              <button
                                onClick={() => setTrashTarget(post)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-flame hover:bg-flame/10 transition shadow-2xs cursor-pointer"
                                title="Move to Trash"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          {post.status === "trash" && (
                            <>
                              <button
                                onClick={() => handleRestore(post)}
                                className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition shadow-2xs cursor-pointer"
                                title="Restore Article"
                              >
                                <Archive className="h-3.5 w-3.5" /> Restore
                              </button>
                              
                              {/* Final Delete (Admin / Owner) */}
                              {isAdmin ? (
                                <button
                                  onClick={() => setPermanentTarget(post)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-flame px-2.5 py-1.5 text-xs font-bold text-white hover:bg-flame/90 transition shadow-2xs cursor-pointer"
                                  title="Permanently Delete Article (Admin only)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Purge
                                </button>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] text-text-tertiary bg-surface-dim px-2 py-1 rounded-lg border border-border"
                                  title="Only Admin / Owner can permanently delete"
                                >
                                  <ShieldCheck className="h-3 w-3" /> Admin Purge
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border bg-surface-dim px-4 py-3 gap-3">
            <div className="flex items-center gap-3">
              <p className="text-xs text-text-tertiary">
                Page {page} of {totalPages} · {filtered.length} matching articles
              </p>
              <div className="flex items-center gap-1 text-xs text-text-tertiary">
                <span>Per page:</span>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="rounded-lg border border-border bg-white px-2 py-1 text-xs font-semibold text-navy cursor-pointer focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-border bg-white px-3.5 py-1.5 text-xs font-bold text-navy disabled:opacity-40 hover:bg-surface-raised transition shadow-2xs cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl border border-border bg-white px-3.5 py-1.5 text-xs font-bold text-navy disabled:opacity-40 hover:bg-surface-raised transition shadow-2xs cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
