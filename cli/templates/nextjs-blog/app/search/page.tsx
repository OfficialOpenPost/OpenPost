import Link from "next/link";
import { getPosts } from "@/lib/openpost";
import { PostCard } from "@/components/PostCard";
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
    <div className="mx-auto max-w-5xl px-5 py-12 space-y-8">
      {/* Search Header */}
      <div className="space-y-4 max-w-xl">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-display">Search</h1>
        <form method="GET" action="/search">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search articles..."
              className="w-full h-11 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/10 transition-colors"
            />
          </div>
        </form>
      </div>

      {/* Results */}
      {!query ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
          <p className="text-sm text-gray-500">Type a query to search articles.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
          <p className="text-base font-semibold text-gray-900">No results for &ldquo;{q}&rdquo;</p>
          <p className="text-sm text-gray-500 mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">{posts.length} result{posts.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
