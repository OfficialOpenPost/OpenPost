"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, X, Upload, Loader2 } from "lucide-react";
import { uploadImageWithWebP } from "@/lib/uploadMedia";

interface FeaturedImagePickerProps {
  imageUrl: string | null;
  onChange: (url: string | null) => void;
}

export function FeaturedImagePicker({ imageUrl, onChange }: FeaturedImagePickerProps) {
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [showLibrary, setShowLibrary] = useState(false);
  const [library, setLibrary] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [loadingLib, setLoadingLib] = useState(false);

  const loadLibrary = async () => {
    setLoadingLib(true);
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const url = activeProjId ? `/api/media?limit=50&projectId=${activeProjId}` : "/api/media?limit=50";
      const headers: Record<string, string> = activeProjId ? { "X-OpenPost-Project": activeProjId } : {};
      const res = await fetch(url, { headers } as any);
      const j = await res.json();
      if (Array.isArray(j.data)) {
        setLibrary(j.data.map((m: any) => ({ id: m.id, url: m.url || m.variants?.publicUrl || "", name: m.originalFilename || m.name || "media" })).filter((m: any) => m.url));
      }
    } catch {}
    finally { setLoadingLib(false); }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadImageWithWebP(file);
      onChange(url);
    } catch {
      // fallback to prompt
      const u = window.prompt("Upload failed — paste URL");
      if (u) onChange(u);
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-text-tertiary">Displayed on the post header and OG card. Good for SEO and social shares.</p>

      {imageUrl ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface-raised group">
            <img src={imageUrl} alt="Featured" className="w-full h-[180px] object-cover" />
            <button onClick={() => onChange(null)} className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-navy/90 text-white opacity-0 group-hover:opacity-100 hover:bg-navy transition">
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy/60 to-transparent p-2">
              <p className="text-[11px] font-medium text-white truncate">{imageUrl}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onChange(null)} className="flex-1 rounded-full border border-border bg-white py-2 text-xs font-semibold hover:bg-surface-raised">
              Remove
            </button>
            <button onClick={() => setUrlInput(imageUrl)} className="flex-1 rounded-full bg-brand py-2 text-xs font-bold text-navy hover:bg-brand-hover">
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-border bg-[#FCFCF9] p-5 text-center hover:border-brand/30 hover:bg-brand/5 transition">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <ImageIcon className="h-5 w-5" />
            </div>
            <p className="mt-2 text-sm font-semibold text-navy">Add featured image</p>
            <p className="mt-1 text-xs text-text-tertiary">16:9 recommended · 1200×675</p>
          </div>
          <div className="flex gap-2">
            <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Paste image URL..." className="flex-1 rounded-full border border-border bg-white px-3 py-2 text-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
            <button onClick={() => urlInput.trim() && (onChange(urlInput.trim()), setUrlInput(""))} disabled={!urlInput.trim()} className="rounded-full bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy-light disabled:opacity-40">
              Set
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-white py-2 text-xs font-semibold hover:bg-surface-raised disabled:opacity-50">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} {uploading ? "WebP…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLibrary(true);
                loadLibrary();
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-surface-raised py-2 text-xs font-semibold hover:bg-white"
            >
              <ImageIcon className="h-3.5 w-3.5" /> Library
            </button>
          </div>
          {showLibrary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4" onClick={() => setShowLibrary(false)}>
              <div className="w-full max-w-2xl max-h-[70vh] overflow-hidden rounded-2xl border border-border bg-white shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="text-sm font-bold text-navy">Media Library</h3>
                  <button onClick={() => setShowLibrary(false)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-surface-raised">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {loadingLib ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-sm text-text-tertiary">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                  ) : library.length === 0 ? (
                    <p className="py-12 text-center text-sm text-text-tertiary">No media found for this project</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {library.map((m) => (
                        <button key={m.id} onClick={() => { onChange(m.url); setShowLibrary(false); }} className="group relative overflow-hidden rounded-xl border border-border hover:border-brand/40 aspect-square bg-surface-raised">
                          <img src={m.url} alt={m.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
                          <span className="absolute bottom-0 left-0 right-0 bg-navy/70 text-white text-[10px] px-1.5 py-1 truncate">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
