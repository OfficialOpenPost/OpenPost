"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, Plus, Trash2, MoreHorizontal, ArrowUpDown, Eye, Edit3, Clock, CheckCircle2, Archive, SearchX, AlertTriangle } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "title" | "updated">("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch real posts from Supabase via API — falls back to [] for new forks
    fetch("/api/blogs?limit=50")
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.data)) {
          const mapped: Post[] = j.data.map((b: any) => ({
            id: b.id,
            title: b.title,
            slug: b.slug,
            status: b.status as Exclude<Status, "all">,
            author: "You",
            category: b.category?.name ?? "Uncategorized",
            tags: [],
            publishedAt: b.publishedAt ?? b.createdAt ?? null,
            wordCount: b.wordCount ?? 0,
            readingTime: b.readingTime ?? 1,
          }));
          setPosts(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let out = [...posts];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      out = out.filter((p) => p.title.toLowerCase().includes(q) || p.slug.includes(q) || p.category.toLowerCase().includes(q));
    }
    if (status !== "all") out = out.filter((p) => p.status === status);
    if (sort === "title") out.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "oldest") out.sort((a, b) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? ""));
    else out.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
    return out;
  }, [debouncedSearch, status, sort]);

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
    } catch (e: any) { setDeleteError(e.message); }
  };
  const handleRestore = async (post: Post) => {
    try {
      const res = await fetch(`/api/blogs/${post.id}/restore`, { method: "POST" });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(j.error?.message ?? "Restore failed");
      setPosts((prev)=>prev.map((p)=>(p.id===post.id ? {...p, status: (j.data?.status ?? "draft") as any } : p)));
    } catch {}
  };

  const handleBulkTrash = async () => {
    for (const id of selected) {
      await fetch(`/api/blogs/${id}`, { method: "DELETE" }).catch(() => {});
    }
    setPosts((prev) => prev.map((p) => (selected.has(p.id) ? { ...p, status: "trash" as const } : p)));
    setSelected(new Set());
  };

  const isEmpty = posts.length === 0;

  return (
    <div className="min-h-screen bg-[#F0F0F1] p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal text-navy" style={{ fontFamily: "var(--font-geist-sans)" }}>
            Posts
          </h1>
          <Link href="/dashboard/editor" className="inline-flex items-center rounded-md border border-[#2271B1] bg-white px-3 py-1 text-sm font-medium text-[#2271B1] hover:bg-[#F0F6FC]">
            Add New Post
          </Link>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {isEmpty ? "No posts yet — create your first post." : `${filtered.length} posts · ${posts.filter((p) => p.status === "published").length} published`}
        </p>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, slug, category..."
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2">
            <Filter className="h-4 w-4 text-text-tertiary" />
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="h-10 bg-transparent text-sm font-medium text-text-primary focus:outline-none">
              <option value="all">All status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="trash">Trash</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2">
            <ArrowUpDown className="h-4 w-4 text-text-tertiary" />
            <select value={sort} onChange={(e) => setSort(e.target.value as never)} className="h-10 bg-transparent text-sm font-medium text-text-primary focus:outline-none">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title A-Z</option>
              <option value="updated">Last updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
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
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${status === tab.key ? "bg-navy text-white border-navy" : "bg-surface border-border text-text-secondary hover:bg-surface-raised"}`}
          >
            {tab.label} <span className={`rounded-full px-1.5 py-0.5 text-xs ${status === tab.key ? "bg-white/20 text-white" : "bg-surface-raised text-text-tertiary"}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 p-3">
          <span className="text-sm font-semibold text-navy">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <button onClick={handleBulkTrash} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold hover:bg-surface-raised">Move to Trash</button>
            <button onClick={() => setSelected(new Set())} className="rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white">Clear</button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600"><AlertTriangle className="h-5 w-5" /><h3 className="font-bold text-navy">Move to trash?</h3></div>
            <p className="mt-3 text-sm text-text-secondary">Move <span className="font-semibold">{deleteTarget.title}</span> to trash? You can restore from trash later. Trash items are hard-deleted on second delete.</p>
            {deleteError && <p className="mt-3 rounded-xl bg-flame/10 p-3 text-sm text-flame">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setDeleteTarget(null); setDeleteError(null); }} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="rounded-xl bg-flame px-5 py-2.5 text-sm font-bold text-white">Move to Trash</button>
            </div>
          </div>
        </div>
      )}

      {/* Table — WordPress list table, fixed heights */}
      <div className="mt-6 overflow-hidden rounded-md border border-[#C3C4C7] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-raised border-b border-border">
              <tr className="text-xs font-semibold text-text-tertiary">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === paginated.length && paginated.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? new Set(paginated.map((p) => p.id)) : new Set())}
                    className="rounded border-border text-brand focus:ring-brand/20"
                  />
                </th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden md:table-cell">Author</th>
                <th className="px-4 py-3 hidden lg:table-cell">Category</th>
                <th className="px-4 py-3 hidden sm:table-cell">Words</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised">
                        <SearchX className="h-6 w-6 text-text-tertiary" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-text-primary">No posts found</p>
                      <p className="mt-1 text-sm text-text-secondary">Try a different search or clear filters.</p>
                      <button
                        onClick={() => {
                          setSearch("");
                          setStatus("all");
                        }}
                        className="mt-4 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-raised"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((post) => (
                  <tr key={post.id} className="hover:bg-surface-raised/50 transition">
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleSelect(post.id)} className="rounded border-border text-brand focus:ring-brand/20" />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-navy line-clamp-1">{post.title}</p>
                      <p className="text-xs font-mono text-text-tertiary">/{post.slug} · {post.readingTime} min</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[post.status]}`}>
                        {post.status === "published" && <CheckCircle2 className="h-3 w-3" />}
                        {post.status === "scheduled" && <Clock className="h-3 w-3" />}
                        {post.status === "draft" && <Edit3 className="h-3 w-3" />}
                        {post.status === "trash" && <Trash2 className="h-3 w-3" />}
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell text-sm text-text-secondary">{post.author}</td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium text-text-secondary">{post.category}</span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell text-sm text-text-secondary">{post.wordCount}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/editor/${post.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised">
                          <Edit3 className="h-4 w-4 text-text-secondary" />
                        </Link>
                        <Link href={`/blog/${post.slug}`} target="_blank" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised">
                          <Eye className="h-4 w-4 text-text-secondary" />
                        </Link>
                        {post.status==="trash" ? (
                          <button onClick={()=>handleRestore(post)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-success/10 text-success" title="Restore">
                            <Archive className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => setDeleteTarget(post)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-flame/10 text-flame">
                            <Trash2 className="h-4 w-4" />
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

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border bg-surface-raised px-4 py-3">
          <p className="text-xs text-text-tertiary">
            Page {page} of {totalPages} · {filtered.length} posts
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold disabled:opacity-40 hover:bg-surface-raised"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold disabled:opacity-40 hover:bg-surface-raised"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
