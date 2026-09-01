import Link from "next/link";
import { getPosts, getCategories } from "@/lib/openpost";
import { Clock, Folder, ChevronRight } from "lucide-react";

export const metadata = {
  title: "All Articles",
  description: "Browse all published articles and publications.",
};

export default async function BlogIndexPage() {
  const [{ posts }, categories] = await Promise.all([
    getPosts({ limit: 30 }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-10">
      <div className="border-b border-slate-200 pb-8 space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">All Articles</h1>
        <p className="text-sm text-slate-600">
          Discover all published insights, deep dives, and tutorials.
        </p>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4">
            <Link
              href="/blog"
              className="rounded-xl bg-navy px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs"
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:border-brand hover:text-brand transition shadow-2xs"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <p className="text-base font-bold text-navy">No articles published yet.</p>
          <p className="text-xs text-slate-500">Publish your first article in OpenPost CMS to see it appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:border-brand/40 hover:shadow-md"
            >
              {post.coverImage && (
                <div className="aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6 space-y-3">
                {post.category && (
                  <span className="text-xs font-bold text-brand">{post.category.name}</span>
                )}
                <h3 className="text-lg font-bold text-navy group-hover:text-brand transition line-clamp-2">
                  {post.title}
                </h3>
                <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readingTime || 3} min
                  </span>
                  <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
