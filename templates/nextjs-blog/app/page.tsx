import Link from "next/link";
import { getPosts, getCategories } from "@/lib/openpost";
import { ArrowRight, Clock, BookOpen, Sparkles, Folder } from "lucide-react";

export default async function HomePage() {
  const [{ posts }, categories] = await Promise.all([
    getPosts({ limit: 6 }),
    getCategories(),
  ]);

  const featuredPost = posts[0];
  const recentPosts = posts.slice(1);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-navy p-8 sm:p-14 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-brand">
            <Sparkles className="h-3.5 w-3.5" /> Next-Gen Publication
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ideas, insights, and stories engineered for performance.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Welcome to our blog powered by OpenPost — delivering ultra-fast headless publishing with interactive polls and structured content.
          </p>
          <div className="pt-2 flex items-center gap-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 text-xs font-bold text-navy hover:bg-brand-hover hover:text-white transition shadow-sm"
            >
              Browse Articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredPost && (
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Featured Story</h2>
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:border-brand/50 hover:shadow-lg"
          >
            <div className="grid md:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
              {featuredPost.coverImage && (
                <div className="md:col-span-6 overflow-hidden rounded-2xl bg-slate-100 aspect-video">
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className={featuredPost.coverImage ? "md:col-span-6 space-y-3" : "md:col-span-12 space-y-3"}>
                {featuredPost.category && (
                  <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                    {featuredPost.category.name}
                  </span>
                )}
                <h3 className="text-2xl sm:text-3xl font-black text-navy group-hover:text-brand transition">
                  {featuredPost.title}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-3">
                  {featuredPost.seo?.description || "Read the full story on our blog."}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {featuredPost.readingTime || 3} min read
                  </span>
                  <span>&bull;</span>
                  <span>{new Date(featuredPost.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Categories Bar */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Explore Topics</h2>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-navy hover:border-brand hover:text-brand transition shadow-2xs"
              >
                <Folder className="h-3.5 w-3.5 text-slate-400" />
                <span>{c.name}</span>
                {c.postCount !== undefined && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {c.postCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Posts Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-navy">Latest Articles</h2>
          <Link href="/blog" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">No more articles yet. Stay tuned!</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
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
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    <span>{post.readingTime || 3} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
