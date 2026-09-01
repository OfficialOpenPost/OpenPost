"use client";

import { useState } from "react";
import { Plus, Search, Edit3, Trash2, Folder, FolderOpen, X } from "lucide-react";
import { slugify } from "@/lib/slug";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
}

const INITIAL: Category[] = [];

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Category>>({ name: "", slug: "", description: "", parentId: null, seoTitle: "", seoDesc: "" });

  const filtered = cats.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", parentId: null, seoTitle: "", seoDesc: "" });
    setShowModal(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm(c);
    setShowModal(true);
  };
  const handleSave = () => {
    if (!form.name) return;
    const slug = slugify(form.slug || form.name || "");
    if (editing) {
      setCats((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...form, slug } as Category : c)));
    } else {
      setCats((prev) => [...prev, { id: Date.now().toString(), name: form.name!, slug, description: form.description || null, parentId: form.parentId || null, seoTitle: form.seoTitle || null, seoDesc: form.seoDesc || null }]);
    }
    setShowModal(false);
  };

  const parentCats = cats.filter((c) => !c.parentId);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Categories</h1>
          <p className="mt-1 text-sm text-text-secondary">Single-level nesting only — keeps taxonomy simple and predictable.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover transition">
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories..." className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-raised border-b border-border">
              <tr className="text-xs font-semibold text-text-tertiary">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 hidden md:table-cell">Parent</th>
                <th className="px-4 py-3 hidden lg:table-cell">Description</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const parent = c.parentId ? cats.find((p) => p.id === c.parentId)?.name : null;
                return (
                  <tr key={c.id} className="hover:bg-surface-raised/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {c.parentId ? <FolderOpen className="h-4 w-4 text-orange" /> : <Folder className="h-4 w-4 text-brand" />}
                        <span className="text-sm font-semibold text-navy">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-brand">/{c.slug}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-sm text-text-secondary">{parent ?? "-"}</td>
                    <td className="px-4 py-4 hidden lg:table-cell text-sm text-text-secondary max-w-xs truncate">{c.description ?? "-"}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised">
                          <Edit3 className="h-4 w-4 text-text-secondary" />
                        </button>
                        <button onClick={() => setCats((prev) => prev.filter((x) => x.id !== c.id))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-flame/10 text-flame">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="py-12 text-center text-sm text-text-tertiary">No categories found.</p>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">{editing ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-raised">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary">Name</label>
                <input
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })}
                  placeholder="Tutorials"
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Slug</label>
                <input
                  value={form.slug ?? ""}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  placeholder="tutorials"
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Parent (optional, single-level only)</label>
                <select value={form.parentId ?? ""} onChange={(e) => setForm({ ...form, parentId: e.target.value || null })} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
                  <option value="">No parent</option>
                  {parentCats
                    .filter((c) => c.id !== editing?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-text-tertiary">Only top-level categories can be parents — no deep trees.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Description</label>
                <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What this category is about..." className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-text-primary">SEO Title</label>
                  <input value={form.seoTitle ?? ""} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="SEO title" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">SEO Description</label>
                  <input value={form.seoDesc ?? ""} onChange={(e) => setForm({ ...form, seoDesc: e.target.value })} placeholder="SEO description" className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
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
