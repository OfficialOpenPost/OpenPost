"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Grid3X3, List, Upload, Image as ImageIcon, MoreHorizontal, Trash2, Eye, Filter, Loader2, AlertTriangle, Check } from "lucide-react";
import { convertToWebP, formatBytes } from "@/lib/imageConvert";
import { useDebounce } from "@/hooks/useDebounce";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: string;
  dimensions: string;
  usedIn: string[];
  originalFilename?: string;
  mimeType?: string;
}

export default function MediaPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selected, setSelected] = useState<string | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ name: string; progress: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async (q?: string) => {
    try {
      setLoading(true);
      const url = q ? `/api/media?search=${encodeURIComponent(q)}` : "/api/media";
      const res = await fetch(url);
      const json = await res.json();
      if (Array.isArray(json.data)) {
        const mapped: MediaItem[] = json.data.map((m: any) => ({
          id: m.id,
          name: m.originalFilename ?? m.name ?? "media",
          url: m.url ?? m.publicUrl ?? m.variants?.publicUrl ?? m.variants?.webp?.url ?? "",
          size: m.size ?? (m.sizeBytes ? formatBytes(Number(m.sizeBytes)) : "-"),
          dimensions: m.dimensions ?? (m.width && m.height ? `${m.width}×${m.height}` : "-"),
          usedIn: m.usedIn ?? [],
          originalFilename: m.originalFilename,
          mimeType: m.mimeType,
        }));
        setItems(mapped);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMedia(); }, []);
  useEffect(() => { fetchMedia(debouncedSearch || undefined); }, [debouncedSearch]);

  const [filterType, setFilterType] = useState<"all" | "images" | "documents">("all");
  const [sortBy, setSortBy] = useState<"date" | "size" | "name">("date");
  const [page, setPage] = useState(1);
  const perPage = 50;

  const filteredAll = items.filter((m) => {
    if (debouncedSearch && !m.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
    if (filterType === "images" && !m.mimeType?.startsWith("image/")) return false;
    if (filterType === "documents" && m.mimeType?.startsWith("image/")) return false;
    return true;
  }).sort((a,b)=>{
    if (sortBy==="name") return a.name.localeCompare(b.name);
    if (sortBy==="size") { const pa = parseFloat(a.size) || 0; const pb = parseFloat(b.size) || 0; return pb-pa; }
    return 0; // date: keep API order (desc)
  });

  const totalPages = Math.max(1, Math.ceil(filteredAll.length / perPage));
  const filtered = filteredAll.slice((page-1)*perPage, page*perPage);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError(null);
    for (const orig of Array.from(files)) {
      try {
        setUploading({ name: orig.name, progress: "Converting to WebP…" });
        const file = await convertToWebP(orig, 0.82);
        const isWebP = file.type === "image/webp";
        setUploading({ name: file.name, progress: isWebP ? `WebP ${(file.size / 1024).toFixed(1)} KB — requesting upload…` : "Requesting upload…" });

        // Get presigned POST for R2
        const presignRes = await fetch("/api/media/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type || "image/webp", size: file.size }),
        });
        const presignJson = await presignRes.json();
        if (!presignRes.ok) throw new Error(presignJson.error?.message ?? "Presign failed");

        const { url, fields, key, publicUrl } = presignJson.data as { url: string; fields: Record<string, string>; key: string; publicUrl: string };
        setUploading({ name: file.name, progress: "Uploading to R2…" });

        const form = new FormData();
        Object.entries(fields).forEach(([k, v]) => form.append(k, v as string));
        form.append("file", file);

        const upRes = await fetch(url, { method: "POST", body: form });
        if (!upRes.ok) throw new Error("R2 upload failed");

        // Get dimensions for DB
        let width: number | null = null, height: number | null = null;
        try {
          if (file.type.startsWith("image/")) {
            const bmp = await createImageBitmap(file).catch(() => null);
            if (bmp) { width = (bmp as any).width; height = (bmp as any).height; (bmp as any).close?.(); }
          }
        } catch {}

        setUploading({ name: file.name, progress: "Saving metadata…" });
        const metaRes = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalFilename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            width,
            height,
            key,
            publicUrl,
            checksum: `${Date.now()}-${file.name}`,
          }),
        });
        const metaJson = await metaRes.json();
        if (!metaRes.ok) throw new Error(metaJson.error?.message ?? "DB save failed");

        // Refresh
        await fetchMedia(debouncedSearch || undefined);
        setUploading({ name: file.name, progress: "Done ✓" });
        setTimeout(() => setUploading(null), 1200);
      } catch (e: any) {
        setError(e.message ?? "Upload failed");
        setUploading(null);
        break;
      }
    }
  };

  const handleDelete = async (item: MediaItem) => {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/media/${item.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (j.error?.code === "IN_USE") { setDeleteError(`${j.error.message}: ${j.error.details?.titles?.join(", ") ?? j.error.details?.count + " posts"}`); return; }
        throw new Error(j.error?.message ?? "Delete failed");
      }
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setDeleteTarget(null);
    } catch (e: any) { setDeleteError(e.message); }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <input ref={fileRef} type="file" accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.svg" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Media Library</h1>
          <p className="mt-1 text-sm text-text-secondary">Upload, organize, and track usage — R2 + WebP auto-conversion (browser canvas, no server sharp).</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={!!uploading} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover transition disabled:opacity-50">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploading ? uploading.progress : "Upload (→ WebP)"}
        </button>
      </div>

      {uploading && <div className="mt-4 rounded-xl border border-brand/20 bg-brand/5 p-3 text-sm text-navy flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-brand" /> {uploading.name}: {uploading.progress}</div>}
      {error && <div className="mt-4 rounded-xl border border-flame/20 bg-flame/5 p-3 text-sm text-flame">{error} <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button></div>}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="mt-4 rounded-xl border-2 border-dashed border-border bg-surface-raised/30 p-4 text-center text-xs text-text-tertiary"
      >
        Drag & drop images here — they’ll be converted to WebP (≈ 30–60% smaller) before uploading. SVG stays SVG.
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by filename or alt text..." className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-2">
            <Filter className="h-4 w-4 text-text-tertiary" />
            <select value={filterType} onChange={e=>{setFilterType(e.target.value as any); setPage(1);}} className="h-10 bg-transparent text-sm font-medium focus:outline-none">
              <option value="all">All types</option>
              <option value="images">Images</option>
              <option value="documents">Documents</option>
            </select>
          </div>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm font-medium">
            <option value="date">Sort: Date</option>
            <option value="name">Sort: Name</option>
            <option value="size">Sort: Size</option>
          </select>
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
                {item.url ? <img src={item.url} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" /> : <div className="h-full w-full flex items-center justify-center text-text-tertiary"><ImageIcon className="h-8 w-8" /></div>}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={(e) => { e.stopPropagation(); window.open(item.url, "_blank"); }} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-flame hover:text-white">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {item.mimeType === "image/webp" && <span className="absolute top-2 left-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-navy">WebP</span>}
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
                      {item.url ? <img src={item.url} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-border" /> : <div className="h-10 w-10 rounded-lg bg-surface-raised" />}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-navy"><span className="truncate">{item.name}</span> {item.mimeType === "image/webp" && <span className="ml-1 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">WebP</span>}</td>
                    <td className="px-4 py-2 hidden md:table-cell text-sm text-text-secondary">{item.dimensions}</td>
                    <td className="px-4 py-2 text-sm text-text-secondary">{item.size}</td>
                    <td className="px-4 py-2 hidden lg:table-cell text-xs text-brand">{item.usedIn.length ? item.usedIn.join(", ") : "—"}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => window.open(item.url, "_blank")} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface-raised">
                          <Eye className="h-4 w-4 text-text-secondary" />
                        </button>
                        <button onClick={() => setDeleteTarget(item)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-flame/10 text-flame">
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

      {loading ? (
        <div className="mt-12 text-center text-sm text-text-tertiary flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading media…</div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 rounded-xl border-2 border-dashed border-border bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <ImageIcon className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-navy">No media found</p>
          <p className="mt-1 text-sm text-text-secondary">Upload your first image — it will be converted to WebP in the browser before uploading (≈ 30–60% smaller, no server sharp needed).</p>
          <button onClick={() => fileRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy"><Upload className="h-4 w-4" /> Upload image</button>
        </div>
      ) : null}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600"><AlertTriangle className="h-5 w-5" /><h3 className="font-bold text-navy">Delete media?</h3></div>
            <p className="mt-3 text-sm text-text-secondary">Delete <span className="font-semibold">{deleteTarget.name}</span>? {deleteTarget.usedIn.length ? `Used in ${deleteTarget.usedIn.length} post(s) — will break images.` : "Not used anywhere."}</p>
            {deleteError && <p className="mt-3 rounded-xl bg-flame/10 p-3 text-sm text-flame">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setDeleteTarget(null); setDeleteError(null); }} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="rounded-xl bg-flame px-5 py-2.5 text-sm font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-xs text-text-tertiary">
        <span>
          {filteredAll.length} of {items.length} items · {perPage} per page · page {page}/{totalPages} {loading ? "" : `· WebP via ${typeof window !== "undefined" && (window as any).OffscreenCanvas ? "OffscreenCanvas" : "canvas"}`}
        </span>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border border-border bg-white px-3 py-1 text-xs font-semibold disabled:opacity-40">Prev</button>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-border bg-white px-3 py-1 text-xs font-semibold disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
