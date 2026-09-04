import Link from "next/link";
import { getPosts, getCategories } from "@/lib/openpost";
import { PostCard } from "@/components/PostCard";
import { ArrowRight, Search, Sparkles } from "lucide-react";

export const revalidate = 60;

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME || "OpenPost";
const SITE_TAGLINE = process.env.NEXT_PUBLIC_SITE_TAGLINE || process.env.SITE_TAGLINE || "Insights and trends shaping the future of finance and technology";
const OPENPOST_URL = process.env.NEXT_PUBLIC_OPENPOST_URL || process.env.OPENPOST_URL || "";

export default async function HomePage() {
  let posts: any[] = [];
  let categories: any[] = [];

  try {
    const [postsData, catsData] = await Promise.all([
      getPosts({ limit: 18 }),
      getCategories(),
    ]);
    posts = postsData?.posts || [];
    categories = catsData || [];
  } catch (err) {
    console.error("Error loading home page data:", err);
  }

  const leadStory = posts[0];
  const newestArticles = posts.slice(1);

  return (
    <div className="w-full max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 sm:pt-8 sm:pb-16 space-y-12 sm:space-y-16">
      {/* ── 1. Hero Title Banner (Matching Zentra Headline) ── */}
      <section className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-slate-700 shadow-2xs">
          Blog
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] font-display">
          Insights and trends shaping the future of finance
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
          Stay informed with the most recent updates on Slash and the dynamic world of business finance, where trends and insights are constantly evolving.
        </p>
      </section>

      {/* ── 2. Lead Featured Split Card ── */}
      {leadStory ? (
        <section>
          <PostCard post={leadStory} variant="lead" />
        </section>
      ) : (
        <section className="text-center rounded-3xl border border-dashed border-slate-200 bg-white p-16 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
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
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              Launch OpenPost Studio <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </section>
      )}

      {/* ── 3. "Check out our newest articles" Section ── */}
      {newestArticles.length > 0 && (
        <section className="space-y-8 pt-8 border-t border-slate-100">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-slate-700 shadow-2xs">
              Articles
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Check out our newest articles
            </h2>
          </div>

          {/* Category Filter Pills & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/"
                className="rounded-full bg-blue-600 text-white font-bold text-xs px-4 py-2 shadow-xs"
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="rounded-full border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-slate-300 font-semibold text-xs px-4 py-2 transition shadow-2xs"
                >
                  {c.name}
                </Link>
              ))}
            </div>

            <Link
              href="/search"
              className="w-full sm:w-64 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-400 hover:border-slate-300 transition shadow-2xs"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span>Search articles, keywords...</span>
            </Link>
          </div>

          {/* 3-Column Articles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newestArticles.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
