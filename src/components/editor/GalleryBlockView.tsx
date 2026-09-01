"use client";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useEffect } from "react";
import { Image as ImageIcon, LayoutGrid, Trash2, Plus } from "lucide-react";

export function GalleryBlockView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { layout = "grid", images = [] } = node.attrs;
  const [showPicker, setShowPicker] = useState(false);
  const [media, setMedia] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!showPicker) return;
    fetch("/api/media?limit=20").then(r=>r.json()).then(j=>{
      if(Array.isArray(j.data)) setMedia(j.data.map((m:any)=>({ id: m.id, url: m.url ?? m.publicUrl ?? m.variants?.publicUrl ?? "", name: m.originalFilename ?? m.name ?? "" })).filter((m:any)=>m.url));
    }).catch(()=>{});
  }, [showPicker]);

  const toggle = (m: { id: string; url: string }) => {
    const next = new Set(selectedIds);
    if (next.has(m.id)) next.delete(m.id); else next.add(m.id);
    setSelectedIds(next);
  };

  const confirm = () => {
    const picked = media.filter(m => selectedIds.has(m.id)).map(m => ({ src: m.url, alt: m.name }));
    if (picked.length >= 2) {
      updateAttributes({ images: picked, layout });
    } else if (picked.length===1) {
      // convert to single image
      alert("Gallery requires at least 2 images — pick 2+");
      return;
    }
    setShowPicker(false);
    setSelectedIds(new Set());
  };

  return (
    <NodeViewWrapper className="my-6">
      <div className={`rounded-xl border bg-white overflow-hidden ${selected ? "border-brand ring-2 ring-brand/20" : "border-border"}`}>
        <div className="flex items-center justify-between px-3 py-2 bg-[#FCFCF9] border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-navy">Gallery</span>
            <span className="text-xs text-text-tertiary">{images.length} images · {layout}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={()=>updateAttributes({ layout: layout==="grid" ? "carousel" : "grid" })} className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold hover:bg-surface-raised">
              {layout === "grid" ? "Grid" : "Carousel"}
            </button>
            <button onClick={()=>setShowPicker(true)} className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-navy">
              <Plus className="h-3 w-3 inline mr-1" /> Pick from library
            </button>
            <button onClick={()=>deleteNode()} className="flex h-7 w-7 items-center justify-center rounded-full border border-border hover:bg-flame/10 text-flame">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={layout==="carousel" ? "flex gap-3 overflow-x-auto p-3 snap-x" : "grid grid-cols-2 gap-3 p-3"}>
          {images.length ? images.map((img:any, idx:number)=>(
            <div key={idx} className="relative group">
              <img src={img.src} alt={img.alt ?? ""} className="h-32 w-full object-cover rounded-lg border border-border" />
              <button onClick={()=>{
                const next = images.filter((_:any,i:number)=>i!==idx);
                if(next.length<2) alert("Gallery needs 2+ images — will convert to single image if you remove");
                updateAttributes({ images: next });
              }} className="absolute top-1 right-1 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-navy/80 text-white">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )) : (
            <div className="col-span-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-raised p-8 text-center">
              <ImageIcon className="h-8 w-8 text-text-tertiary" />
              <p className="mt-2 text-sm font-semibold text-navy">No images — pick from library</p>
              <p className="text-xs text-text-tertiary">Requires at least 2 images</p>
              <button onClick={()=>setShowPicker(true)} className="mt-3 rounded-full bg-brand px-4 py-2 text-xs font-bold text-navy">Open library</button>
            </div>
          )}
        </div>
      </div>
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl border border-border bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-navy">Pick images (2+)</h3>
              <button onClick={()=>setShowPicker(false)} className="rounded-full border border-border px-3 py-1 text-xs font-semibold">Close</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {media.length===0 ? <p className="col-span-3 text-center text-sm text-text-tertiary py-8">No media — upload in Media library first</p> : media.map(m=>(
                <button key={m.id} onClick={()=>toggle(m)} className={`relative overflow-hidden rounded-xl border p-1 ${selectedIds.has(m.id) ? "border-brand ring-2 ring-brand/20" : "border-border"}`}>
                  <img src={m.url} alt={m.name} className="h-24 w-full object-cover rounded-lg" />
                  <p className="mt-1 truncate text-xs text-navy">{m.name}</p>
                  {selectedIds.has(m.id) && <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-navy text-xs font-bold">✓</span>}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowPicker(false)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Cancel</button>
              <button onClick={confirm} disabled={selectedIds.size<2} className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-navy disabled:opacity-40">Add {selectedIds.size} images</button>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
