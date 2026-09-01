"use client";

import { useState, useMemo, useEffect } from "react";
import { useOpenPostEditor } from "@/components/editor/useOpenPostEditor";
import { EditorContent } from "@tiptap/react";
import { EDITOR_STYLES } from "@/components/editor/extensions";
import { Toolbar } from "@/components/editor/Toolbar";
import { SelectionBubbleMenu, ImageBubbleMenu } from "@/components/editor/BubbleMenus";
import { StatusIndicator } from "@/components/editor/StatusIndicator";
import { Preview } from "@/components/editor/Preview";
import { FeaturedImagePicker } from "@/components/editor/FeaturedImagePicker";
import { useAutosave } from "@/hooks/useAutosave";
import { countWords, readingTime } from "@/lib/publish";
import { slugify } from "@/lib/slug";
import { ArrowLeft, Eye, Sparkles, Settings2, Image as ImageIcon, Tag, Folder, X, Check, Clock, Search, AlertTriangle, History, Calendar } from "lucide-react";
import { InsertMenu } from "@/components/editor/InsertMenu";
import Link from "next/link";

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("untitled");
  const [html, setHtml] = useState("<p></p>");
  const [json, setJson] = useState<Record<string, unknown> | null>(null);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<"draft" | "published" | "scheduled" | "trash">("draft");
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [activeTab, setActiveTab] = useState<"seo" | "organize" | "featured" | "publishing" | "history">("organize");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [canonical, setCanonical] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDesc, setOgDesc] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [revisions, setRevisions] = useState<Array<{ id: string; label: string | null; createdAt: string; createdBy: string }>>([]);
  const [blogId, setBlogId] = useState<string | null>(null);
  const [catOptions, setCatOptions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const editor = useOpenPostEditor({
    content: "",
    onChange: (h, j) => {
      setHtml(h);
      setJson(j);
    },
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const newWidth = Math.min(480, Math.max(260, e.clientX));
      setSidebarWidth(newWidth);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  const [restorePrompt, setRestorePrompt] = useState<{ savedAt: number } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { getDraftLocal } = await import("@/lib/indexedDB");
        const local = await getDraftLocal<{ title: string; slug: string; html: string }>("new-post");
        if (local && Date.now() - local.savedAt < 24 * 60 * 60 * 1000) {
          setRestorePrompt({ savedAt: local.savedAt });
        }
      } catch {}
    })();
  }, []);
  useEffect(() => {
    fetch("/api/v1/categories").then(r=>r.json()).then(j=>{ if(Array.isArray(j.data)) setCatOptions(j.data); }).catch(()=>{});
  }, []);
  useEffect(() => {
    if (!blogId) return;
    fetch(`/api/blogs/${blogId}/revisions`).then(r=>r.json()).then(j=>{ if(Array.isArray(j.data)) setRevisions(j.data); }).catch(()=>{});
  }, [blogId, activeTab]);

  const seoWarnings = useMemo(() => {
    const w: string[] = [];
    const sTitle = seoTitle || title;
    if (!sTitle) w.push("Missing SEO title");
    else if (sTitle.length > 60) w.push(`SEO title too long (${sTitle.length}/60)`);
    else if (sTitle.length < 30) w.push(`SEO title short (${sTitle.length}/60)`);
    if (!seoDesc) w.push("Missing meta description");
    else if (seoDesc.length > 155) w.push(`Meta description too long (${seoDesc.length}/155)`);
    else if (seoDesc.length < 70) w.push(`Meta description short (${seoDesc.length}/155)`);
    if (!featuredImage && !ogImage) w.push("Missing featured/OG image");
    const hasImages = JSON.stringify(json ?? {}).includes('"type":"image"');
    const hasAlt = JSON.stringify(json ?? {}).includes('"alt"');
    if (hasImages && !hasAlt) w.push("Images missing alt text");
    const hasH1InBody = JSON.stringify(json ?? {}).includes('"level":1');
    if (hasH1InBody) w.push("Body contains H1 — title is already H1");
    if (!html.includes("<a ")) w.push("No internal links detected");
    return w;
  }, [seoTitle, seoDesc, featuredImage, ogImage, title, json, html]);

  const { status: saveStatus, save } = useAutosave({
    id: "new-post",
    data: { title, slug, html, json, featuredImage, category, tags, seoTitle, seoDesc, canonical, ogTitle, ogDesc, ogImage, scheduledAt, status },
    onSave: async (data) => {
      const payload: any = {
        title: (data as any).title || "Untitled",
        slug: (data as any).slug,
        content: (data as any).json ?? { html: (data as any).html },
        status: (data as any).status ?? "draft",
        categoryId: catOptions.find(c=>c.name===(data as any).category)?.id ?? null,
        scheduledAt: (data as any).scheduledAt || null,
        seo: { title: (data as any).seoTitle, description: (data as any).seoDesc, canonical: (data as any).canonical, ogTitle: (data as any).ogTitle, ogDesc: (data as any).ogDesc, ogImage: (data as any).ogImage },
      };
      if (blogId) payload.id = blogId;
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j?.error?.code === "CONFLICT") { setConflictMsg(j.error.message); throw new Error(j.error.message); }
        if (j?.error?.code === "SLUG_EXISTS") throw new Error("Slug already exists — try another");
        throw new Error("Save failed");
      }
      const j = await res.json().catch(()=>({}));
      if (j.data?.id && !blogId) setBlogId(j.data.id);
      setConflictMsg(null);
    },
  });

  const words = useMemo(() => countWords(html), [html]);
  const minutes = useMemo(() => readingTime(words), [words]);
  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugEdited) setSlug(slugify(v) || "untitled");
  };

  if (preview) {
    return (
      <div className="min-h-screen bg-[#FCFCF9]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white/80 backdrop-blur-xl px-6 py-3">
          <button onClick={() => setPreview(false)} className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-surface-raised">
            <ArrowLeft className="h-4 w-4" /> Back to editor
          </button>
          <span className="text-sm text-text-tertiary">{words} words · {minutes} min</span>
        </div>
        <Preview title={title} html={html} json={json ?? undefined} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCF9] flex">
      <style>{EDITOR_STYLES}</style>
      {/* Left sidebar — fixed, connected to top */}
      {showSidebar && (
        <aside style={{ width: sidebarWidth }} className="hidden lg:flex shrink-0 flex-col bg-white border-r border-border h-screen sticky top-0 overflow-hidden shadow-sm z-10">
          <div className="flex h-16 items-center gap-2 px-4 border-b border-border bg-white shrink-0">
            <Link href="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCFCF9] border border-border hover:bg-white transition">
              <ArrowLeft className="h-4 w-4 text-text-secondary" />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary leading-none">Editing</p>
              <p className="text-sm font-semibold text-navy truncate leading-none mt-0.5">{title || "Untitled Post"}</p>
            </div>
            <StatusIndicator status={saveStatus} />
          </div>
          {/* Tabs — floating pill style */}
          <div className="p-2 bg-[#FCFCF9] border-b border-border">
            <div className="flex gap-1 rounded-xl bg-white border border-border p-1">
              {([
                ["seo", "SEO", Search],
                ["organize", "Organize", Folder],
                ["featured", "Featured", ImageIcon],
                ["publishing", "Publish", Clock],
                ["history", "History", History],
              ] as const).map(([k, label, Icon]) => (
                <button
                  key={k}
                  onClick={() => setActiveTab(k)}
                  title={label}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 transition ${activeTab===k ? "bg-[#2D3440] text-white shadow-sm" : "text-text-tertiary hover:bg-surface-raised hover:text-navy"}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${activeTab===k ? "text-white" : ""}`} />
                  <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#FCFCF9]">
            {activeTab==="seo" && (
              <div className="rounded-xl bg-white border border-border p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-navy flex items-center gap-2"><Search className="h-3.5 w-3.5 text-text-tertiary" /> SEO</h3>
                <p className="text-[11px] text-text-tertiary leading-relaxed border-b border-border pb-3">Honest checks — <b>not a ranking guarantee</b>.</p>
                <div>
                  <label className="text-xs font-medium text-text-primary">SEO Title <span className={seoTitle.length>60 ? "text-flame" : seoTitle.length<30 && seoTitle ? "text-amber-600" : "text-text-tertiary"}>({(seoTitle||title).length}/60)</span></label>
                  <input value={seoTitle} onChange={e=>setSeoTitle(e.target.value)} placeholder={title || "SEO title"} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-primary">Meta description <span className={seoDesc.length>155 ? "text-flame" : seoDesc.length<70 && seoDesc ? "text-amber-600" : "text-text-tertiary"}>({seoDesc.length}/155)</span></label>
                  <textarea value={seoDesc} onChange={e=>setSeoDesc(e.target.value)} rows={2} placeholder="Compelling summary..." className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-primary">Canonical</label>
                  <input value={canonical} onChange={e=>setCanonical(e.target.value)} placeholder="https://example.com/blog/slug" className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-xs font-mono focus:border-navy focus:outline-none" />
                </div>
                <details className="rounded-lg border border-border bg-[#FCFCF9] p-3">
                  <summary className="text-xs font-semibold cursor-pointer">Open Graph / Twitter</summary>
                  <div className="mt-3 grid gap-2">
                    <input value={ogTitle} onChange={e=>setOgTitle(e.target.value)} placeholder="OG title" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none" />
                    <input value={ogDesc} onChange={e=>setOgDesc(e.target.value)} placeholder="OG desc" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none" />
                    <input value={ogImage} onChange={e=>setOgImage(e.target.value)} placeholder="OG image URL" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs font-mono focus:border-navy focus:outline-none" />
                  </div>
                </details>
                <div className={`rounded-lg p-3 text-xs ${seoWarnings.length===0 ? "bg-green-50 border border-green-200 text-green-800" : "bg-amber-50 border border-amber-200 text-amber-900"}`}>
                  <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> {seoWarnings.length===0 ? "All checks pass" : `${seoWarnings.length} warning${seoWarnings.length>1?"s":""}`}</p>
                  {seoWarnings.map(w=><p key={w} className="mt-1">• {w}</p>)}
                </div>
              </div>
            )}
            {activeTab==="organize" && (
              <div className="space-y-3">
                <div className="rounded-xl bg-white border border-border overflow-hidden shadow-sm">
                  <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border bg-[#FCFCF9]">
                    <Folder className="h-3.5 w-3.5 text-text-tertiary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-navy">Category</h3>
                    <Link href="/dashboard/categories" className="ml-auto text-[11px] text-brand hover:underline">Manage</Link>
                  </div>
                  <div className="p-3 space-y-1">
                    {catOptions.length===0 ? <p className="text-xs text-text-tertiary">No categories — <Link href="/dashboard/categories" className="text-brand underline">create</Link></p> : catOptions.map((cat) => (
                      <label key={cat.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm cursor-pointer transition ${category === cat.name ? "bg-navy text-white border-navy" : "bg-white border-border hover:bg-surface-raised"}`}>
                        <input type="radio" name="category" checked={category === cat.name} onChange={() => setCategory(cat.name)} className="sr-only" />
                        <span className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${category === cat.name ? "border-white bg-white" : "border-border bg-white"}`}>
                          {category === cat.name && <span className="h-1.5 w-1.5 rounded-full bg-navy" />}
                        </span>
                        <span className="truncate text-sm">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-border overflow-hidden shadow-sm">
                  <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border bg-[#FCFCF9]">
                    <Tag className="h-3.5 w-3.5 text-text-tertiary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-navy">Tags</h3>
                  </div>
                  <div className="p-3">
                    <div className="flex gap-1.5">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && tagInput.trim()) {
                            e.preventDefault();
                            if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
                            setTagInput("");
                          }
                        }}
                        placeholder="Add tag"
                        className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
                      />
                      <button onClick={()=>{ if(tagInput.trim() && !tags.includes(tagInput.trim())){ setTags([...tags, tagInput.trim()]); setTagInput(""); } }} className="rounded-lg bg-navy px-3 text-xs font-bold text-white">Add</button>
                    </div>
                    {tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tags.map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#2D3440] px-2.5 py-1 text-xs font-medium text-white">
                            {t}
                            <button onClick={() => setTags(tags.filter((x) => x !== t))} className="ml-1 hover:text-brand">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-text-tertiary">No tags yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab==="featured" && (
              <div className="rounded-xl bg-white border border-border overflow-hidden shadow-sm">
                <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border bg-[#FCFCF9]">
                  <ImageIcon className="h-3.5 w-3.5 text-text-tertiary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-navy">Featured image</h3>
                </div>
                <div className="p-3">
                  <FeaturedImagePicker imageUrl={featuredImage} onChange={setFeaturedImage} />
                  <p className="mt-3 text-[11px] text-text-tertiary">16:9 · 1200×675 · WebP auto-converted.</p>
                </div>
              </div>
            )}
            {activeTab==="publishing" && (
              <div className="space-y-3">
                <div className="rounded-xl bg-white border border-border overflow-hidden shadow-sm">
                  <div className="px-3 py-2.5 flex items-center justify-between border-b border-border bg-[#FCFCF9]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-navy">Publishing</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${status === "published" ? "bg-green-50 text-green-700 border-green-200" : status==="scheduled" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-white text-text-secondary border-border"}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {status}
                    </span>
                  </div>
                  <div className="p-3 space-y-3">
                    <div className="rounded-lg bg-[#FCFCF9] border border-border p-2.5 space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-text-tertiary">Visibility</span><span className="font-medium text-navy">Public</span></div>
                      <div className="flex justify-between"><span className="text-text-tertiary">When</span><span className="font-medium text-navy">{scheduledAt ? new Date(scheduledAt).toLocaleDateString() : "Now"}</span></div>
                    </div>
                    <div>
                      <label className="text-xs font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> Schedule</label>
                      <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none" />
                    </div>
                    <button
                      onClick={async () => {
                        if (scheduledAt && new Date(scheduledAt) > new Date()) { await save(); setStatus("scheduled"); }
                        else { await save(); setStatus("published"); }
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#FEA611] py-2.5 text-sm font-bold text-[#2D3440] hover:bg-[#FE990E] transition shadow-sm"
                    >
                      <Check className="h-4 w-4" /> {status === "published" ? "Update" : scheduledAt ? "Schedule" : "Publish"}
                    </button>
                    <button onClick={async()=>{ await fetch(`/api/blogs/${blogId ?? "new-post"}`,{method:"DELETE"}); setStatus("trash"); }} className="w-full rounded-full border border-border bg-white py-2 text-xs font-medium hover:bg-surface-raised">Move to Trash</button>
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-border p-3 shadow-sm">
                  <p className="text-xs font-semibold text-navy">Stats</p>
                  <p className="mt-1 text-xs text-text-secondary">{words} words · {minutes} min</p>
                  <p className="mt-1 font-mono text-xs text-brand">/{slug}</p>
                </div>
              </div>
            )}
            {activeTab==="history" && (
              <div className="rounded-xl bg-white border border-border overflow-hidden shadow-sm">
                <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border bg-[#FCFCF9]">
                  <History className="h-3.5 w-3.5 text-text-tertiary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-navy">History</h3>
                  <span className="ml-auto text-xs text-text-tertiary">{revisions.length}</span>
                </div>
                <div className="p-3 space-y-2">
                  {revisions.length===0 ? <p className="text-xs text-text-tertiary leading-relaxed">No revisions yet — autosaves keep last 20. Publish creates a checkpoint. Restore loads into draft.</p> : revisions.map(r=>(
                    <div key={r.id} className="rounded-lg border border-border bg-white p-2.5">
                      <div className="flex justify-between text-xs"><span className="font-semibold text-navy">{r.label ?? "Checkpoint"}</span><span className="text-text-tertiary text-[11px]">{new Date(r.createdAt).toLocaleDateString()}</span></div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <button onClick={async()=>{
                          if(!confirm("Restore this version? It will overwrite current draft (not yet published).")) return;
                          const res = await fetch(`/api/blogs/${blogId}/revisions/${r.id}/restore`,{method:"POST"});
                          const j = await res.json().catch(()=>({}));
                          if(!res.ok) alert(j.error?.message ?? "Restore failed");
                          else { alert("Restored to draft"); location.reload(); }
                        }} className="rounded-full bg-[#2D3440] px-3 py-1 text-xs font-semibold text-white">Restore</button>
                        <span className="text-[11px] text-text-tertiary">{new Date(r.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[#FEA611]/20 active:bg-[#FEA611]/30 transition group flex items-center justify-center z-10"
            title="Drag to resize sidebar"
          >
            <div className="h-10 w-1 rounded-full bg-border group-hover:bg-[#FEA611] transition" />
          </div>
        </aside>
      )}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FCFCF9]">
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-border">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {!showSidebar && (
                <button onClick={()=>setShowSidebar(true)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-border shadow-sm lg:hidden">
                  <Settings2 className="h-4 w-4" />
                </button>
              )}
              <Link href="/dashboard" className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCFCF9] border border-border">
                <ArrowLeft className="h-4 w-4 text-text-secondary" />
              </Link>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary leading-none hidden sm:block">Post</p>
                <p className="text-sm font-bold text-navy truncate max-w-[200px] sm:max-w-none">{title || "Untitled Post"}</p>
              </div>
              <StatusIndicator status={saveStatus} />
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-xs text-text-tertiary">{words} words · {minutes} min</span>
              <button onClick={() => setPreview(true)} className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-surface-raised">
                <Eye className="h-4 w-4" /> Preview
              </button>
              <button
                onClick={async () => {
                  if (scheduledAt && new Date(scheduledAt) > new Date()) { await save(); setStatus("scheduled"); }
                  else { await save(); setStatus("published"); }
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FEA611] px-5 py-2 text-sm font-bold text-[#2D3440] shadow-sm hover:bg-[#FE990E] transition"
              >
                <Sparkles className="h-4 w-4" /> {status === "published" ? "Update" : status === "scheduled" ? "Scheduled" : "Publish"}
              </button>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-white lg:hidden"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="border-t border-border bg-white">
            <Toolbar editor={editor} />
          </div>
        </div>

        {conflictMsg && (
          <div className="mx-4 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 flex items-center justify-between">
            <p className="text-sm text-amber-900"><AlertTriangle className="inline h-4 w-4 mr-2" />{conflictMsg} — your changes not saved. Copy your content, reload, and merge.</p>
            <button onClick={()=>setConflictMsg(null)} className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold">Dismiss</button>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[960px] px-6 md:px-8 py-10 md:py-14">
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title…"
              className="w-full bg-transparent text-[2.75rem] font-extrabold tracking-tight text-navy placeholder:text-text-tertiary/40 focus:outline-none leading-[1.05]"
            />
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-text-tertiary">Slug</span>
              <span className="font-mono text-sm text-brand">/{slug}</span>
              <button
                onClick={() => {
                  const next = prompt("Edit slug", slug);
                  if (next !== null) {
                    setSlug(slugify(next) || "untitled");
                    setSlugEdited(true);
                  }
                }}
                className="text-xs font-medium text-text-tertiary hover:text-brand underline"
              >
                Edit
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <InsertMenu editor={editor} />
              <span className="text-xs text-text-tertiary">Insert image, gallery, and blocks — like Sanity</span>
            </div>
            <div className="mt-6 min-h-[520px]">
              {editor && (
                <>
                  <SelectionBubbleMenu editor={editor} />
                  <ImageBubbleMenu editor={editor} />
                  <EditorContent editor={editor} />
                </>
              )}
              {!html || html === "<p></p>" ? <p className="text-[15px] leading-7 text-text-tertiary/60">Start writing or type “/” for blocks — images appear as separate cards on this open canvas.</p> : null}
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-border/50 pt-4 text-xs text-text-tertiary">
              <span>Slug: <span className="font-mono text-text-primary">/{slug}</span></span>
              <span className="hidden sm:inline font-medium">{words} words · {minutes} min · <kbd className="rounded bg-white border border-border px-1.5 py-0.5 text-[10px] shadow-sm">/</kbd> for blocks · <kbd className="hidden sm:inline rounded bg-white border border-border px-1.5 py-0.5 text-[10px]">Ctrl+Alt+1/2/3</kbd> headings</span>
            </div>
          </div>
        </div>
      </div>
      {restorePrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg rounded-lg border border-[#2D3440]/10 bg-white shadow-2xl shadow-[#2D3440]/15 px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEA611] text-[#2D3440]">
            <History className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-navy">Unsaved changes found</p>
            <p className="text-xs text-text-secondary">Auto-saved {new Date(restorePrompt.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {Math.max(0, Math.round((Date.now() - restorePrompt.savedAt)/60000))}m ago — restore to continue where you left off.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={async () => {
                const { getDraftLocal } = await import("@/lib/indexedDB");
                const local = await getDraftLocal<{ title: string; slug: string; html: string }>("new-post");
                if (local?.data) {
                  setTitle(local.data.title);
                  setSlug(local.data.slug);
                  setHtml(local.data.html);
                }
                setRestorePrompt(null);
              }}
              className="rounded-full bg-[#2D3440] px-4 py-1.5 text-xs font-bold text-white hover:bg-black transition"
            >
              Restore
            </button>
            <button
              onClick={async () => {
                const { deleteDraftLocal } = await import("@/lib/indexedDB");
                await deleteDraftLocal("new-post");
                setRestorePrompt(null);
              }}
              className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-surface-raised transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
