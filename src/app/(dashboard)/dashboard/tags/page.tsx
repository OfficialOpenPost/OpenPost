"use client";

import { useState } from "react";
import { Plus, Search, Edit3, Trash2, Tag as TagIcon, X, Hash } from "lucide-react";
import { slugify } from "@/lib/slug";

interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

const INITIAL: Tag[] = [];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Tag | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Tag>>({ name: "", slug: "", description: "" });

  const filtered = tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "" });
    setShowModal(true);
  };
  const openEdit = (t: Tag) => {
    setEditing(t);
    setForm(t);
    setShowModal(true);
  };
  const handleSave = () => {
    if (!form.name) return;
    const slug = slugify(form.slug || form.name || "");
    if (editing) setTags((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...form, slug } as Tag : x)));
    else setTags((prev) => [...prev, { id: Date.now().toString(), name: form.name!, slug, description: form.description || null, postCount: 0 }]);
    setShowModal(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Tags</h1>
          <p className="mt-1 text-sm text-text-secondary">Flat, no hierarchy — flexible taxonomy for filtering.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover transition">
          <Plus className="h-4 w-4" /> New Tag
        </button>
      </div>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tags..." className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tag) => (
          <div key={tag.id} className="group rounded-2xl border border-border bg-surface p-5 h-[180px] flex flex-col hover:border-brand/20 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition">
                <Hash className="h-4 w-4" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(tag)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised">
                  <Edit3 className="h-3.5 w-3.5 text-text-secondary" />
                </button>
                <button onClick={() => setTags((prev) => prev.filter((x) => x.id !== tag.id))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-flame/10 text-flame">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <h3 className="mt-4 text-base font-bold text-navy">#{tag.name}</h3>
            <p className="mt-1 font-mono text-xs text-brand">/{tag.slug}</p>
            <p className="mt-2 text-sm text-text-secondary line-clamp-2">{tag.description ?? "No description"}</p>
            <p className="mt-3 text-xs font-medium text-text-tertiary">{tag.postCount} posts</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="py-12 text-center text-sm text-text-tertiary">No tags found.</p>}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">{editing ? "Edit Tag" : "New Tag"}</h2>
              <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-raised">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary">Name</label>
                <input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="tutorial" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Slug</label>
                <input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="tutorial" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Description</label>
                <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What this tag is for..." className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised">
                Cancel
              </button>
              <button onClick={handleSave} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover">
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
