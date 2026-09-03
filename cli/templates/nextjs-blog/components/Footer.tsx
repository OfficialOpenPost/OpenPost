import Link from "next/link";
import { BookOpen, Rss, ArrowUpRight, Heart, Sparkles, Send, Mail } from "lucide-react";

const SITE_NAME = process.env.SITE_NAME || "My Blog";
const SITE_TAGLINE = process.env.SITE_TAGLINE || "Stories, Ideas & Perspectives";
const SOCIAL_TWITTER = process.env.SOCIAL_TWITTER || "";
const SOCIAL_GITHUB = process.env.SOCIAL_GITHUB || "";
const SOCIAL_LINKEDIN = process.env.SOCIAL_LINKEDIN || "";
const OPENPOST_URL = process.env.OPENPOST_URL || "";

export function Footer() {
  return (
    <footer className="w-full mt-24 bg-[#0B0F19] text-slate-300 border-t border-slate-800/80">
      {/* ── 1. Top Newsletter Banner Strip (Distinct Dark Indigo Contrast) ── */}
      <div className="border-b border-slate-800/90 bg-[#111827] py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto flex w-full max-w-[1600px] 2xl:max-w-[1780px] flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-0.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              Editorial Dispatch
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
              Get the latest stories delivered to your inbox
            </h3>
            <p className="text-sm text-slate-400 max-w-lg">
              Join thousands of curious readers. Deep-dives, industry analysis, and insightful essays.
            </p>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2 max-w-md">
            <input
              type="email"
              placeholder="Enter your email address..."
              className="flex-1 rounded-full border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] focus:outline-none shadow-inner"
            />
            <Link
              href="/feed.xml"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#4F46E5] px-5 py-2.5 text-xs font-bold text-white hover:from-[#5B52E5] hover:to-[#4338CA] transition shadow-md shadow-indigo-500/20 shrink-0"
            >
              <Send className="h-3.5 w-3.5" /> Subscribe
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Main Multi-Column Footer Grid (Midnight Luxury Theme) ── */}
      <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1780px] px-4 sm:px-6 lg:px-8 xl:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Column 1: Publication Bio */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C63FF] via-[#5B52E5] to-[#4F46E5] text-white shadow-lg shadow-indigo-500/25">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xl font-black text-white font-display tracking-tight">{SITE_NAME}</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {SITE_TAGLINE}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/feed.xml"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3.5 py-1 text-xs font-bold text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition"
              >
                <Rss className="h-3.5 w-3.5 text-amber-400" />
                RSS Feed
              </Link>
              {OPENPOST_URL && (
                <a
                  href={OPENPOST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3.5 py-1 text-xs font-bold text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  OpenPost Studio
                  <ArrowUpRight className="h-3 w-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Editorial Navigation */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Navigation</h4>
            <ul className="space-y-2.5 text-sm font-medium text-slate-400">
              <li>
                <Link href="/" className="hover:text-indigo-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-indigo-400 transition">
                  All Stories & Essays
                </Link>
              </li>
              <li>
                <Link href="/feed.xml" className="hover:text-indigo-400 transition">
                  RSS Subscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Social & Community */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Connect & Follow</h4>
            <p className="text-xs text-slate-400">Follow our editorial updates across networks:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {SOCIAL_TWITTER ? (
                <a
                  href={SOCIAL_TWITTER}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition"
                >
                  Twitter / X <ArrowUpRight className="h-3 w-3 text-slate-400" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3.5 py-1.5 text-xs font-bold text-slate-300">
                  Twitter / X
                </span>
              )}
              {SOCIAL_GITHUB && (
                <a
                  href={SOCIAL_GITHUB}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition"
                >
                  GitHub <ArrowUpRight className="h-3 w-3 text-slate-400" />
                </a>
              )}
              {SOCIAL_LINKEDIN && (
                <a
                  href={SOCIAL_LINKEDIN}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition"
                >
                  LinkedIn <ArrowUpRight className="h-3 w-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Bottom Copyright Strip (Deepest Night Tone) ── */}
      <div className="border-t border-slate-800/80 bg-[#070A11] py-6 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto flex w-full max-w-[1600px] 2xl:max-w-[1780px] flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <span>powered by</span>
            <span className="font-bold text-slate-300">OpenPost CMS Studio</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
