"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit3, Trash2, User, X, Globe, AlertTriangle } from "lucide-react";
import { slugify } from "@/lib/slug";
import { useDebounce } from "@/hooks/useDebounce";

interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  email: string | null;
  website: string | null;
  social: { twitter?: string; linkedin?: string };
  postCount: number;
}

const INITIAL: Author[] = [];

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>(INITIAL);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [editing, setEditing] = useState<Author | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Author & { twitter: string; linkedin: string }>>({ name: "", slug: "", bio: "", email: "", website: "", twitter: "", linkedin: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchAuthors = async (q?: string) => {
    try {
      setLoading(true);
      const url = q ? `/api/v1/authors?search=${encodeURIComponent(q)}` : "/api/v1/authors";
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) setAuthors(json.data.map((a: any) => ({ ...a, social: a.socialLinks ?? a.social ?? {}, postCount: 0 })));
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAuthors(); }, []);
  useEffect(() => { if (debouncedSearch) fetchAuthors(debouncedSearch); else fetchAuthors(); }, [debouncedSearch]);

  const filtered = authors.filter((a) => a.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || a.slug.includes(debouncedSearch.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", bio: "", email: "", website: "", twitter: "", linkedin: "" });
    setError(null);
    setShowModal(true);
  };
  const openEdit = (a: Author) => {
    setEditing(a);
    setForm({ ...a, twitter: a.social.twitter ?? "", linkedin: a.social.linkedin ?? "" });
    setError(null);
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true); setError(null);
    try {
      const slug = slugify(form.slug || form.name || "");
      const payload = { name: form.name, slug, bio: form.bio || null, email: form.email || null, website: form.website || null, twitter: form.twitter || null, linkedin: form.linkedin || null };
      const url = editing ? `/api/v1/authors/${editing.id}` : "/api/v1/authors";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed");
      await fetchAuthors(debouncedSearch);
      setShowModal(false);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const handleDelete = async (a: Author) => {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/authors/${a.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { if (json.error?.code === "IN_USE") { setDeleteError(json.error.message); return; } throw new Error(json.error?.message ?? "Delete failed"); }
      setAuthors((prev) => prev.filter((x) => x.id !== a.id));
      setDeleteTarget(null);
    } catch (e: any) { setDeleteError(e.message); }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Authors</h1>
          <p className="mt-1 text-sm text-text-secondary">Public bylines — linked to user accounts or guest authors. Supports co-authors.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover transition">
          <Plus className="h-4 w-4" /> New Author
        </button>
      </div>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search authors..." className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((author) => (
          <div key={author.id} className="rounded-2xl border border-border bg-surface p-6 h-[240px] flex flex-col hover:border-brand/20 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-orange text-white font-bold">
                {author.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(author)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised">
                  <Edit3 className="h-3.5 w-3.5 text-text-secondary" />
                </button>
                <button onClick={() => setDeleteTarget(author)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-flame/10 text-flame">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <h3 className="mt-4 text-base font-bold text-navy">{author.name}</h3>
            <p className="font-mono text-xs text-brand">/{author.slug}</p>
            <p className="mt-2 text-sm text-text-secondary line-clamp-2">{author.bio ?? "No bio"}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
              <span>{author.postCount} posts</span>
              {author.website && (
                <>
                  <span>·</span>
                  <a href={author.website} target="_blank" className="inline-flex items-center gap-1 text-brand hover:underline">
                    <Globe className="h-3 w-3" /> Website
                  </a>
                </>
              )}
            </div>
            {(author.social.twitter || author.social.linkedin) && (
              <div className="mt-3 flex gap-2">
                {author.social.twitter && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-1 text-xs">
                    𝕏 {author.social.twitter}
                  </span>
                )}
                {author.social.linkedin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-1 text-xs">
                    in {author.social.linkedin}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && <p className="py-8 text-center text-sm text-text-tertiary">Loading…</p>}
      {!loading && filtered.length === 0 && <p className="py-12 text-center text-sm text-text-tertiary">No authors found.</p>}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600"><AlertTriangle className="h-5 w-5" /><h3 className="font-bold text-navy">Delete author?</h3></div>
            <p className="mt-3 text-sm text-text-secondary">Delete <span className="font-semibold">{deleteTarget.name}</span>?</p>
            {deleteError && <p className="mt-3 rounded-xl bg-flame/10 p-3 text-sm text-flame">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setDeleteTarget(null); setDeleteError(null); }} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="rounded-xl bg-flame px-5 py-2.5 text-sm font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">{editing ? "Edit Author" : "New Author"}</h2>
              <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-raised">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary">Name</label>
                <input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="Priya Sharma" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Slug</label>
                <input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="priya-sharma" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Bio</label>
                <textarea value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Short bio..." className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-text-primary">Email (internal)</label>
                  <input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="priya@example.com" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">Website</label>
                  <input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-text-primary">Twitter</label>
                  <input value={form.twitter ?? ""} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="@username" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">LinkedIn</label>
                  <input value={form.linkedin ?? ""} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="username" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
              </div>
            </div>
            {error && <p className="mt-4 rounded-xl bg-flame/10 p-3 text-sm text-flame">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
