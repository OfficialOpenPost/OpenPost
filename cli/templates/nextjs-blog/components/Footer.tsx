import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsletterCard } from "./NewsletterCard";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || "OpenPost";
const OPENPOST_URL = process.env.NEXT_PUBLIC_OPENPOST_URL || process.env.OPENPOST_URL || "";

export function Footer() {
  return (
    <footer className="w-full bg-[#0B0F19] text-slate-400 border-t border-slate-900 mt-28 sm:mt-36 relative">
      {/* ── Hovering Royal Blue Newsletter Card (Half on Light Section, Half on Dark Footer) ── */}
      <div className="mx-auto w-full max-w-[1520px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-28 md:-mt-32 mb-10 sm:mb-14 relative z-30">
        <NewsletterCard />
      </div>

      <div className="mx-auto w-full max-w-[1520px] 2xl:max-w-[1680px] px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start justify-between">
          {/* Brand & Identity Column */}
          <div className="md:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm">
                OP
              </div>
              <span className="text-lg font-black text-white tracking-tight font-display">
                {SITE_NAME}
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Publishing insights, technical guides, and curated architectural perspectives. Built with Next.js and OpenPost Headless CMS.
            </p>
          </div>

          {/* Directory Links (4 Columns matching Zentra) */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-xs">
            {/* Col 1 */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-200">Features</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/" className="hover:text-white transition">All Articles</Link></li>
                <li><Link href="/feed.xml" className="hover:text-white transition">RSS Feed</Link></li>
                <li><Link href="/search" className="hover:text-white transition">Search Engine</Link></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-200">Solutions</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/category/editorial" className="hover:text-white transition">Editorial</Link></li>
                <li><Link href="/category/engineering" className="hover:text-white transition">Engineering</Link></li>
                <li><Link href="/category/product" className="hover:text-white transition">Product Updates</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-200">Resources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/" className="hover:text-white transition">Publications</Link></li>
                <li><Link href="/feed.xml" className="hover:text-white transition">Newsletter</Link></li>
                {OPENPOST_URL && (
                  <li>
                    <a href={OPENPOST_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition inline-flex items-center gap-1">
                      CMS Studio <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-200">About</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/" className="hover:text-white transition">Company</Link></li>
                <li><Link href="/" className="hover:text-white transition">Careers</Link></li>
                <li><Link href="/" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-16 pt-8 border-t border-slate-900 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <p className="text-slate-400">Powered by OpenPost Headless CMS</p>
        </div>
      </div>
    </footer>
  );
}
