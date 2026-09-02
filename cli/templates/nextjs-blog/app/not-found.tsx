import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand/20 text-navy font-black">
        <BookOpen className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-black text-navy tracking-tight">Article Not Found</h1>
      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
        The story or resource you are looking for might have been moved, renamed, or deleted.
      </p>
      <div className="pt-2">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-2xl bg-navy px-6 py-3 text-xs font-bold text-white hover:bg-navy-light transition shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Articles
        </Link>
      </div>
    </div>
  );
}
