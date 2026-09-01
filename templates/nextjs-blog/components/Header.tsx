import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-navy font-black shadow-xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-lg font-black tracking-tight text-navy">OpenPost Blog</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-bold text-slate-600">
          <Link href="/" className="hover:text-navy transition">
            Home
          </Link>
          <Link href="/blog" className="hover:text-navy transition">
            Articles
          </Link>
          <a
            href="https://github.com/OfficialOpenPost/OpenPost"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy-light transition shadow-xs"
          >
            Powered by OpenPost
          </a>
        </nav>
      </div>
    </header>
  );
}
