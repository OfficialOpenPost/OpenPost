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
import { tiptapToEditorDocument, editorDocumentToHtml } from "@/lib/editorDocument";
import { SharedRender } from "@/components/render/SharedRender";
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
  Image as ImageIcon,
  Trash2,
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
  const [categoryId, setCategoryId] = useState<string | null>(null);
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

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [activeSaveAction, setActiveSaveAction] = useState<"draft" | "publish" | "update" | null>(null);
  const isInitialLoadRef = useRef<boolean>(Boolean(effectiveId));

  const editor = useOpenPostEditor({
    content: "",
    onChange: (h, j) => {
      setHtml(h);
      setJson(j);
      if (isInitialLoadRef.current) {
        return;
      }
      setIsDirty(true);
      setSaveStatus("unsaved");
    },
  });

  const loadedContentRef = useRef<any>(null);
  const contentSyncedRef = useRef<boolean>(false);

  // Load existing post if editing
  useEffect(() => {
    if (!effectiveId) return;
    setLoadingInitial(true);
    isInitialLoadRef.current = true;
    contentSyncedRef.current = false;

    fetch(`/api/blogs/${effectiveId}?_t=${Date.now()}`, { cache: "no-store" })
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
          if (post.category?.id) setCategoryId(post.category.id);
          if (post.scheduledAt) setScheduledAt(new Date(post.scheduledAt).toISOString().slice(0, 16));
          if (post.seo) {
            setSeoTitle(post.seo.title || "");
            setSeoDesc(post.seo.description || "");
            setCanonical(post.seo.canonical || "");
            setOgTitle(post.seo.ogTitle || "");
            setOgDesc(post.seo.ogDesc || "");
            setOgImage(post.seo.ogImage || "");
          }
          const cover =
            post.featuredImage?.variants?.publicUrl ||
            post.featuredImage?.url ||
            post.seo?.ogImage ||
            post.seo?.image ||
            null;
          if (cover) setFeaturedImage(cover);

          let cnt = post.content;
          if (typeof cnt === "string") {
            try {
              if (cnt.trim().startsWith("{") || cnt.trim().startsWith("[")) {
                cnt = JSON.parse(cnt);
              }
            } catch {}
          }
          loadedContentRef.current = cnt;

          if (editor && cnt) {
            try {
              editor.commands.setContent(cnt, false);
              contentSyncedRef.current = true;
            } catch (err) {
              console.warn("Could not set editor content directly:", err);
            }
          }
          setIsDirty(false);
          setSaveStatus("saved");
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 300);
        }
      })
      .catch((err) => console.error("Error loading blog:", err))
      .finally(() => setLoadingInitial(false));
  }, [effectiveId, editor]);

  // Sync content into editor once editor instance is available
  useEffect(() => {
    if (editor && loadedContentRef.current && !contentSyncedRef.current) {
      try {
        editor.commands.setContent(loadedContentRef.current, false);
        contentSyncedRef.current = true;
        setTimeout(() => {
          isInitialLoadRef.current = false;
          setIsDirty(false);
          setSaveStatus("saved");
        }, 150);
      } catch (err) {
        console.warn("Could not sync editor content:", err);
      }
    }
  }, [editor]);

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
    const fetchCategories = () => {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const headers: Record<string, string> = {};
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;
      fetch("/api/v1/categories", { headers })
        .then((r) => r.json())
        .then((j) => {
          if (Array.isArray(j.data)) setCatOptions(j.data);
        })
        .catch(() => {});
    };

    fetchCategories();
    window.addEventListener("projectChanged", fetchCategories);
    return () => window.removeEventListener("projectChanged", fetchCategories);
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
    setIsDirty(true);
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
  const save = async (
    manualLabel?: string,
    overrideStatus?: "draft" | "published" | "scheduled" | "trash",
    actionType?: "draft" | "publish" | "update"
  ) => {
    if (loadingInitial || isInitialLoadRef.current) {
      return;
    }

    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    // Skip save if nothing actually changed (except for explicit publish/update actions)
    if (!manualLabel && !isDirty) {
      return;
    }

    // For new posts, require at least a title or some content
    const hasContent = Boolean(title.trim().length > 0 || (editor && !editor.isEmpty));
    if (!hasContent && !blogIdRef.current) {
      return;
    }

    const currentBlogId = blogIdRef.current;
    const targetStatus = overrideStatus || status;
    if (overrideStatus && overrideStatus !== status) {
      setStatus(overrideStatus);
    }

    isSavingRef.current = true;
    setActiveSaveAction(
      actionType ||
        (targetStatus === "published"
          ? currentBlogId && status === "published"
            ? "update"
            : "publish"
          : "draft")
    );
    setSaveStatus("saving");

    try {
      const tiptapJson = editor?.getJSON() || {};
      const editorDoc = tiptapToEditorDocument(tiptapJson);
      const renderedHtml = `<article class="openpost-article">${editor?.getHTML() || ""}</article>`;

      const payload: any = {
        title: title || "Untitled Article",
        slug: slug || "untitled",
        content: tiptapJson,
        editorDocument: editorDoc,
        renderedHtml,
        contentVersion: 1,
        status: targetStatus,
        featuredImage: featuredImage ? { url: featuredImage } : null,
        category: category ? { name: category } : null,
        categoryId: categoryId || undefined,
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

      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const saveHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (activeProjId) saveHeaders["X-OpenPost-Project"] = activeProjId;

      let res;
      if (currentBlogId) {
        res = await fetch(`/api/blogs/${currentBlogId}`, {
          method: "PUT",
          headers: saveHeaders,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/blogs", {
          method: "POST",
          headers: saveHeaders,
          body: JSON.stringify(payload),
        });
      }

      const jsonRes = await res.json();
      if (!res.ok) {
        console.error("Save response error:", jsonRes);
        throw new Error(jsonRes.error?.message || jsonRes.message || `Failed to save (Status ${res.status})`);
      }

      // Immediately store returned blog ID, status, and slug in state
      if (jsonRes.data) {
        if (!currentBlogId && jsonRes.data.id) {
          const newId = jsonRes.data.id;
          blogIdRef.current = newId;
          setBlogId(newId);
          window.history.replaceState({}, "", `/dashboard/editor?id=${newId}`);
        }
        if (jsonRes.data.status) {
          setStatus(jsonRes.data.status);
        }
        if (jsonRes.data.slug) {
          setSlug(jsonRes.data.slug);
        }
      }

      setIsDirty(false);
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
      setActiveSaveAction(null);
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

  // Auto-save: 15 seconds after last edit, only if dirty
  useEffect(() => {
    if (isInitialLoadRef.current || !isDirty) return;
    if (!title && !editor?.getText()?.trim()) return;
    const timer = setTimeout(() => {
      if (isDirty) save();
    }, 15000);
    return () => clearTimeout(timer);
  }, [title, html, category, tags, seoTitle, seoDesc, featuredImage, status, scheduledAt, isDirty]);

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
        <div className="w-full max-w-[1440px] 2xl:max-w-[1680px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] px-8 sm:px-14 py-8 sm:py-12 my-4">
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
            <div className="w-full mb-8 rounded-2xl overflow-hidden border border-border shadow-xs bg-slate-50 flex justify-center">
              <img
                src={featuredImage}
                alt={title}
                className="w-full h-auto max-h-[720px] object-contain rounded-2xl block"
              />
            </div>
          )}
          <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />
          <div className="tiptap prose prose-lg prose-navy max-w-none">
            {editor ? (
              <SharedRender content={editor.getJSON()} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F4F5F7] text-navy font-sans select-none overflow-hidden relative">
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />

      {/* ── TOP 56px HEADER ── */}
      <header className="h-14 bg-white border-b border-border px-3 sm:px-5 flex items-center justify-between z-30 shrink-0 select-none">
        {/* Left: Back + Doc Title Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/blogs"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-navy hover:bg-surface-raised transition shrink-0"
            title="Back to Articles"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary leading-none">
              Editing Article
            </span>
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

          {/* Status Badge in Header */}
          <span
            className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${
              status === "published"
                ? "bg-success/10 text-success border-success/20"
                : status === "scheduled"
                ? "bg-orange/10 text-orange border-orange/20"
                : "bg-brand/10 text-brand border-brand/20"
            }`}
          >
            {status}
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

          {/* Save Draft Button */}
          <button
            disabled={
              (isSavingRef.current || saveStatus === "saving") ||
              (!isDirty && status === "draft" && Boolean(blogIdRef.current)) ||
              !Boolean(title.trim().length > 0 || (editor && !editor.isEmpty))
            }
            onClick={() => save("Saved draft", "draft", "draft")}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
              !(isSavingRef.current || saveStatus === "saving") &&
              (isDirty || status !== "draft" || !blogIdRef.current) &&
              Boolean(title.trim().length > 0 || (editor && !editor.isEmpty))
                ? "border-border bg-white text-navy hover:bg-surface-raised cursor-pointer"
                : "border-slate-200 bg-slate-100/80 text-slate-400 cursor-not-allowed opacity-60"
            }`}
            title="Save as Draft"
          >
            {activeSaveAction === "draft" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
            ) : (
              <Save className="h-3.5 w-3.5 text-text-tertiary" />
            )}
            {activeSaveAction === "draft" ? "Saving Draft..." : "Save Draft"}
          </button>

          {/* Publish / Update Button */}
          {status === "published" ? (
            /* Update Post Button (Visibly Gray & Disabled until user makes changes) */
            <button
              disabled={(isSavingRef.current || saveStatus === "saving") || !isDirty}
              onClick={() => save("Updated post", "published", "update")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                isDirty && !(isSavingRef.current || saveStatus === "saving")
                  ? "bg-brand text-navy hover:bg-brand-hover hover:text-white shadow-xs cursor-pointer"
                  : "bg-slate-200 text-slate-400 border border-slate-300/80 cursor-not-allowed opacity-60"
              }`}
              title={isDirty ? "Save changes to live post" : "No unsaved edits to update"}
            >
              {activeSaveAction === "update" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-navy" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {activeSaveAction === "update" ? "Updating..." : "Update Post"}
            </button>
          ) : (
            /* Publish / Schedule Button (Active for drafts and new articles) */
            <button
              disabled={
                (isSavingRef.current || saveStatus === "saving") ||
                !Boolean(title.trim().length > 0 || (editor && !editor.isEmpty))
              }
              onClick={() => {
                const target =
                  scheduledAt && new Date(scheduledAt) > new Date()
                    ? "scheduled"
                    : "published";
                save("Published post", target, "publish");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-1.5 text-xs font-bold text-navy shadow-xs hover:bg-brand-hover hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand disabled:hover:text-navy transition cursor-pointer"
            >
              {activeSaveAction === "publish" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-navy" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {activeSaveAction === "publish"
                ? status === "scheduled"
                  ? "Scheduling..."
                  : "Publishing..."
                : status === "scheduled"
                ? "Schedule Post"
                : "Publish Post"}
            </button>
          )}

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
            <div className="w-full max-w-[1440px] 2xl:max-w-[1680px]">
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
            <div className="w-full max-w-[1440px] 2xl:max-w-[1680px] h-full flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.05)] overflow-hidden relative transition-all min-h-0">
              {/* Fixed Title Header Section */}
              <div className="px-8 sm:px-14 pt-6 pb-4 shrink-0 border-b border-slate-100 bg-white">
                {/* Add Cover Image trigger when no cover is set */}
                {!featuredImage && (
                  <button
                    type="button"
                    onClick={() => setShowSidebar(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-brand font-semibold mb-2 transition"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Add cover image
                  </button>
                )}
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

                {/* Big Uncropped Featured Cover Image — Placed just below Title */}
                {featuredImage && (
                  <div className="relative group/cover mb-8 w-full rounded-2xl overflow-hidden border border-border shadow-xs bg-slate-50 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredImage}
                      alt={title || "Cover image"}
                      className="w-full h-auto max-h-[720px] object-contain rounded-2xl block"
                    />
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover/cover:opacity-100 transition-opacity bg-navy/85 backdrop-blur-md p-1.5 rounded-xl text-white shadow-lg z-20">
                      <button
                        type="button"
                        onClick={() => setShowSidebar(true)}
                        className="px-3 py-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg transition"
                      >
                        Change Cover
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedImage(null);
                          setSaveStatus("unsaved");
                        }}
                        className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-500/30 rounded-lg transition"
                        title="Remove Cover Image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading Overlay */}
                {loadingInitial && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center z-30 gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-brand" />
                    <p className="text-xs font-semibold text-text-tertiary">Loading article content...</p>
                  </div>
                )}

                {/* Tiptap Content - permanently mounted so content is never lost */}
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
              title={title}
              slug={slug}
              setSlug={(val: string) => { setSlug(val); setIsDirty(true); setSaveStatus("unsaved"); }}
              setSlugEdited={setSlugEdited}
              category={category}
              setCategory={(val: string) => { setCategory(val); setCategoryId(null); setIsDirty(true); setSaveStatus("unsaved"); }}
              setCategoryId={setCategoryId}
              catOptions={catOptions}
              tags={tags}
              setTags={(val: any) => { setTags(val); setIsDirty(true); setSaveStatus("unsaved"); }}
              tagInput={tagInput}
              setTagInput={setTagInput}
              featuredImage={featuredImage}
              setFeaturedImage={(val: string | null) => { setFeaturedImage(val); setIsDirty(true); setSaveStatus("unsaved"); }}
              seoTitle={seoTitle}
              setSeoTitle={(val: string) => { setSeoTitle(val); setIsDirty(true); setSaveStatus("unsaved"); }}
              seoDesc={seoDesc}
              setSeoDesc={(val: string) => { setSeoDesc(val); setIsDirty(true); setSaveStatus("unsaved"); }}
              canonical={canonical}
              setCanonical={(val: string) => { setCanonical(val); setIsDirty(true); setSaveStatus("unsaved"); }}
              ogTitle={ogTitle}
              setOgTitle={(val: string) => { setOgTitle(val); setIsDirty(true); setSaveStatus("unsaved"); }}
              ogDesc={ogDesc}
              setOgDesc={(val: string) => { setOgDesc(val); setIsDirty(true); setSaveStatus("unsaved"); }}
              ogImage={ogImage}
              setOgImage={(val: string) => { setOgImage(val); setIsDirty(true); setSaveStatus("unsaved"); }}
              status={status}
              setStatus={(val: any) => { setStatus(val); setIsDirty(true); setSaveStatus("unsaved"); }}
              scheduledAt={scheduledAt}
              setScheduledAt={(val: string) => { setScheduledAt(val); setIsDirty(true); setSaveStatus("unsaved"); }}
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
