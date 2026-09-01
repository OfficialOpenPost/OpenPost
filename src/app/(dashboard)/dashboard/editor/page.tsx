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
import { ArrowLeft, Eye, Sparkles, Settings2, Image as ImageIcon, Tag, Folder, X, Check, Clock } from "lucide-react";
import { InsertMenu } from "@/components/editor/InsertMenu";
import Link from "next/link";

export default function EditorPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("untitled");
  const [html, setHtml] = useState("<p></p>");
  const [json, setJson] = useState<Record<string, unknown> | null>(null);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const editor = useOpenPostEditor({
    content: "",
    onChange: (h, j) => {
      setHtml(h);
      setJson(j);
    },
  });

  // Sidebar resize
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

  // Check IndexedDB for crash recovery on mount
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

  const { status: saveStatus, save } = useAutosave({
    id: "new-post",
    data: { title, slug, html, featuredImage, category, tags },
    onSave: async (data) => {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: (data as { title: string }).title || "Untitled", slug: (data as { slug: string }).slug, content: { html: (data as { html: string }).html }, status: "draft" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j?.error?.code === "SLUG_EXISTS") throw new Error("Slug already exists — try another");
        throw new Error("Save failed");
      }
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
    <div className="min-h-screen bg-[#FCFCF9] flex flex-col">
      <style>{EDITOR_STYLES}</style>

      {/* Premium top bar — Dribbble-inspired, minimal, soft */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="flex h-[64px] items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-raised hover:bg-brand/10 text-text-secondary hover:text-brand transition">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="hidden sm:block h-6 w-px bg-border" />
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm font-semibold text-navy tracking-tight">Untitled Post</span>
              <StatusIndicator status={saveStatus} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden lg:inline text-xs text-text-tertiary">{words} words · {minutes} min</span>
            <button onClick={() => setPreview(true)} className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium hover:bg-surface-raised transition">
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button
              onClick={async () => {
                await save();
                setStatus("published");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-navy shadow-lg shadow-brand/20 hover:bg-[#E89400] hover:shadow-xl hover:shadow-brand/30 transition"
            >
              <Sparkles className="h-4 w-4" /> {status === "published" ? "Update" : "Publish"}
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`hidden lg:flex h-10 w-10 items-center justify-center rounded-full border transition ${showSidebar ? "bg-navy text-white border-navy shadow-md" : "bg-white border-border text-text-secondary hover:border-brand/20 hover:text-brand"}`}
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar — sticked, centered, pill-style, Dribbble polish */}
        <div className="border-t border-border bg-white">
          <Toolbar editor={editor} />
        </div>
      </div>

      {restorePrompt && (
        <div className="mx-4 mt-4 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-navy">
            <span className="font-bold">Restore unsaved changes?</span> Found local draft from {new Date(restorePrompt.savedAt).toLocaleString()} — browser may have crashed.
          </p>
          <div className="flex gap-2">
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
              className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-navy"
            >
              Restore
            </button>
            <button
              onClick={async () => {
                const { deleteDraftLocal } = await import("@/lib/indexedDB");
                await deleteDraftLocal("new-post");
                setRestorePrompt(null);
              }}
              className="rounded-full border border-border bg-white px-4 py-1.5 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left inspector — fixed, does not scroll with content */}
        {showSidebar && (
          <aside style={{ width: sidebarWidth }} className="hidden lg:flex shrink-0 flex-col bg-[#FCFCF9] border-r border-border h-[calc(100vh-105px)] sticky top-[105px] overflow-hidden relative">
            {/* Drag handle — always visible */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-brand/20 active:bg-brand/30 transition group flex items-center justify-center z-10"
              title="Drag to resize sidebar"
            >
              <div className="h-10 w-1 rounded-full bg-border group-hover:bg-brand transition" />
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Publish — premium, brand accent */}
              <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy">Publish</h3>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border ${status === "published" ? "bg-success/10 text-success border-success/20" : "bg-brand/10 text-brand border-brand/20"}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" /> {status}
                  </span>
                </div>
                <div className="px-5 pb-5 space-y-3">
                  <div className="rounded-xl bg-[#FCFCF9] border border-border p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Visibility</span>
                      <span className="font-medium text-navy">Public</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Publish</span>
                      <span className="font-medium text-navy">Immediately</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await save();
                      setStatus("published");
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-bold text-navy shadow-md shadow-brand/20 hover:bg-[#E89400] transition"
                  >
                    <Check className="h-4 w-4" /> {status === "published" ? "Update" : "Publish"}
                  </button>
                  <button className="w-full rounded-full border border-border bg-white py-2.5 text-sm font-medium hover:bg-surface-raised">Move to Trash</button>
                </div>
              </div>

              {/* Categories — pill radios */}
              <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-2 border-b border-border/50">
                  <Folder className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold text-navy">Categories</h3>
                </div>
                <div className="p-5 space-y-2.5">
                  {["Uncategorized", "SEO", "Tutorials", "Updates"].map((cat) => (
                    <label key={cat} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition ${category === cat ? "bg-navy text-white border-navy" : "bg-white border-border hover:border-brand/20 hover:bg-brand/5"}`}>
                      <input type="radio" name="category" checked={category === cat} onChange={() => setCategory(cat)} className="sr-only" />
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${category === cat ? "border-white bg-white" : "border-border bg-white"}`}>
                        {category === cat && <span className="h-2 w-2 rounded-full bg-navy" />}
                      </span>
                      <span className={category === cat ? "font-semibold" : "text-text-primary"}>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags — soft chips */}
              <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-2 border-b border-border/50">
                  <Tag className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold text-navy">Tags</h3>
                </div>
                <div className="p-5">
                  <div className="flex gap-2">
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
                      placeholder="Add tag and press Enter"
                      className="flex-1 rounded-full border border-border bg-[#FCFCF9] px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  {tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white">
                          {t}
                          <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-brand">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-text-tertiary">No tags yet — add up to 5.</p>
                  )}
                </div>
              </div>

              {/* Featured Image — card with dashed */}
              <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-2 border-b border-border/50">
                  <ImageIcon className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold text-navy">Featured Image</h3>
                </div>
                <div className="p-5">
                  <FeaturedImagePicker imageUrl={featuredImage} onChange={setFeaturedImage} />
                </div>
              </div>

              {/* All pages link — subtle */}
              <div className="rounded-2xl bg-navy text-white p-5">
                <p className="text-sm font-bold">All pages editable</p>
                <p className="mt-1 text-xs text-slate-400">Jump to any section to manage content.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    ["Blogs", "/dashboard/blogs"],
                    ["Categories", "/dashboard/categories"],
                    ["Tags", "/dashboard/tags"],
                    ["Authors", "/dashboard/authors"],
                  ].map(([label, href]) => (
                    <Link key={label} href={href} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/15">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main canvas — open, no card, editorial */}
        <div className="flex-1 min-w-0 overflow-auto bg-[#FCFCF9]">
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
              <span className="hidden sm:inline font-medium">{words} words · {minutes} min · <kbd className="rounded bg-white border border-border px-1.5 py-0.5 text-[10px] shadow-sm">/</kbd> for blocks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
