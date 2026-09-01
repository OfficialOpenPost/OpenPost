"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  ArrowLeft,
  Eye,
  Sparkles,
  Settings2,
  Image as ImageIcon,
  Tag,
  Folder,
  X,
  Check,
  Clock,
  Search,
  AlertTriangle,
  History,
  Calendar,
  Layers,
  ChevronDown,
  Globe,
  Share2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { InsertMenu } from "@/components/editor/InsertMenu";
import Link from "next/link";

interface EditorPageProps {
  initialBlogId?: string;
}

export default function EditorPage({ initialBlogId }: EditorPageProps) {
  const searchParams = useSearchParams();
  const queryId = searchParams?.get("id");
  const effectiveId = initialBlogId || queryId || null;

  const [blogId, setBlogId] = useState<string | null>(effectiveId);
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
  const [catOptions, setCatOptions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(Boolean(effectiveId));

  const editor = useOpenPostEditor({
    content: "",
    onChange: (h, j) => {
      setHtml(h);
      setJson(j);
    },
  });

  // Load existing post if editing
  useEffect(() => {
    if (!effectiveId) return;
    setLoadingInitial(true);
    fetch(`/api/blogs/${effectiveId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          const post = res.data;
          setBlogId(post.id);
          setTitle(post.title || "");
          setSlug(post.slug || "untitled");
          setSlugEdited(true);
          setStatus(post.status || "draft");
          if (post.category?.name) setCategory(post.category.name);
          if (post.scheduledAt) setScheduledAt(new Date(post.scheduledAt).toISOString().slice(0, 16));
          if (post.seo) {
            setSeoTitle(post.seo.title || "");
            setSeoDesc(post.seo.description || "");
            setCanonical(post.seo.canonical || "");
            setOgTitle(post.seo.ogTitle || "");
            setOgDesc(post.seo.ogDesc || "");
            setOgImage(post.seo.ogImage || "");
          }
          if (post.featuredImage?.variants?.publicUrl || post.featuredImage?.url) {
            setFeaturedImage(post.featuredImage.variants?.publicUrl || post.featuredImage.url);
          }
          if (editor && post.content) {
            try {
              editor.commands.setContent(post.content);
            } catch (err) {
              console.warn("Could not set editor content:", err);
            }
          }
        }
      })
      .catch((err) => console.error("Error loading blog:", err))
      .finally(() => setLoadingInitial(false));
  }, [effectiveId, editor]);

  // Handle resizable sidebar
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

  // Load categories
  useEffect(() => {
    fetch("/api/v1/categories")
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.data)) setCatOptions(j.data);
      })
      .catch(() => {});
  }, []);

  // Load revisions
  useEffect(() => {
    if (!blogId) return;
    fetch(`/api/blogs/${blogId}/revisions`)
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.data)) setRevisions(j.data);
      })
      .catch(() => {});
  }, [blogId, activeTab]);

  // SEO Warnings calculation
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

  // Autosave
  const { status: saveStatus, save } = useAutosave({
    id: blogId || "new-post",
    data: { title, slug, html, json, featuredImage, category, tags, seoTitle, seoDesc, canonical, ogTitle, ogDesc, ogImage, scheduledAt, status },
    onSave: async (data) => {
      const activeCat = catOptions.find((c) => c.name === (data as any).category);
      const payload: any = {
        title: (data as any).title || "Untitled Article",
        slug: (data as any).slug || "untitled",
        content: (data as any).json ?? { html: (data as any).html },
        status: (data as any).status ?? "draft",
        categoryId: activeCat ? activeCat.id : null,
        scheduledAt: (data as any).scheduledAt || null,
        seo: {
          title: (data as any).seoTitle,
          description: (data as any).seoDesc,
          canonical: (data as any).canonical,
          ogTitle: (data as any).ogTitle,
          ogDesc: (data as any).ogDesc,
          ogImage: (data as any).ogImage,
        },
      };

      if (blogId) payload.id = blogId;

      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j?.error?.code === "CONFLICT") {
          setConflictMsg(j.error.message);
          throw new Error(j.error.message);
        }
        if (j?.error?.code === "SLUG_EXISTS") throw new Error("Slug already exists — choose another");
        throw new Error("Save failed");
      }

      const j = await res.json().catch(() => ({}));
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

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  if (preview) {
    return (
      <div className="min-h-screen bg-[#FCFCF9]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white/90 backdrop-blur-md px-6 py-3">
          <button
            onClick={() => setPreview(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-navy hover:bg-surface-raised transition shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Back to editor
          </button>
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            <span className="font-mono text-navy font-bold">{words} words</span>
            <span>·</span>
            <span>{minutes} min read</span>
          </div>
        </div>
        <Preview title={title} html={html} json={json ?? undefined} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFCF9] flex flex-col text-navy">
      <style>{EDITOR_STYLES}</style>

      {/* Top Application Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-white z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/blogs"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-dim border border-border hover:bg-surface-raised transition"
            title="Back to Articles"
          >
            <ArrowLeft className="h-4 w-4 text-navy" />
          </Link>
          <div className="min-w-0 hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary leading-none">Article</p>
            <p className="text-xs sm:text-sm font-bold text-navy truncate leading-none mt-1 max-w-[200px] md:max-w-[280px]">
              {title || "Untitled Article"}
            </p>
          </div>
          <span className="hidden md:inline-flex">
            <StatusIndicator status={saveStatus} />
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden xl:inline text-xs text-text-tertiary font-mono">
            {words} words · {minutes} min
          </span>

          <button
            onClick={() => setPreview(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-1.5 text-xs font-bold text-navy hover:bg-surface-raised transition shadow-xs"
          >
            <Eye className="h-3.5 w-3.5 text-text-tertiary" /> Preview
          </button>

          <button
            onClick={async () => {
              if (scheduledAt && new Date(scheduledAt) > new Date()) {
                setStatus("scheduled");
                await save();
              } else {
                setStatus("published");
                await save();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 sm:px-5 py-1.5 text-xs font-bold text-navy shadow-xs hover:bg-brand-hover hover:text-white transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {status === "published" ? "Update Article" : status === "scheduled" ? "Scheduled" : "Publish Article"}
          </button>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white hover:bg-surface-raised lg:hidden shrink-0 text-navy"
            aria-label="Toggle inspector"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 flex pt-16">
        {/* Left/Desktop Inspector Sidebar */}
        <aside
          style={{ width: `${sidebarWidth}px` }}
          className={`hidden lg:flex flex-col border-r border-border bg-white fixed left-0 top-16 bottom-0 z-20 overflow-y-auto ${
            !showSidebar ? "lg:hidden" : ""
          }`}
        >
          {/* Inspector Tab Buttons */}
          <div className="grid grid-cols-4 p-2 border-b border-border bg-[#F9FAFB] gap-1 text-[11px] font-bold text-center">
            <button
              onClick={() => setActiveTab("organize")}
              className={`py-1.5 rounded-lg transition ${
                activeTab === "organize" ? "bg-white text-navy shadow-xs" : "text-text-tertiary hover:text-navy"
              }`}
            >
              Organize
            </button>
            <button
              onClick={() => setActiveTab("seo")}
              className={`py-1.5 rounded-lg transition ${
                activeTab === "seo" ? "bg-white text-navy shadow-xs" : "text-text-tertiary hover:text-navy"
              }`}
            >
              SEO
            </button>
            <button
              onClick={() => setActiveTab("featured")}
              className={`py-1.5 rounded-lg transition ${
                activeTab === "featured" ? "bg-white text-navy shadow-xs" : "text-text-tertiary hover:text-navy"
              }`}
            >
              Cover
            </button>
            <button
              onClick={() => setActiveTab("publishing")}
              className={`py-1.5 rounded-lg transition ${
                activeTab === "publishing" ? "bg-white text-navy shadow-xs" : "text-text-tertiary hover:text-navy"
              }`}
            >
              Schedule
            </button>
          </div>

          {/* Inspector Panel Content */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
            {/* TAB: ORGANIZE */}
            {activeTab === "organize" && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-navy mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                      setSlugEdited(true);
                    }}
                    className="w-full rounded-lg border border-border bg-[#FCFCF9] px-3 py-2 text-xs font-mono text-navy focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {catOptions.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5 text-[11px] font-semibold text-navy"
                      >
                        #{t}
                        <button onClick={() => handleRemoveTag(t)} className="text-text-tertiary hover:text-navy">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Type tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB: SEO */}
            {activeTab === "seo" && (
              <div className="space-y-4">
                {seoWarnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> SEO Checklist ({seoWarnings.length})
                    </p>
                    {seoWarnings.map((w, i) => (
                      <p key={i} className="text-[11px] text-amber-800">
                        • {w}
                      </p>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-navy mb-1">SEO Title</label>
                  <input
                    type="text"
                    placeholder={title || "Article SEO Title"}
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">Meta Description</label>
                  <textarea
                    rows={3}
                    placeholder="Summary for search engines..."
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">Canonical URL</label>
                  <input
                    type="text"
                    placeholder="https://yourblog.com/post-slug"
                    value={canonical}
                    onChange={(e) => setCanonical(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs font-mono text-navy focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB: FEATURED COVER */}
            {activeTab === "featured" && (
              <div>
                <FeaturedImagePicker value={featuredImage} onChange={setFeaturedImage} />
              </div>
            )}

            {/* TAB: PUBLISHING & SCHEDULE */}
            {activeTab === "publishing" && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-navy mb-1">Post Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Live)</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="trash">Trash</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">Schedule Publish Timestamp</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`hidden lg:block w-1 hover:w-1.5 bg-border hover:bg-brand cursor-col-resize fixed left-[${sidebarWidth}px] top-16 bottom-0 z-20 transition-colors`}
          style={{ left: `${sidebarWidth}px` }}
        />

        {/* Main Canvas Area */}
        <main
          className="flex-1 flex flex-col items-center p-4 sm:p-8 overflow-y-auto"
          style={{ marginLeft: showSidebar ? `${sidebarWidth}px` : "0" }}
        >
          {/* Tiptap Sticky Toolbar */}
          <div className="sticky top-0 z-10 w-full max-w-3xl mb-4">
            <Toolbar editor={editor} />
          </div>

          {/* Document Canvas Card */}
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-border shadow-md p-6 sm:p-12 min-h-[700px] mb-20">
            {/* Title Input */}
            <input
              type="text"
              placeholder="Article Title..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full text-2xl sm:text-4xl font-extrabold text-navy placeholder:text-text-tertiary focus:outline-none border-b border-border pb-4 mb-6 leading-tight"
            />

            {/* Bubble Menus */}
            <SelectionBubbleMenu editor={editor} />
            <ImageBubbleMenu editor={editor} />

            {/* Tiptap ProseMirror Canvas */}
            <EditorContent editor={editor} className="prose prose-navy max-w-none focus:outline-none min-h-[400px]" />
          </div>
        </main>
      </div>
    </div>
  );
}
