import Link from "next/link";
import { BookOpen, Rss } from "lucide-react";

const SITE_NAME = process.env.SITE_NAME || "My Blog";
const SOCIAL_TWITTER = process.env.SOCIAL_TWITTER || "";
const SOCIAL_GITHUB = process.env.SOCIAL_GITHUB || "";
const SOCIAL_LINKEDIN = process.env.SOCIAL_LINKEDIN || "";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-navy font-black">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-sm font-black text-navy">{SITE_NAME}</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-navy transition">Home</Link>
            <Link href="/blog" className="hover:text-navy transition">Articles</Link>
            <Link href="/feed.xml" className="hover:text-navy transition inline-flex items-center gap-1">
              <Rss className="h-3.5 w-3.5 text-amber-600" /> RSS Feed
            </Link>
            {SOCIAL_GITHUB && (
              <a href={SOCIAL_GITHUB} target="_blank" rel="noreferrer" className="hover:text-navy transition">
                GitHub
              </a>
            )}
            {SOCIAL_TWITTER && (
              <a href={SOCIAL_TWITTER} target="_blank" rel="noreferrer" className="hover:text-navy transition">
                Twitter
              </a>
            )}
            {SOCIAL_LINKEDIN && (
              <a href={SOCIAL_LINKEDIN} target="_blank" rel="noreferrer" className="hover:text-navy transition">
                LinkedIn
              </a>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} {SITE_NAME}. Powered by OpenPost.
        </div>
      </div>
    </footer>
  );
}
