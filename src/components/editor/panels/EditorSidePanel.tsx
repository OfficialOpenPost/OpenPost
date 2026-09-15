"use client";

import type { Editor } from "@tiptap/core";
import {
  FileText,
  Sliders,
  Sparkles,
  Image as ImageIcon,
  Tag,
  Folder,
  Calendar,
  History,
  ListTree,
  RotateCcw,
  Plus,
  X,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Table as TableIcon,
  List,
  Eye,
  GitCompare,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { ImageSettingsPanel } from "../image/ImageSettingsPanel";
import { DocumentOutline } from "../outline/DocumentOutline";
import { FeaturedImagePicker } from "../FeaturedImagePicker";
import { TableOfContents } from "./TableOfContents";
import { ContentQualityChecker } from "./ContentQualityChecker";
import { SharedRender } from "@/components/render/SharedRender";

interface EditorSidePanelProps {
  editor: Editor | null;
  title: string;
  slug: string;
  setSlug: (s: string) => void;
  setSlugEdited: (b: boolean) => void;
  category: string;
  setCategory: (c: string) => void;
  setCategoryId: (id: string | null) => void;
  catOptions: Array<{ id: string; name: string; slug: string }>;
  tags: string[];
  setTags: (t: string[]) => void;
  tagInput: string;
  setTagInput: (t: string) => void;
  featuredImage: string | null;
  setFeaturedImage: (f: string | null) => void;
  seoTitle: string;
  setSeoTitle: (s: string) => void;
  seoDesc: string;
  setSeoDesc: (s: string) => void;
  canonical: string;
  setCanonical: (s: string) => void;
  ogTitle: string;
  setOgTitle: (s: string) => void;
  ogDesc: string;
  setOgDesc: (s: string) => void;
  ogImage: string;
  setOgImage: (s: string) => void;
  status: "draft" | "published" | "scheduled" | "trash";
  setStatus: (s: "draft" | "published" | "scheduled" | "trash") => void;
  scheduledAt: string;
  setScheduledAt: (s: string) => void;
  excerpt: string;
  setExcerpt: (s: string) => void;
  revisions: Array<{ id: string; label: string | null; createdAt: string; createdBy: string; content?: any; wordCount?: number | null; authorName?: string }>;
  onRestoreRevision: (rev: any) => void;
  seoWarnings: string[];
  words: number;
  minutes: number;
}

export function EditorSidePanel({
  editor,
  title,
  slug,
  setSlug,
  setSlugEdited,
  category,
  setCategory,
  setCategoryId,
  catOptions,
  tags,
  setTags,
  tagInput,
  setTagInput,
  featuredImage,
  setFeaturedImage,
  seoTitle,
  setSeoTitle,
  seoDesc,
  setSeoDesc,
  canonical,
  setCanonical,
  ogTitle,
  setOgTitle,
  ogDesc,
  setOgDesc,
  ogImage,
  setOgImage,
  status,
  setStatus,
  scheduledAt,
  setScheduledAt,
  revisions,
  onRestoreRevision,
  seoWarnings,
  words,
  minutes,
  excerpt,
  setExcerpt,
}: EditorSidePanelProps) {
  const [activeTab, setActiveTab] = useState<"post" | "seo" | "cover" | "publish" | "history" | "outline" | "toc" | "quality">("post");
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);
  const [confirmingRestoreId, setConfirmingRestoreId] = useState<string | null>(null);
  const [previewingRevision, setPreviewingRevision] = useState<{ content: any; label: string | null; authorName?: string; createdAt: string } | null>(null);
  const [comparingRevision, setComparingRevision] = useState<{ content: any; label: string | null; authorName?: string; createdAt: string; wordCount?: number | null } | null>(null);

  const formatRelativeTime = (dateStr: string): string => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return "yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: diffDay > 365 ? "numeric" : undefined });
  };

  const countRevisionWords = (rev: { content?: any; wordCount?: number | null }): number => {
    if (typeof rev.wordCount === "number") return rev.wordCount;
    if (!rev.content) return 0;
    const str = typeof rev.content === "string" ? rev.content : JSON.stringify(rev.content);
    const text = str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return 0;
    return text.split(" ").filter(Boolean).length;
  };

  const handleAddCategory = async (catNameToAdd?: string) => {
    const name = (catNameToAdd || newCatInput).trim();
    if (!name) return;
    setIsCatSubmitting(true);
    try {
      const activeProjId = typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (activeProjId) headers["X-OpenPost-Project"] = activeProjId;

      const res = await fetch("/api/v1/categories", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, projectId: activeProjId || undefined }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setCategory(json.data.name);
        setCategoryId(json.data.id);
        setNewCatInput("");
        setIsAddingCat(false);
        window.dispatchEvent(new Event("projectChanged"));
      } else {
        const match = catOptions.find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (match) {
          setCategory(match.name);
          setCategoryId(match.id);
          setNewCatInput("");
          setIsAddingCat(false);
        } else {
          alert(json.error?.message || "Failed to create category");
        }
      }
    } catch (err: any) {
      alert("Error creating category: " + err.message);
    } finally {
      setIsCatSubmitting(false);
    }
  };

  const isImageActive = editor?.isActive("image");
  const isTableActive = editor?.isActive("table");

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

  return (
    <div className="flex flex-col h-full bg-white text-navy select-none">
      {/* Regular Navigation Tabs */}
      <div className="grid grid-cols-8 p-1 border-b border-border bg-[#F9FAFB] gap-0.5 text-[11px] font-bold text-center">
        <button
          type="button"
          onClick={() => setActiveTab("post")}
          className={`py-2 rounded-lg transition ${
            activeTab === "post" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
          }`}
          title="Post Details & Tags"
        >
          Post
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`py-2 rounded-lg transition relative ${
            activeTab === "seo" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
          }`}
          title="SEO & Social Meta"
        >
          SEO
          {seoWarnings.length > 0 && (
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cover")}
          className={`py-2 rounded-lg transition ${
            activeTab === "cover" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
          }`}
          title="Cover Image"
        >
          Cover
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("publish")}
          className={`py-2 rounded-lg transition ${
            activeTab === "publish" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
          }`}
          title="Publishing Status"
        >
          Status
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`py-2 rounded-lg transition ${
            activeTab === "history" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
          }`}
          title="Revisions History"
        >
          Revisions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("outline")}
          className={`py-2 rounded-lg transition ${
            activeTab === "outline" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
          }`}
          title="Document Outline"
        >
          Outline
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("toc")}
          className={`py-2 rounded-lg transition ${
            activeTab === "toc" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
          }`}
          title="Table of Contents"
        >
          TOC
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("quality")}
          className={`py-2 rounded-lg transition ${
            activeTab === "quality" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
          }`}
          title="Content Quality Checker"
        >
          Quality
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: POST METADATA */}
        {activeTab === "post" && (
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
                  <p className="text-[10px] text-text-tertiary mt-1">/blog/{slug}</p>
                  <div className="mt-2 rounded-lg bg-surface-raised border border-border px-3 py-2">
                    <p className="text-[10px] text-text-tertiary font-bold mb-0.5">Public URL Preview</p>
                    <p className="text-[11px] font-mono text-brand break-all">
                      {typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}/blog/{slug || "your-slug"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "");
                      setSlug(generated || "untitled");
                      setSlugEdited(true);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-[11px] font-bold text-navy hover:bg-brand/10 hover:border-brand/30 transition"
                  >
                    <Sparkles className="h-3 w-3 text-brand" /> Generate from Title
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-navy">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCat(!isAddingCat)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{isAddingCat ? "Cancel" : "Add Category"}</span>
                    </button>
                  </div>

                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      const match = catOptions.find((c) => c.name === e.target.value);
                      setCategoryId(match?.id || null);
                      setSlugEdited(true);
                    }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none cursor-pointer"
                  >
                    <option value="">Uncategorized</option>
                    {catOptions.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {isAddingCat ? (
                    <div className="mt-2 flex items-center gap-1.5 animate-in fade-in">
                      <input
                        type="text"
                        placeholder="Category name..."
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCategory();
                          }
                        }}
                        className="flex-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-navy focus:border-brand focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCategory()}
                        disabled={isCatSubmitting || !newCatInput.trim()}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition disabled:opacity-50 shadow-2xs"
                      >
                        {isCatSubmitting ? "Adding..." : "Add"}
                      </button>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5 text-[11px] font-semibold text-navy border border-border"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-text-tertiary hover:text-flame transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Type tag & press enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-navy mb-1">
                    <span>Excerpt</span>
                    <span
                      className={`text-[10px] font-mono font-normal ${
                        excerpt.length >= 120 && excerpt.length <= 160
                          ? "text-success"
                          : excerpt.length === 0
                          ? "text-text-tertiary"
                          : "text-amber-600"
                      }`}
                    >
                      {excerpt.length}/160
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Write a brief summary of this article..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none resize-none"
                  />
                  {excerpt.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {excerpt.length >= 120 && excerpt.length <= 160 ? (
                        <span className="text-[10px] text-success font-semibold">Ideal length for SEO</span>
                      ) : excerpt.length < 120 ? (
                        <span className="text-[10px] text-amber-600">Aim for 120-160 characters</span>
                      ) : (
                        <span className="text-[10px] text-amber-600">Too long — aim for 160 max</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Document Statistics */}
                <div className="rounded-xl border border-border bg-surface-raised p-3 space-y-1.5">
                  <p className="font-bold text-navy">Document Stats</p>
                  <div className="flex justify-between text-text-secondary text-[11px]">
                    <span>Word Count</span>
                    <span className="font-mono font-bold text-navy">{words} words</span>
                  </div>
                  <div className="flex justify-between text-text-secondary text-[11px]">
                    <span>Reading Time</span>
                    <span className="font-mono font-bold text-navy">{minutes} min read</span>
                  </div>
                  <div className="flex justify-between text-text-secondary text-[11px]">
                    <span>Character Count</span>
                    <span className="font-mono font-bold text-navy">
                      {(editor?.storage as any)?.characterCount?.characters?.() || words * 5} chars
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SEO & SOCIAL */}
            {activeTab === "seo" && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-navy mb-1">
                    <span>SEO Title</span>
                    <span className={`text-[10px] font-mono font-normal ${
                      seoTitle.length >= 30 && seoTitle.length <= 60
                        ? "text-success"
                        : (seoTitle.length >= 20 && seoTitle.length <= 29) || (seoTitle.length >= 61 && seoTitle.length <= 70)
                        ? "text-amber-600"
                        : "text-red-500"
                    }`}>
                      {seoTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search engine title..."
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                  {seoTitle.length > 0 && (
                    <p className="text-[10px] mt-1 text-text-tertiary">
                      {seoTitle.length < 20
                        ? "Too short — aim for 30-60 characters"
                        : seoTitle.length < 30
                        ? "Getting there — aim for 30-60 characters"
                        : seoTitle.length <= 60
                        ? "Ideal length for search engines"
                        : seoTitle.length <= 70
                        ? "Slightly long — may be truncated"
                        : "Too long — will be cut off in search results"}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-navy mb-1">
                    <span>Meta Description</span>
                    <span className={`text-[10px] font-mono font-normal ${
                      seoDesc.length >= 120 && seoDesc.length <= 160
                        ? "text-success"
                        : (seoDesc.length >= 100 && seoDesc.length <= 119) || (seoDesc.length >= 161 && seoDesc.length <= 180)
                        ? "text-amber-600"
                        : "text-red-500"
                    }`}>
                      {seoDesc.length}/160
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Short summary for Google and social previews..."
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none resize-none"
                  />
                  {seoDesc.length > 0 && (
                    <p className="text-[10px] mt-1 text-text-tertiary">
                      {seoDesc.length < 100
                        ? "Too short — aim for 120-160 characters"
                        : seoDesc.length < 120
                        ? "Getting there — aim for 120-160 characters"
                        : seoDesc.length <= 160
                        ? "Ideal length for search results"
                        : seoDesc.length <= 180
                        ? "Slightly long — may be truncated"
                        : "Too long — will be cut off in search results"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">Canonical URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/original-article"
                    value={canonical}
                    onChange={(e) => setCanonical(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-border space-y-3">
                  <p className="font-bold text-navy flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-brand" /> Social Cards (OG / Twitter)
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-1">
                      OpenGraph Title
                    </label>
                    <input
                      type="text"
                      placeholder="Title for Facebook, Twitter, LinkedIn..."
                      value={ogTitle}
                      onChange={(e) => setOgTitle(e.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-navy focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-1">
                      OpenGraph Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Social share summary..."
                      value={ogDesc}
                      onChange={(e) => setOgDesc(e.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-navy focus:border-brand focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* SEO Score Badge */}
                {(() => {
                  let score = 0;
                  if (seoTitle.length >= 30 && seoTitle.length <= 60) score += 25;
                  else if (seoTitle.length >= 20 && seoTitle.length <= 70) score += 15;
                  if (seoDesc.length >= 120 && seoDesc.length <= 160) score += 25;
                  else if (seoDesc.length >= 100 && seoDesc.length <= 180) score += 15;
                  if (featuredImage) score += 25;
                  if (slug && !/[^a-z0-9-]/.test(slug)) score += 25;
                  const scoreColor = score >= 75 ? "text-success bg-success/10 border-success/30" : score >= 50 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-red-500 bg-red-50 border-red-200";
                  const scoreLabel = score >= 75 ? "Good" : score >= 50 ? "Fair" : "Needs work";
                  return (
                    <div className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold ${scoreColor}`}>
                      <span>SEO: {scoreLabel}</span>
                      <span className="font-mono text-[10px] font-normal">({score}/100)</span>
                    </div>
                  );
                })()}

                {/* SEO Health Warnings */}
                <div className="rounded-xl border border-border bg-surface-raised p-3 space-y-2">
                  <p className="font-bold text-navy flex items-center gap-2">
                    {seoWarnings.length === 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-brand" />
                    )}
                    SEO Health Check ({seoWarnings.length === 0 ? "Perfect" : `${seoWarnings.length} tips`})
                  </p>
                  {seoWarnings.length > 0 ? (
                    <ul className="space-y-1">
                      {seoWarnings.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                          <span className="text-brand shrink-0">•</span> {w}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-success">Article meets all basic SEO best practices.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: COVER IMAGE */}
            {activeTab === "cover" && (
              <div className="space-y-3">
                <FeaturedImagePicker
                  imageUrl={featuredImage}
                  onChange={(url: string | null) => setFeaturedImage(url)}
                />
              </div>
            )}

            {/* TAB 4: PUBLISHING STATUS */}
            {activeTab === "publish" && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-navy mb-1.5">Article Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["draft", "published", "scheduled", "trash"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        className={`py-2 px-3 rounded-lg border text-left font-bold capitalize text-xs transition ${
                          status === st
                            ? "bg-navy text-white border-navy shadow-xs"
                            : "bg-surface border-border text-text-secondary hover:bg-surface-raised"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => {
                      setScheduledAt(e.target.value);
                      if (e.target.value) setStatus("scheduled");
                    }}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none"
                  />
                  <p className="text-[10px] text-text-tertiary mt-1">
                    Post will auto-publish at the chosen time.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: REVISIONS HISTORY */}
            {activeTab === "history" && (
              <div className="space-y-3">
                <p className="font-bold text-navy">Version History</p>
                {revisions.length === 0 ? (
                  <p className="text-text-tertiary text-[11px] py-4 text-center">
                    No previous revisions saved yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {revisions.map((rev) => {
                      const revWordCount = countRevisionWords(rev);
                      const wcDiff = words - revWordCount;
                      const isConfirming = confirmingRestoreId === rev.id;
                      return (
                        <div
                          key={rev.id}
                          className="rounded-xl border border-border bg-surface p-2.5 space-y-1 hover:border-brand/40 transition group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-navy text-[11px] truncate">
                                {rev.label || "Auto-saved Revision"}
                              </p>
                              {rev.authorName && (
                                <p className="text-[10px] text-text-tertiary truncate">{rev.authorName}</p>
                              )}
                            </div>
                            <span
                              className="text-[10px] text-text-tertiary whitespace-nowrap shrink-0"
                              title={new Date(rev.createdAt).toLocaleString()}
                            >
                              {formatRelativeTime(rev.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                            {revWordCount > 0 && (
                              <span className="font-mono">{revWordCount} words</span>
                            )}
                            {revWordCount > 0 && wcDiff !== 0 && (
                              <span className={`font-mono ${wcDiff > 0 ? "text-success" : "text-flame"}`}>
                                {wcDiff > 0 ? `+${wcDiff}` : wcDiff}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setComparingRevision({ content: rev.content, label: rev.label, authorName: rev.authorName, createdAt: rev.createdAt, wordCount: rev.wordCount })}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-text-secondary hover:text-navy transition"
                              title="Compare with current"
                            >
                              <GitCompare className="h-3 w-3" /> Compare
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewingRevision({ content: rev.content, label: rev.label, authorName: rev.authorName, createdAt: rev.createdAt })}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-text-secondary hover:text-navy transition"
                              title="Preview this revision"
                            >
                              <Eye className="h-3 w-3" /> Preview
                            </button>
                            {!isConfirming ? (
                              <button
                                type="button"
                                onClick={() => setConfirmingRestoreId(rev.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-brand hover:text-brand-hover transition"
                              >
                                <RotateCcw className="h-3 w-3" /> Restore
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold animate-in fade-in">
                                <span className="text-text-secondary">Restore?</span>
                                <button
                                  type="button"
                                  onClick={() => { onRestoreRevision(rev); setConfirmingRestoreId(null); }}
                                  className="rounded bg-success/10 px-1.5 py-0.5 text-success hover:bg-success/20 transition"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingRestoreId(null)}
                                  className="rounded bg-flame/10 px-1.5 py-0.5 text-flame hover:bg-flame/20 transition"
                                >
                                  No
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {previewingRevision && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewingRevision(null)}>
                    <div className="relative mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-4 py-3">
                        <div>
                          <p className="font-bold text-navy text-sm">{previewingRevision.label || "Revision Preview"}</p>
                          <p className="text-[10px] text-text-tertiary">
                            {previewingRevision.authorName && <>{previewingRevision.authorName} &middot; </>}
                            {new Date(previewingRevision.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewingRevision(null)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface hover:text-navy transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-6">
                        <SharedRender content={previewingRevision.content} />
                      </div>
                    </div>
                  </div>
                )}

                {comparingRevision && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setComparingRevision(null)}>
                    <div className="relative mx-4 max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-4 py-3">
                        <div>
                          <p className="font-bold text-navy text-sm">Comparing: {comparingRevision.label || "Revision"}</p>
                          <p className="text-[10px] text-text-tertiary">
                            {comparingRevision.authorName && <>{comparingRevision.authorName} &middot; </>}
                            {new Date(comparingRevision.createdAt).toLocaleString()}
                            {comparingRevision.wordCount != null && <> &middot; {comparingRevision.wordCount} words</>}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setComparingRevision(null)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface hover:text-navy transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-border">
                        <div className="p-4">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">This Revision</p>
                          <div className="prose prose-sm max-w-none text-xs"><SharedRender content={comparingRevision.content} /></div>
                        </div>
                        <div className="p-4">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Current Version ({words} words)</p>
                          <div className="prose prose-sm max-w-none text-xs"><SharedRender content={editor?.getJSON() || null} /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: DOCUMENT OUTLINE */}
            {activeTab === "outline" && (
              <DocumentOutline editor={editor} />
            )}

            {/* TAB 7: TABLE OF CONTENTS */}
            {activeTab === "toc" && editor && (
              <TableOfContents editor={editor} />
            )}

            {/* TAB 8: CONTENT QUALITY CHECKER */}
            {activeTab === "quality" && (
              <ContentQualityChecker
                editor={editor}
                title={title}
                featuredImage={featuredImage}
                excerpt={excerpt}
                seoDesc={seoDesc}
                category={category}
              />
            )}
      </div>
    </div>
  );
}
