import Link from "next/link";
import { BookOpen } from "lucide-react";

const SITE_NAME = process.env.SITE_NAME || "My Blog";
const SITE_LOGO_URL = process.env.SITE_LOGO_URL || "";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          {SITE_LOGO_URL ? (
            <img src={SITE_LOGO_URL} alt={SITE_NAME} className="h-9 w-auto rounded-lg" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-navy font-black shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
          )}
          <span className="text-lg font-black tracking-tight text-navy">{SITE_NAME}</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-bold text-slate-600">
          <Link href="/" className="hover:text-navy transition">
            Home
          </Link>
          <Link href="/blog" className="hover:text-navy transition">
            Articles
          </Link>
        </nav>
      </div>
    </header>
  );
}
