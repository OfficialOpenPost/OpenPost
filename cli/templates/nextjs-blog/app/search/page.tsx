import Link from "next/link";
import { getPosts } from "@/lib/openpost";
import { PostCard } from "@/components/PostCard";
import { NewsletterCard } from "@/components/NewsletterCard";
import { Search } from "lucide-react";

export const metadata = {
  title: "Search",
  description: "Search articles on this blog.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  let posts: any[] = [];
  if (query) {
    const { posts: allPosts } = await getPosts({ limit: 100 });
    posts = allPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.seo?.description?.toLowerCase().includes(query) ||
        p.category?.name?.toLowerCase().includes(query) ||
        p.tags?.some((t) => t.name.toLowerCase().includes(query))
    );
  }

  return (
    <div className="w-full max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Search Header */}
      <div className="space-y-4 max-w-xl mx-auto text-center">
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">Search</h1>
        <p className="text-sm text-slate-500">Discover articles, tutorials, guides and topics</p>
        <form method="GET" action="/search" className="pt-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search articles, keywords..."
              className="w-full h-12 rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-colors shadow-2xs"
            />
          </div>
        </form>
      </div>

      {/* Results */}
      {!query ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 bg-white max-w-3xl mx-auto p-8">
          <p className="text-sm text-slate-500">Type a query above to search articles across the publication.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 bg-white max-w-3xl mx-auto p-8">
          <p className="text-base font-bold text-slate-900">No results found for &ldquo;{q}&rdquo;</p>
          <p className="text-xs text-slate-500 mt-1">Try a different search term or browse our categories.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs font-bold text-slate-400">{posts.length} result{posts.length !== 1 ? "s" : ""} found for &ldquo;{q}&rdquo;</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* Royal Blue Newsletter Card */}
      <NewsletterCard />
    </div>
  );
}
