"use client";

import { useState } from "react";
import { Search, Grid3X3, List, Upload, Image as ImageIcon, MoreHorizontal, Trash2, Eye, Filter } from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: string;
  dimensions: string;
  usedIn: string[];
}

const MOCK_MEDIA: MediaItem[] = [];

export default function MediaPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = MOCK_MEDIA.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Media Library</h1>
          <p className="mt-1 text-sm text-text-secondary">Upload, organize, and track usage — R2 + WebP/AVIF pipeline.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover transition">
          <Upload className="h-4 w-4" /> Upload
        </button>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by filename or alt text..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-2">
            <Filter className="h-4 w-4 text-text-tertiary" />
            <select className="h-10 bg-transparent text-sm font-medium focus:outline-none">
              <option>All types</option>
              <option>Images</option>
              <option>Documents</option>
            </select>
          </div>
          <div className="flex rounded-xl border border-border bg-white p-1">
            <button onClick={() => setView("grid")} className={`flex h-8 w-8 items-center justify-center rounded-lg ${view === "grid" ? "bg-navy text-white" : "text-text-tertiary hover:bg-surface-raised"}`}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setView("list")} className={`flex h-8 w-8 items-center justify-center rounded-lg ${view === "list" ? "bg-navy text-white" : "text-text-tertiary hover:bg-surface-raised"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelected(item.id)}
              className={`group relative overflow-hidden rounded-xl border bg-white cursor-pointer transition h-[240px] flex flex-col ${selected === item.id ? "border-brand ring-2 ring-brand/20" : "border-border hover:border-brand/20 hover:shadow-md"}`}
            >
              <div className="relative h-32 bg-surface-raised overflow-hidden">
                <img src={item.url} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-flame hover:text-white">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {item.usedIn.length > 0 && <span className="absolute bottom-2 left-2 rounded-full bg-navy/80 px-2 py-1 text-xs font-semibold text-white backdrop-blur">Used in {item.usedIn.length}</span>}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-sm font-semibold text-navy truncate">{item.name}</p>
                <p className="text-xs text-text-tertiary">
                  {item.dimensions} · {item.size}
                </p>
                {item.usedIn.length > 0 ? (
                  <p className="mt-auto pt-2 text-xs text-brand truncate">Used in: {item.usedIn.join(", ")}</p>
                ) : (
                  <p className="mt-auto pt-2 text-xs text-text-tertiary">Not used</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-raised border-b border-border">
                <tr className="text-xs font-semibold text-text-tertiary">
                  <th className="px-4 py-3">Preview</th>
                  <th className="px-4 py-3">Filename</th>
                  <th className="px-4 py-3 hidden md:table-cell">Dimensions</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Used in</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-raised/50 h-[64px]">
                    <td className="px-4 py-2">
                      <img src={item.url} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-navy">{item.name}</td>
                    <td className="px-4 py-2 hidden md:table-cell text-sm text-text-secondary">{item.dimensions}</td>
                    <td className="px-4 py-2 text-sm text-text-secondary">{item.size}</td>
                    <td className="px-4 py-2 hidden lg:table-cell text-xs text-brand">{item.usedIn.length ? item.usedIn.join(", ") : "—"}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised">
                          <Eye className="h-4 w-4 text-text-secondary" />
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-flame/10 text-flame">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised">
                          <MoreHorizontal className="h-4 w-4 text-text-secondary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="mt-12 rounded-xl border-2 border-dashed border-border bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <ImageIcon className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-navy">No media found</p>
          <p className="mt-1 text-sm text-text-secondary">Upload your first image — it will be optimized to WebP/AVIF automatically.</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-xs text-text-tertiary">
        <span>
          {filtered.length} of {MOCK_MEDIA.length} items · 50 per page
        </span>
        <span className="hidden sm:inline">Tip: Deleting an in-use image shows a warning with all posts using it.</span>
      </div>
    </div>
  );
}
