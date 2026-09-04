import Link from "next/link";
import { Search, ArrowLeft, BookOpen, Home, Compass } from "lucide-react";

export const metadata = {
  title: "404 — Page Not Found",
  description: "The article or page you are looking for does not exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
      {/* 404 Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-2xs mb-6">
        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
        <span>Error 404 • Article Or Page Missing</span>
      </div>

      {/* Hero 404 Graphic */}
      <div className="relative mb-6">
        <h1 className="text-8xl sm:text-9xl font-black text-slate-200/80 font-display select-none tracking-tighter">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
            Page not found
          </h2>
        </div>
      </div>

      <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
        We couldn&apos;t find the story, category, or page you were looking for. It may have been renamed, removed, or the link might be broken.
      </p>

      {/* Search Input Box */}
      <div className="max-w-md mx-auto mb-10">
        <form method="GET" action="/search" className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            name="q"
            placeholder="Search articles, stories, tags..."
            className="w-full h-12 rounded-full border border-slate-200 bg-white pl-11 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-colors shadow-2xs"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Helpful Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left mb-10">
        <Link
          href="/"
          className="group flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-slate-400 hover:shadow-sm transition-all"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
              Explore All Articles
            </div>
            <div className="text-[11px] text-slate-500">
              Read the latest stories and guides
            </div>
          </div>
        </Link>

        <Link
          href="/search"
          className="group flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-slate-400 hover:shadow-sm transition-all"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
              Discover Topics
            </div>
            <div className="text-[11px] text-slate-500">
              Browse categories and search index
            </div>
          </div>
        </Link>
      </div>

      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-transform active:scale-95 shadow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Return to Homepage</span>
      </Link>
    </div>
  );
}
