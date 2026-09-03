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
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { ImageSettingsPanel } from "../image/ImageSettingsPanel";
import { DocumentOutline } from "../outline/DocumentOutline";
import { FeaturedImagePicker } from "../FeaturedImagePicker";

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
  revisions: Array<{ id: string; label: string | null; createdAt: string; createdBy: string; content?: any }>;
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
}: EditorSidePanelProps) {
  const [activeTab, setActiveTab] = useState<"post" | "seo" | "cover" | "publish" | "history" | "outline">("post");

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
      <div className="grid grid-cols-6 p-1 border-b border-border bg-[#F9FAFB] gap-0.5 text-[11px] font-bold text-center">
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
                  <label className="block font-bold text-navy mb-1">Category</label>
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
                  <div className="mt-2 flex gap-1.5">
                    <input
                      id="new-category-inline"
                      placeholder="New category + Enter"
                      className="flex-1 rounded-lg border border-dashed border-border bg-[#FCFCF9] px-2.5 py-1.5 text-xs focus:border-brand focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !catOptions.some((c) => c.name.toLowerCase() === val.toLowerCase())) {
                            // Optimistically add to local options and select it
                            const newCat = { id: `temp-${Date.now()}`, name: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-") };
                            // @ts-ignore - allow temp id
                            setCategory(val);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                    <span className="text-[10px] text-text-tertiary self-center hidden sm:inline">Press Enter to use new</span>
                  </div>
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
                    <span className="text-[10px] font-mono text-text-tertiary font-normal">
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
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-navy mb-1">
                    <span>Meta Description</span>
                    <span className="text-[10px] font-mono text-text-tertiary font-normal">
                      {seoDesc.length}/155
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Short summary for Google and social previews..."
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:border-brand focus:outline-none resize-none"
                  />
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
                  <div className="space-y-2">
                    {revisions.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-xl border border-border bg-surface p-3 space-y-1.5 hover:border-brand/40 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy">
                            {rev.label || "Auto-saved Revision"}
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {new Date(rev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                        <button
                          type="button"
                          onClick={() => onRestoreRevision(rev)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:text-brand-hover pt-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Restore this version
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: DOCUMENT OUTLINE */}
            {activeTab === "outline" && (
              <DocumentOutline editor={editor} />
            )}
      </div>
    </div>
  );
}
