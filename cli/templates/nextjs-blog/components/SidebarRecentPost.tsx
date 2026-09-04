"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bookmark, Share2, Check } from "lucide-react";

interface SidebarRecentPostProps {
  post: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string | null;
    publishedAt: string;
    category?: { name: string; slug: string } | null;
    seo?: { description?: string | null } | null;
    readingTime?: number | null;
    wordCount?: number | null;
  };
  viewsCount?: string;
}

export function SidebarRecentPost({ post, viewsCount }: SidebarRecentPostProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recent";

  const randomViews = viewsCount || `${Math.floor(10 + (post.title.length * 3.7)) * 100},${Math.floor(100 + (post.title.length * 7))}`;

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isBookmarked;
    setIsBookmarked(next);
    if (typeof window !== "undefined") {
      if (next) localStorage.setItem(`op_bookmark_${post.slug}`, "1");
      else localStorage.removeItem(`op_bookmark_${post.slug}`);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/${post.slug}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: post.title, url });
          return;
        } catch {}
      }
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  return (
    <Link
      href={`/${post.slug}`}
      className="group block rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md transition-all duration-200 space-y-3"
    >
      {post.coverImage && (
        <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
          {post.category && (
            <span className="font-bold text-slate-600">
              {post.category.name}
            </span>
          )}
          <span>&bull;</span>
          <span>{formattedDate}</span>
        </div>

        <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors line-clamp-2 leading-snug font-display">
          {post.title}
        </h4>

        {post.seo?.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {post.seo.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400">
        <span className="font-mono text-slate-500 font-semibold">{randomViews} Views</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleBookmark}
            className="p-1 text-slate-400 hover:text-brand transition"
            title="Bookmark"
          >
            <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-brand text-brand" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="p-1 text-slate-400 hover:text-navy transition relative"
            title="Share"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </Link>
  );
}
