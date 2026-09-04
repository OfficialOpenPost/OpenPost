"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, Clock, ArrowRight, BookOpen, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  readingTime?: number | null;
  category?: { name: string; slug: string } | null;
  publishedAt: string;
}

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.posts || []);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search stories, articles, topics, keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent font-medium"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-[#6C63FF]" />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {query.trim() === "" ? (
            <div className="py-12 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-[#6C63FF]">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Quick Editorial Search</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Type any keyword to instantly find matching stories and guides across the publication.
              </p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No stories found matching <span className="font-semibold text-slate-700">&ldquo;{query}&rdquo;</span>
            </div>
          ) : (
            results.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                onClick={onClose}
                className="group flex items-center gap-4 rounded-2xl p-3 hover:bg-slate-50 transition duration-150 border border-transparent hover:border-slate-200"
              >
                {post.coverImage ? (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base">
                    {post.title.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {post.category && (
                    <span className="text-[11px] font-bold text-[#6C63FF] uppercase tracking-wider">
                      {post.category.name}
                    </span>
                  )}
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#6C63FF] transition truncate">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime || 3} min read</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#6C63FF] group-hover:translate-x-0.5 transition shrink-0" />
              </Link>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press <kbd className="rounded bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-slate-600 font-bold shadow-2xs">ESC</kbd> to close</span>
          <span>Powered by OpenPost Headless CMS</span>
        </div>
      </div>
    </div>
  );
}
