import Link from "next/link";
import { getPosts, getCategories, getTags } from "@/lib/openpost";
import { PostCard } from "@/components/PostCard";
import { ArrowRight, Mail, Clock, Folder, Flame, Sparkles, TrendingUp, Tag, Users, Rss, ArrowUpRight } from "lucide-react";

const SITE_NAME = process.env.SITE_NAME || "My Blog";
const SITE_TAGLINE = process.env.SITE_TAGLINE || "Stories, Ideas & Perspectives";
const SITE_DESCRIPTION = process.env.SITE_DESCRIPTION || "";
const OPENPOST_URL = process.env.OPENPOST_URL || "";

export default async function HomePage() {
  const [{ posts }, categories, tags] = await Promise.all([
    getPosts({ limit: 18 }),
    getCategories(),
    getTags(),
  ]);

  const leadStory = posts[0];
  const trendingStories = posts.slice(1, 4);
  const bentoPicks = posts.slice(4, 7);
  const latestStories = posts.slice(7);

  // Extract unique authors
  const authorMap = new Map();
  posts.forEach((p) => {
    p.authors?.forEach((a) => {
      if (!authorMap.has(a.slug)) authorMap.set(a.slug, a);
    });
  });
  const topAuthors = Array.from(authorMap.values()).slice(0, 4);

  return (
    <div className="w-full max-w-[1600px] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 space-y-16">
      {/* ── 1. Hero Editorial Spotlight (Lead Story + Trending Right Column) ── */}
      {leadStory ? (
        <section className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Lead Story Feature Card (Left 8 cols) */}
            <div className="lg:col-span-8">
              <PostCard post={leadStory} variant="lead" />
            </div>

            {/* Trending Today Ranked Feed (Right 4 cols) */}
            <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-black text-slate-900 font-display text-sm">
                  <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                  Trending Stories
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today</span>
              </div>

              <div className="divide-y divide-slate-100">
                {trendingStories.map((post, idx) => (
                  <PostCard key={post.id} post={post} variant="compact" ranking={idx + 1} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Empty State */
        <section className="text-center rounded-3xl border border-dashed border-slate-200 bg-white p-16 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 text-[#6C63FF]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-display">Welcome to {SITE_NAME}</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your publication is ready! Open the OpenPost Studio to create and publish your first article.
          </p>
          {OPENPOST_URL && (
            <a
              href={OPENPOST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#6C63FF] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#5B52E5] transition"
            >
              Launch OpenPost Studio <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </section>
      )}

      {/* ── 2. Curated Topics & Categories Bar ── */}
      {categories.length > 0 && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Explore Topics</span>
            <Link href="/blog" className="text-xs font-bold text-[#6C63FF] hover:underline flex items-center gap-1">
              All categories <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/blog"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              All Topics
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/70 px-4 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-white hover:text-[#6C63FF] transition"
              >
                <Folder className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#6C63FF] transition" />
                <span>{c.name}</span>
                {c.postCount !== undefined && (
                  <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {c.postCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Editor's Picks Bento 3-Grid ── */}
      {bentoPicks.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#6C63FF]" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                Editor&apos;s Highlights
              </h2>
            </div>
            <Link href="/blog" className="text-xs font-bold text-[#6C63FF] hover:underline flex items-center gap-1">
              View catalog <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bentoPicks.map((post) => (
              <PostCard key={post.id} post={post} variant="bento" />
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Main Feed: Latest Stories (Left 8 cols) + Magazine Sidebar (Right 4 cols) ── */}
      <section className="grid lg:grid-cols-12 gap-10">
        {/* Left 8 Cols: Latest Stories Stream */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
              Latest Stories
            </h2>
            <Link href="/blog" className="text-xs font-bold text-[#6C63FF] hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {latestStories.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-6">
              {latestStories.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-6">
              {posts.slice(0, 6).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Right 4 Cols: Magazine Editorial Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* About Widget */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">About {SITE_NAME}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {SITE_DESCRIPTION || SITE_TAGLINE || "A premier independent digital magazine publishing thought leadership, technical guides, and in-depth essays."}
            </p>
            <div className="pt-2">
              <Link
                href="/feed.xml"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#6C63FF] hover:underline"
              >
                <Rss className="h-3.5 w-3.5" /> Subscribe to RSS feed &rarr;
              </Link>
            </div>
          </div>

          {/* Top Authors */}
          {topAuthors.length > 0 && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#6C63FF]" />
                <h3 className="text-sm font-bold text-slate-900 font-display">Featured Authors</h3>
              </div>
              <div className="space-y-3">
                {topAuthors.map((author: any) => (
                  <Link
                    key={author.slug}
                    href={`/author/${author.slug}`}
                    className="group flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#4F46E5] flex items-center justify-center text-xs font-bold text-white shadow-xs">
                        {author.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-[#6C63FF] transition">
                          {author.name}
                        </p>
                        <p className="text-[11px] text-slate-400">Writer & Contributor</p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#6C63FF] group-hover:translate-x-0.5 transition" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Trending Tags Cloud */}
          {tags && tags.length > 0 && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#6C63FF]" />
                <h3 className="text-sm font-bold text-slate-900 font-display">Popular Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.slice(0, 10).map((t) => (
                  <Link
                    key={t.id}
                    href={`/tag/${t.slug}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 hover:border-slate-300 hover:bg-white hover:text-[#6C63FF] transition"
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Full-Width VIP Editorial Newsletter Banner ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-10 sm:p-14 text-center space-y-6 shadow-xl">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 mx-auto shadow-inner text-[#6C63FF]">
          <Mail className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            Never miss an insightful article
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Subscribe to our weekly dispatch for handpicked analysis, industry insights, and the latest stories.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto pt-2">
          <input
            type="email"
            placeholder="Your email address..."
            className="w-full rounded-full border border-slate-700 bg-slate-800/90 px-4 py-3 text-xs text-white placeholder:text-slate-400 focus:border-[#6C63FF] focus:outline-none"
          />
          <Link
            href="/feed.xml"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#6C63FF] px-6 py-3 text-xs font-bold text-white hover:bg-[#5B52E5] shadow-md transition shrink-0"
          >
            Subscribe
          </Link>
        </div>
      </section>
    </div>
  );
}
