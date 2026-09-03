import Link from "next/link";
import { getPosts, getCategories } from "@/lib/openpost";
import { PostCard } from "@/components/PostCard";
import { Folder, Sparkles, BookOpen } from "lucide-react";

export const metadata = {
  title: "All Articles & Essays",
  description: "Browse all published articles, stories, tutorials, and deep-dives.",
};

export default async function BlogIndexPage() {
  const [{ posts }, categories] = await Promise.all([
    getPosts({ limit: 50 }),
    getCategories(),
  ]);

  return (
    <div className="w-full max-w-[1600px] 2xl:max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 space-y-12">
      {/* Editorial Header Section */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 shadow-xs space-y-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#6C63FF]">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-[#6C63FF]">Complete Archive</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight font-display">
            Stories, Guides & Essays
          </h1>
          <p className="text-base sm:text-lg text-slate-500 max-w-2xl leading-relaxed">
            Explore thought leadership, industry analysis, technical tutorials, and curated perspectives.
          </p>
        </div>

        {/* Category Pills Bar */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
            <Link
              href="/blog"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              All Articles ({posts.length})
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-white hover:text-[#6C63FF] transition shadow-2xs"
              >
                <Folder className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#6C63FF] transition" />
                <span>{c.name}</span>
                {c.postCount !== undefined && (
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {c.postCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Articles Grid */}
      {posts.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#6C63FF]">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-lg font-black text-slate-900 font-display">No articles published yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Head over to OpenPost Studio to publish your first story.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
