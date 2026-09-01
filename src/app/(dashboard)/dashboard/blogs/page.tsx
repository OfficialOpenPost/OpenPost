"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
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
  wordCount: number;
  readingTime: number;
}

const statusStyles: Record<Exclude<Status, "all">, string> = {
  draft: "bg-brand/10 text-brand border-brand/20",
  published: "bg-success/10 text-success border-success/20",
  scheduled: "bg-orange/10 text-orange border-orange/20",
  trash: "bg-flame/10 text-flame border-flame/20",
};

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
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<Array<{ id: string; name: string }>>([]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const [blogsRes, catsRes] = await Promise.all([
        fetch(`/api/blogs?limit=100&_t=${Date.now()}`, { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/v1/categories", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (Array.isArray(catsRes.data)) {
        setCategoryList(catsRes.data);
      }

      if (Array.isArray(blogsRes.data)) {
        const mapped: Post[] = blogsRes.data.map((b: any) => ({
          id: b.id,
          title: b.title || "Untitled Article",
          slug: b.slug,
          status: b.status as Exclude<Status, "all">,
          author: b.author?.name ?? "You",
          category: b.category?.name ?? "Uncategorized",
          tags: [],
          publishedAt: b.publishedAt ?? b.createdAt ?? null,
          wordCount: b.wordCount ?? 0,
          readingTime: b.readingTime ?? 1,
        }));
        setPosts(mapped);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, selectedCategory, sort]);

  // Extract all available categories from posts + categoryList
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
          p.category.toLowerCase().includes(q)
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
      out.sort((a, b) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? ""));
    } else {
      out.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
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

  const handleDelete = async (post: Post) => {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/blogs/${post.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error?.message ?? "Delete failed");
      const isTrash = j.data?.status === "trash";
      if (isTrash) setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: "trash" as const } : p)));
      else setPosts((prev) => prev.filter((p) => p.id !== post.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteError(e.message);
    }
  };

  const handleRestore = async (post: Post) => {
    try {
      const res = await fetch(`/api/blogs/${post.id}/restore`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error?.message ?? "Restore failed");
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: (j.data?.status ?? "draft") as any } : p)));
    } catch {}
  };

  const handleBulkTrash = async () => {
    for (const id of selected) {
      await fetch(`/api/blogs/${id}`, { method: "DELETE" }).catch(() => {});
    }
    setPosts((prev) => prev.map((p) => (selected.has(p.id) ? { ...p, status: "trash" as const } : p)));
    setSelected(new Set());
  };

  return (
    <div className="min-h-screen bg-[#F0F0F1] p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-navy">
                Articles & Posts
              </h1>
              <Link
                href="/dashboard/editor"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-navy hover:bg-brand-hover transition shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" /> New Article
              </Link>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">
              {posts.length} total articles · {posts.filter((p) => p.status === "published").length} published · {posts.filter((p) => p.status === "draft").length} drafts
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPosts}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-raised transition shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-brand" : ""}`} /> Refresh
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, slug, category..."
              className="h-11 w-full rounded-2xl border border-border bg-surface pl-10 pr-4 text-sm placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-xs"
            />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            {/* Category Dropdown Filter */}
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 shadow-xs">
              <Folder className="h-4 w-4 text-text-tertiary" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-11 bg-transparent text-xs sm:text-sm font-medium text-text-primary focus:outline-none cursor-pointer"
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
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 shadow-xs">
              <Filter className="h-4 w-4 text-text-tertiary" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="h-11 bg-transparent text-xs sm:text-sm font-medium text-text-primary focus:outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="trash">Trash</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 shadow-xs">
              <ArrowUpDown className="h-4 w-4 text-text-tertiary" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as never)}
                className="h-11 bg-transparent text-xs sm:text-sm font-medium text-text-primary focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Quick-Filter Tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 select-none">
          {[
            { key: "all", label: "All", count: posts.length },
            { key: "draft", label: "Drafts", count: posts.filter((p) => p.status === "draft").length },
            { key: "published", label: "Published", count: posts.filter((p) => p.status === "published").length },
            { key: "scheduled", label: "Scheduled", count: posts.filter((p) => p.status === "scheduled").length },
            { key: "trash", label: "Trash", count: posts.filter((p) => p.status === "trash").length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key as Status)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                status === tab.key
                  ? "bg-navy text-white border-navy shadow-xs"
                  : "bg-surface border-border text-text-secondary hover:bg-surface-raised"
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
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-brand/20 bg-brand/5 p-3 animate-in fade-in duration-150">
            <span className="text-xs sm:text-sm font-bold text-navy">{selected.size} selected</span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleBulkTrash}
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-flame hover:bg-flame/10 transition shadow-xs"
              >
                Move to Trash
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-xl bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy/90 transition shadow-xs"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-bold text-navy">Move to trash?</h3>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-text-secondary">
                Move <span className="font-semibold text-navy">{deleteTarget.title}</span> to trash? You can restore it later.
              </p>
              {deleteError && (
                <p className="mt-3 rounded-xl bg-flame/10 p-3 text-xs text-flame font-medium">
                  {deleteError}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteError(null);
                  }}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-navy hover:bg-surface-raised transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  className="rounded-xl bg-flame px-4 py-2 text-xs font-bold text-white hover:bg-flame/90 transition shadow-xs"
                >
                  Move to Trash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm">
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
                  <th className="px-4 py-3.5">Title & Slug</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Author</th>
                  <th className="px-4 py-3.5 hidden lg:table-cell">Category</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">Words</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
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
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-dim">
                          <SearchX className="h-6 w-6 text-text-tertiary" />
                        </div>
                        <p className="mt-4 text-sm font-bold text-navy">No articles found</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          Try a different search term, category, or clear filters.
                        </p>
                        <button
                          onClick={() => {
                            setSearch("");
                            setStatus("all");
                            setSelectedCategory("all");
                          }}
                          className="mt-4 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-navy hover:bg-surface-raised transition shadow-xs"
                        >
                          Clear all filters
                        </button>
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
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/editor/${post.id}`}
                          className="text-sm font-bold text-navy hover:text-brand transition line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        <p className="text-xs font-mono text-text-tertiary mt-0.5">
                          /{post.slug} · ~{post.readingTime} min read
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
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
                        {post.wordCount}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/editor/${post.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-text-secondary hover:bg-surface-raised hover:text-navy transition shadow-xs"
                            title="Edit Article"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-text-secondary hover:bg-surface-raised hover:text-navy transition shadow-xs"
                            title="View Live"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          {post.status === "trash" ? (
                            <button
                              onClick={() => handleRestore(post)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-success hover:bg-success/10 transition shadow-xs"
                              title="Restore from Trash"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteTarget(post)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-flame hover:bg-flame/10 transition shadow-xs"
                              title="Move to Trash"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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
          <div className="flex items-center justify-between border-t border-border bg-surface-dim px-4 py-3">
            <div className="flex items-center gap-3">
              <p className="text-xs text-text-tertiary">
                Page {page} of {totalPages} · {filtered.length} matching
              </p>
              <div className="hidden sm:flex items-center gap-1 text-xs text-text-tertiary">
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
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-navy disabled:opacity-40 hover:bg-surface-raised transition shadow-xs"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-navy disabled:opacity-40 hover:bg-surface-raised transition shadow-xs"
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
