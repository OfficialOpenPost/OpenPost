"use client";

import { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useOpenPostEditor } from "@/components/editor/useOpenPostEditor";
import { EditorContent } from "@tiptap/react";
import { EDITOR_STYLES } from "@/components/editor/extensions";
import { EditorRibbon } from "@/components/editor/toolbar/EditorRibbon";
import { FindReplaceBar } from "@/components/editor/toolbar/FindReplaceBar";
import { EditorSidePanel } from "@/components/editor/panels/EditorSidePanel";
import { DocumentOutline } from "@/components/editor/outline/DocumentOutline";
import { SelectionBubbleMenu } from "@/components/editor/BubbleMenus";
import { StatusIndicator } from "@/components/editor/StatusIndicator";
import { Preview } from "@/components/editor/Preview";
import { useAutosave } from "@/hooks/useAutosave";
import { countWords, readingTime } from "@/lib/publish";
import { slugify } from "@/lib/slug";
import {
  ArrowLeft,
  Eye,
  Sparkles,
  Settings2,
  ListTree,
  Maximize,
  Minimize,
  Search,
  Check,
  RotateCcw,
  Loader2,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface EditorPageProps {
  initialBlogId?: string;
}

function EditorInner({ initialBlogId }: EditorPageProps) {
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
  const [showOutlineDrawer, setShowOutlineDrawer] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [canonical, setCanonical] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDesc, setOgDesc] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [revisions, setRevisions] = useState<Array<{ id: string; label: string | null; createdAt: string; createdBy: string; content?: any }>>([]);
  const [catOptions, setCatOptions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
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

  // Global Keyboard Shortcuts (Ctrl+F for find, F11 for fullscreen, Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setShowFindReplace(true);
      }
      if (e.key === "F11") {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle resizable sidebar (on right)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const newWidth = Math.min(480, Math.max(280, window.innerWidth - e.clientX));
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
  }, [blogId]);

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
    if (!featuredImage && !ogImage) w.push("Missing featured/OG cover image");
    const hasImages = JSON.stringify(json ?? {}).includes('"type":"image"');
    const hasAlt = JSON.stringify(json ?? {}).includes('"alt"');
    if (hasImages && !hasAlt) w.push("Images missing alt text for SEO/accessibility");
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
        throw new Error(j?.error?.message || "Save failed");
      }

      const j = await res.json().catch(() => ({}));
      if (j.data?.id && !blogId) setBlogId(j.data.id);
      if (j.data?.slug) setSlug(j.data.slug);
    },
  });

  const words = useMemo(() => countWords(html), [html]);
  const minutes = useMemo(() => readingTime(words), [words]);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugEdited) setSlug(slugify(v) || "untitled");
  };

  const handleRestoreRevision = (rev: any) => {
    if (!confirm(`Restore revision from ${new Date(rev.createdAt).toLocaleString()}?`)) return;
    if (editor && rev.content) {
      editor.commands.setContent(rev.content);
    }
  };

  if (preview) {
    return (
      <div className="min-h-screen bg-[#F4F5F7]">
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
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#F4F5F7] flex flex-col text-navy select-none">
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />

      {/* Top Application Bar (Fixed at top: 0, height: 56px) */}
      <header className="h-14 shrink-0 border-b border-border bg-white z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs select-none">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/blogs"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-dim border border-border hover:bg-surface-raised transition"
            title="Back to Articles"
          >
            <ArrowLeft className="h-4 w-4 text-navy" />
          </Link>
          <div className="min-w-0 hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary leading-none">OpenPost Studio</p>
            <p className="text-xs sm:text-sm font-bold text-navy truncate leading-none mt-1 max-w-[200px] md:max-w-[320px]">
              {title || "Untitled Article"}
            </p>
          </div>
          <span className="hidden md:inline-flex">
            <StatusIndicator status={saveStatus} />
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden xl:inline text-xs text-text-tertiary font-mono">
            {words} words · {minutes} min read
          </span>

          <button
            onClick={() => setPreview(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-navy hover:bg-surface-raised transition shadow-xs"
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-1.5 text-xs font-bold text-navy shadow-xs hover:bg-brand-hover hover:text-white transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {status === "published" ? "Update Post" : status === "scheduled" ? "Scheduled" : "Publish Post"}
          </button>

          {/* Outline Drawer Toggle */}
          <button
            onClick={() => setShowOutlineDrawer(!showOutlineDrawer)}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border border-border transition shrink-0 ${
              showOutlineDrawer ? "bg-navy text-white" : "bg-white text-navy hover:bg-surface-raised"
            }`}
            title="Toggle Document Outline"
          >
            <ListTree className="h-4 w-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border border-border transition shrink-0 hidden sm:flex ${
              isFullscreen ? "bg-navy text-white" : "bg-white text-navy hover:bg-surface-raised"
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          {/* Settings Sidebar Toggle */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border border-border transition shrink-0 ${
              showSidebar ? "bg-navy text-white" : "bg-white text-navy hover:bg-surface-raised"
            }`}
            title="Toggle Inspector Sidebar"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* FIXED TOP OPTIONS NAVBAR (Directly below header, 100% fixed, always visible) */}
      <div
        className="w-full shrink-0 border-b border-border bg-white/95 backdrop-blur-md px-3 sm:px-5 py-1.5 flex justify-center z-20 shadow-xs transition-all overflow-hidden"
        style={{ paddingRight: showSidebar ? `${sidebarWidth}px` : undefined }}
      >
        <div className="w-full max-w-[920px] 2xl:max-w-[1020px]">
          <EditorRibbon
            editor={editor}
            onOpenFindReplace={() => setShowFindReplace(true)}
            onToggleOutline={() => setShowOutlineDrawer(!showOutlineDrawer)}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            isFullscreen={isFullscreen}
            onOpenPreview={() => setPreview(true)}
          />
        </div>
      </div>

      {/* Editor Body Area (Fills exact remaining viewport height, zero outer scroll) */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Document Outline Drawer (Collapsible Left Flyout) */}
        {showOutlineDrawer && (
          <div className="fixed left-0 top-14 bottom-0 z-25 w-72 border-r border-border bg-white/95 backdrop-blur-md p-4 shadow-xl overflow-y-auto animate-in slide-in-from-left duration-200">
            <DocumentOutline editor={editor} onClose={() => setShowOutlineDrawer(false)} />
          </div>
        )}

        {/* Find & Replace Bar Overlay */}
        <FindReplaceBar
          editor={editor}
          isOpen={showFindReplace}
          onClose={() => setShowFindReplace(false)}
        />

        {/* Main Canvas Area (Fixed, centered paper card) */}
        <main
          className="flex-1 flex flex-col items-center p-3 sm:p-4 h-full overflow-hidden transition-all relative min-h-0 w-full"
          style={{ marginRight: showSidebar ? `${sidebarWidth}px` : "0" }}
        >
          {/* Central Document Paper Card — Fixed size, ONLY internal content scrolls */}
          <div className="w-full max-w-[940px] 2xl:max-w-[1040px] h-full flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.05)] overflow-hidden relative transition-all min-h-0">
            {/* Title Section (Fixed at top of paper card) */}
            <div className="px-8 sm:px-14 pt-7 pb-4 shrink-0 border-b border-slate-100 bg-white">
              <input
                type="text"
                placeholder="Article Title..."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-3xl sm:text-4xl font-extrabold text-navy placeholder:text-slate-300 focus:outline-none leading-tight tracking-tight bg-transparent"
              />
            </div>

            {/* Scrollable Document Canvas (ONLY the text/image content inside scrolls) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 sm:px-14 py-8 relative select-text">
              {/* Dynamic Editor CSS Injection */}
              <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />

              {/* Selection Bubble Menu */}
              {editor && <SelectionBubbleMenu editor={editor} />}

              {/* Tiptap Canvas */}
              <EditorContent
                editor={editor}
                className="prose prose-lg prose-navy max-w-none focus:outline-none min-h-[360px]"
              />
            </div>
          </div>
        </main>
      </div>

        {/* Resizer Handle */}
        {showSidebar && (
          <div
            onMouseDown={handleMouseDown}
            className="hidden lg:block w-1 hover:w-1.5 bg-border hover:bg-brand cursor-col-resize fixed top-14 bottom-0 z-20 transition-colors"
            style={{ right: `${sidebarWidth}px` }}
          />
        )}

        {/* Right-hand Context Inspector Sidebar */}
        {showSidebar && (
          <aside
            style={{ width: `${sidebarWidth}px` }}
            className="flex flex-col border-l border-border bg-white fixed right-0 top-14 bottom-0 z-20 overflow-y-auto shadow-xs"
          >
            <EditorSidePanel
              editor={editor}
              slug={slug}
              setSlug={setSlug}
              setSlugEdited={setSlugEdited}
              category={category}
              setCategory={setCategory}
              catOptions={catOptions}
              tags={tags}
              setTags={setTags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              featuredImage={featuredImage}
              setFeaturedImage={setFeaturedImage}
              seoTitle={seoTitle}
              setSeoTitle={setSeoTitle}
              seoDesc={seoDesc}
              setSeoDesc={setSeoDesc}
              canonical={canonical}
              setCanonical={setCanonical}
              ogTitle={ogTitle}
              setOgTitle={setOgTitle}
              ogDesc={ogDesc}
              setOgDesc={setOgDesc}
              ogImage={ogImage}
              setOgImage={setOgImage}
              status={status}
              setStatus={setStatus}
              scheduledAt={scheduledAt}
              setScheduledAt={setScheduledAt}
              revisions={revisions}
              onRestoreRevision={handleRestoreRevision}
              seoWarnings={seoWarnings}
              words={words}
              minutes={minutes}
            />
          </aside>
        )}
      </div>
    );
  }

export default function EditorPage({ initialBlogId }: EditorPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#F4F5F7]">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <EditorInner initialBlogId={initialBlogId} />
    </Suspense>
  );
}
