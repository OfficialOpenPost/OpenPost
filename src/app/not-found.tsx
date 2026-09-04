import Link from "next/link";
import {
  LayoutDashboard,
  PenLine,
  Compass,
  ArrowLeft,
  BookOpen,
  Image as ImageIcon,
  FolderTree,
  Home,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "404 — Page Not Found",
  description: "The requested page or resource could not be found on OpenPost Studio.",
};

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-slate-50/50 dark:bg-[#0b0f19]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-[600px] rounded-full bg-gradient-to-tr from-amber-500/15 to-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 backdrop-blur-md mb-6 shadow-xs animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Error 404 • Resource Missing</span>
        </div>

        {/* 404 Visual Number */}
        <div className="relative mb-4">
          <h1 className="text-8xl sm:text-9xl font-black tracking-tighter text-slate-900/10 dark:text-white/10 select-none font-mono">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Page Not Found
            </h2>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed mb-8">
          The page or route you are looking for has been moved, deleted, or never existed in this project studio.
        </p>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8 max-w-lg mx-auto">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs shadow-2xs hover:border-amber-500/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                CMS Dashboard
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                View all blogs & analytics
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/editor"
            className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs shadow-2xs hover:border-amber-500/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                New Article
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Create & publish content
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/media"
            className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs shadow-2xs hover:border-amber-500/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Media Library
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload & manage assets
              </div>
            </div>
          </Link>

          <Link
            href="/docs"
            className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs shadow-2xs hover:border-amber-500/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Documentation
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                API references & guides
              </div>
            </div>
          </Link>
        </div>

        {/* Primary return button */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 px-6 py-2.5 text-sm font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Studio</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Studio Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
