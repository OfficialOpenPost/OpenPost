"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, BookOpen, Terminal, Database, Cloud, Webhook, Shield, ChevronRight, Hash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DOCS_SEARCH_INDEX } from "@/lib/docsData";

export function DocsSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!query.trim()) return DOCS_SEARCH_INDEX.slice(0, 8);
    const q = query.toLowerCase().trim();
    return DOCS_SEARCH_INDEX.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCategory || matchKeywords;
    }).slice(0, 10);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      router.push(`/docs/${filtered[selectedIndex].slug}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Getting Started":
        return <BookOpen className="h-4 w-4 text-amber-500" />;
      case "Guides & Setup":
        return <Database className="h-4 w-4 text-emerald-500" />;
      case "API Reference":
        return <Terminal className="h-4 w-4 text-[#FE4F01]" />;
      case "Webhooks":
        return <Webhook className="h-4 w-4 text-purple-500" />;
      case "Security":
        return <Shield className="h-4 w-4 text-rose-500" />;
      default:
        return <Hash className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center border-b border-border px-4 py-3 bg-[#FCFCF9]">
          <Search className="h-5 w-5 text-text-tertiary mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation, guides, and API endpoints..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-navy placeholder:text-text-tertiary focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-text-tertiary hover:text-navy rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-text-tertiary opacity-40 mb-2" />
              <p className="text-sm font-semibold text-navy">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-text-tertiary mt-1">Try searching for keywords like &ldquo;supabase&rdquo;, &ldquo;r2&rdquo;, &ldquo;posts api&rdquo;, or &ldquo;webhooks&rdquo;</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                {query.trim() ? "Search Results" : "Quick Navigation"}
              </div>
              {filtered.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <Link
                    key={item.slug}
                    href={`/docs/${item.slug}`}
                    onClick={onClose}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      isSelected ? "bg-surface-raised border border-brand/30" : "hover:bg-surface-raised border border-transparent"
                    }`}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-border shadow-xs">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-navy truncate">{item.title}</span>
                        <span className="rounded bg-brand/10 text-brand px-1.5 py-0.5 text-[10px] font-medium shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 mt-1 transition-transform ${isSelected ? "text-brand translate-x-0.5" : "text-text-tertiary opacity-40"}`} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-[#FCFCF9] px-4 py-2 text-[11px] text-text-tertiary">
          <div className="flex items-center gap-3">
            <span><kbd className="rounded border border-border bg-white px-1 py-0.5 font-mono text-[10px]">↑</kbd> <kbd className="rounded border border-border bg-white px-1 py-0.5 font-mono text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="rounded border border-border bg-white px-1 py-0.5 font-mono text-[10px]">↵</kbd> to select</span>
          </div>
          <span>OpenPost Docs v1.0</span>
        </div>
      </div>
    </div>
  );
}

export function DocsSearchTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group flex w-full items-center justify-between rounded-xl border border-border bg-surface-dim px-3 py-2 text-xs text-text-tertiary hover:border-brand/40 hover:bg-white transition-all shadow-2xs"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-text-tertiary group-hover:text-brand transition-colors" />
          <span>Search documentation...</span>
        </span>
        <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary group-hover:border-brand/30">
          ⌘K
        </kbd>
      </button>
      <DocsSearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
