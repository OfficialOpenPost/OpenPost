"use client";

import React, { useState, useEffect, useMemo, Suspense, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useOpenPostEditor } from "@/components/editor/useOpenPostEditor";
import { EditorContent } from "@tiptap/react";
import { EditorRibbon } from "@/components/editor/toolbar/EditorRibbon";
import { EditorSidePanel } from "@/components/editor/panels/EditorSidePanel";
import { SelectionBubbleMenu } from "@/components/editor/BubbleMenus";
import { FindReplaceBar } from "@/components/editor/toolbar/FindReplaceBar";
import { EDITOR_STYLES } from "@/components/editor/extensions";
import {
  ArrowLeft,
  Sparkles,
  Eye,
  Settings2,
  Maximize,
  Minimize,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
} from "lucide-react";

interface EditorPageProps {
  initialBlogId?: string;
}

function StatusIndicator({ status }: { status: "saved" | "saving" | "unsaved" | "error" }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3 animate-spin" /> Saving...
      </span>
    );
  }
  if (status === "unsaved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Unsaved
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle className="h-3 w-3" /> Save Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="h-3 w-3" /> Saved
    </span>
  );
}

function EditorInner({ initialBlogId }: { initialBlogId?: string }) {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id") || "";
  const effectiveId = initialBlogId || idFromUrl;

  const [blogId, setBlogId] = useState<string | null>(effectiveId || null);
  const blogIdRef = useRef<string | null>(effectiveId || null);
  const isSavingRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false);

  useEffect(() => {
    blogIdRef.current = blogId;
  }, [blogId]);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled" | "trash">("draft");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [html, setHtml] = useState("");
  const [json, setJson] = useState<any>(null);
  const [preview, setPreview] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
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
          blogIdRef.current = post.id;
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
              queueMicrotask(() => {
                editor.commands.setContent(post.content);
              });
            } catch (err) {
              console.warn("Could not set editor content:", err);
            }
          }
        }
      })
      .catch((err) => console.error("Error loading blog:", err))
      .finally(() => setLoadingInitial(false));
  }, [effectiveId, editor]);

  // Native Fullscreen Toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn("Exit fullscreen error:", err);
      });
      setIsFullscreen(false);
    }
  }, []);

  // Sync fullscreen state with browser events (e.g. Esc key or browser button)
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  // Global Keyboard Shortcuts (Ctrl+F for find, F11 for fullscreen, Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setShowFindReplace(true);
      }
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen]);

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
    const plain = editor?.getText() || "";
    if (title.length < 10) w.push("Title is very short for SEO (aim for 40-60 characters)");
    if (!seoDesc || seoDesc.length < 50) w.push("Meta description is missing or too short");
    if (!featuredImage) w.push("No featured cover image selected");
    if (plain.split(/\s+/).filter(Boolean).length < 200) w.push("Article is short (under 200 words)");
    return w;
  }, [title, seoDesc, featuredImage, editor]);

  // Word count & Reading time
  const { words, minutes } = useMemo(() => {
    const plain = editor?.getText() || "";
    const w = plain.split(/\s+/).filter(Boolean).length;
    const m = Math.max(1, Math.ceil(w / 200));
    return { words: w, minutes: m };
  }, [editor]);

  // Auto-slug generator
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSaveStatus("unsaved");
    if (!slugEdited) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generated || "untitled");
    }
  };

  // Save handler with concurrency lock and immediate blogId reference update
  const save = async (manualLabel?: string) => {
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    isSavingRef.current = true;
    setSaveStatus("saving");

    try {
      const currentBlogId = blogIdRef.current;
      const payload: any = {
        title: title || "Untitled Article",
        slug: slug || "untitled",
        content: editor?.getJSON() || {},
        status,
        featuredImage: featuredImage ? { url: featuredImage } : null,
        category: category ? { name: category } : null,
        tags: tags.map((t) => ({ name: t })),
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        seo: {
          title: seoTitle || title,
          description: seoDesc,
          canonical,
          ogTitle: ogTitle || title,
          ogDesc: ogDesc || seoDesc,
          ogImage: ogImage || featuredImage,
        },
      };

      if (manualLabel) {
        payload.revisionLabel = manualLabel;
      }

      let res;
      if (currentBlogId) {
        res = await fetch(`/api/blogs/${currentBlogId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const jsonRes = await res.json();
      if (!res.ok) {
        console.error("Save response error:", jsonRes);
        throw new Error(jsonRes.error?.message || jsonRes.message || `Failed to save (Status ${res.status})`);
      }

      // Immediately store returned blog ID in both ref and state
      if (!currentBlogId && jsonRes.data?.id) {
        const newId = jsonRes.data.id;
        blogIdRef.current = newId;
        setBlogId(newId);
        window.history.replaceState({}, "", `/dashboard/editor?id=${newId}`);
      }

      setSaveStatus("saved");

      // Reload revisions
      const activeId = currentBlogId || jsonRes.data?.id;
      if (activeId) {
        fetch(`/api/blogs/${activeId}/revisions`)
          .then((r) => r.json())
          .then((j) => {
            if (Array.isArray(j.data)) setRevisions(j.data);
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
    } finally {
      isSavingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        save();
      }
    }
  };

  // Restore revision handler
  const handleRestoreRevision = (revContent: any) => {
    if (editor && revContent) {
      editor.commands.setContent(revContent);
      setSaveStatus("unsaved");
    }
  };

  // Debounced auto-save (every 4 seconds of inactivity)
  useEffect(() => {
    if (!title && !editor?.getText()?.trim()) return;
    const timer = setTimeout(() => {
      save();
    }, 4000);
    return () => clearTimeout(timer);
  }, [title, html, category, tags, seoTitle, seoDesc, featuredImage, status, scheduledAt]);

  if (loadingInitial) {
    return (
      <div className="fixed inset-0 flex h-screen w-screen items-center justify-center bg-[#F4F5F7]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-xs font-bold text-navy">Loading Article...</p>
        </div>
      </div>
    );
  }

  // Reading Preview Modal
  if (preview) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F4F5F7] p-3 sm:p-6 text-navy select-text flex flex-col items-center">
        <div className="w-full max-w-[940px] 2xl:max-w-[1040px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] px-8 sm:px-14 py-8 sm:py-12 my-4">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-8">
            <button
              onClick={() => setPreview(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-navy hover:bg-surface-raised transition shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Editor
            </button>
            <span className="text-xs font-mono text-text-tertiary">
              {words} words · ~{minutes} min read
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy mb-6 leading-tight tracking-tight">
            {title || "Untitled Article"}
          </h1>
          {featuredImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-80 object-cover rounded-2xl mb-8 shadow-sm"
            />
          )}
          <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />
          <div
            className="tiptap prose prose-lg prose-navy max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#F4F5F7] flex flex-col text-navy select-none">
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />

      {/* ── TIER 1: TOP APPLICATION HEADER (Fixed: 56px height) ── */}
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
            onClick={() => {
              if (editor) setHtml(editor.getHTML());
              setPreview(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-navy hover:bg-surface-raised transition shadow-xs"
          >
            <Eye className="h-3.5 w-3.5 text-text-tertiary" /> Preview
          </button>

          <button
            onClick={async () => {
              setStatus("draft");
              await save("Saved draft");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-navy hover:bg-surface-raised transition shadow-xs"
            title="Save as Draft"
          >
            <Save className="h-3.5 w-3.5 text-text-tertiary" /> Save Draft
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

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border border-border transition shrink-0 hidden sm:flex ${
              isFullscreen ? "bg-navy text-white" : "bg-white text-navy hover:bg-surface-raised"
            }`}
            title={isFullscreen ? "Exit Fullscreen (F11 / Esc)" : "Fullscreen Mode (F11)"}
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

      {/* ── MAIN WORKSPACE CONTAINER (Directly below 56px header) ── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0 w-full">
        {/* Find & Replace Bar Overlay */}
        <FindReplaceBar
          editor={editor}
          isOpen={showFindReplace}
          onClose={() => setShowFindReplace(false)}
        />

        {/* ── LEFT & CENTER WORKSPACE (Contains Fixed Options Navbar + Main Document Card) ── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 min-w-0">
          {/* FIXED TOP OPTIONS NAVBAR (Directly under header, perfectly above canvas, never hides sidebar) */}
          <div className="w-full shrink-0 border-b border-border bg-white px-3 sm:px-5 py-1.5 flex justify-center z-10 shadow-xs relative">
            <div className="w-full max-w-[940px] 2xl:max-w-[1040px]">
              <EditorRibbon
                editor={editor}
                onOpenFindReplace={() => setShowFindReplace(true)}
                onToggleOutline={() => setShowSidebar(true)}
                onToggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
                onOpenPreview={() => {
                  if (editor) setHtml(editor.getHTML());
                  setPreview(true);
                }}
              />
            </div>
          </div>

          {/* MAIN DOCUMENT CANVAS AREA */}
          <main className="flex-1 flex flex-col items-center p-3 sm:p-4 h-full overflow-hidden relative min-h-0 w-full">
            {/* Central Document Paper Card — Locked to screen height, ONLY internal content scrolls */}
            <div className="w-full max-w-[940px] 2xl:max-w-[1040px] h-full flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.05)] overflow-hidden relative transition-all min-h-0">
              {/* Fixed Title Header Section */}
              <div className="px-8 sm:px-14 pt-7 pb-4 shrink-0 border-b border-slate-100 bg-white">
                <input
                  type="text"
                  placeholder="Article Title..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full text-3xl sm:text-4xl font-extrabold text-navy placeholder:text-slate-300 focus:outline-none leading-tight tracking-tight bg-transparent"
                />
              </div>

              {/* Dedicated Internal Scrolling Canvas Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 sm:px-14 py-8 relative select-text min-h-0">
                {/* Selection Bubble Menu */}
                {editor && <SelectionBubbleMenu editor={editor} />}

                {/* Tiptap Content */}
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
            className="hidden lg:block w-1 hover:w-1.5 bg-border hover:bg-brand cursor-col-resize shrink-0 z-20 transition-colors h-full"
          />
        )}

        {/* Right-hand Context Inspector Sidebar — NEVER hidden by top navbar */}
        {showSidebar && (
          <aside
            style={{ width: `${sidebarWidth}px` }}
            className="flex flex-col border-l border-border bg-white h-full shrink-0 overflow-y-auto shadow-xs z-20 min-h-0"
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
