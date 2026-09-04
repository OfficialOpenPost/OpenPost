import Link from "next/link";

export const revalidate = 60;
import { getPosts, getCategories } from "@/lib/openpost";
import { PostCard } from "@/components/PostCard";
import { Sparkles, Search } from "lucide-react";

export const metadata = {
  title: "All Articles & Insights",
  description: "Browse all published articles, stories, tutorials, and deep-dives.",
};

export default async function BlogIndexPage() {
  const [{ posts }, categories] = await Promise.all([
    getPosts({ limit: 50 }),
    getCategories(),
  ]);

  return (
    <div className="w-full max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 sm:pt-8 sm:pb-16 space-y-10 sm:space-y-12">
      {/* ── 1. Editorial Header Section ── */}
      <section className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-slate-700 shadow-2xs">
          Archive
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] font-display">
          Explore all articles &amp; insights
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
          Thought leadership, architectural case studies, product updates, and technical tutorials.
        </p>
      </section>

      {/* ── 2. Category Filter Bar & Search ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/blog"
            className="rounded-full bg-blue-600 text-white font-bold text-xs px-4 py-2 shadow-xs"
          >
            All Articles ({posts.length})
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
          <span>Search articles...</span>
        </Link>
      </div>

      {/* ── 3. Articles Grid ── */}
      {posts.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-lg font-black text-slate-900 font-display">No articles published yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Head over to OpenPost Studio to publish your first story.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
