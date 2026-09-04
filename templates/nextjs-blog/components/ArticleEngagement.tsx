"use client";

import React, { useState, useEffect } from "react";
import { Bookmark, Share2, Eye, Check } from "lucide-react";

interface ArticleEngagementProps {
  slug: string;
  title: string;
  viewsCount?: number | string;
}

export function ArticleEngagement({ slug, title, viewsCount = "2.4k" }: ArticleEngagementProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`op_bookmark_${slug}`);
      if (saved) setIsBookmarked(true);
    }
  }, [slug]);

  const toggleBookmark = () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    if (typeof window !== "undefined") {
      if (next) localStorage.setItem(`op_bookmark_${slug}`, "1");
      else localStorage.removeItem(`op_bookmark_${slug}`);
    }
  };

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            url: window.location.href,
          });
          return;
        } catch {}
      }
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  return (
    <div className="flex flex-row items-center gap-2 select-none">
      {/* Bookmark Button */}
      <button
        type="button"
        onClick={toggleBookmark}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition duration-150 backdrop-blur-md shadow-2xs border ${
          isBookmarked
            ? "bg-white text-blue-700 border-white shadow-sm"
            : "bg-white/15 text-white border-white/20 hover:bg-white/25 hover:border-white/30"
        }`}
        title={isBookmarked ? "Saved" : "Save article"}
      >
        <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-blue-700" : ""}`} />
        <span className="text-xs font-semibold">{isBookmarked ? "Saved" : "Save"}</span>
      </button>

      {/* Share Button */}
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition duration-150 backdrop-blur-md shadow-2xs relative"
        title="Share Article"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Share2 className="h-3.5 w-3.5" />}
        <span className="text-xs font-semibold">{copied ? "Copied!" : "Share"}</span>
      </button>

      {/* Views Count Pill */}
      <div className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-blue-100">
        <Eye className="h-3 w-3 text-blue-200" />
        <span className="font-mono font-bold text-[11px]">{viewsCount}</span>
        <span className="text-[10px] text-blue-200">views</span>
      </div>
    </div>
  );
}
