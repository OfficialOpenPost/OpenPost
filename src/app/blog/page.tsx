import Link from "next/link";
import { Search, Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { db, withDbRetry } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPublishedPosts() {
  try {
    const posts = await withDbRetry(() =>
      db.blog.findMany({
        where: { status: "published" },
        orderBy: { publishedAt: "desc" },
        include: {
          category: true,
          featuredImage: {
            select: { id: true, variants: true },
          },
        },
        take: 24,
      })
    );
    if (posts && posts.length > 0) {
      return posts.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt:
          p.seo && typeof p.seo === "object" && (p.seo as any).description
            ? (p.seo as any).description
            : `Read the full story: ${p.title}`,
        category: p.category?.name || "Articles",
        date: new Date(p.publishedAt || p.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        readingTime: p.readingTime || 4,
        imageUrl:
          (p.featuredImage as any)?.variants?.publicUrl ||
          (p.featuredImage as any)?.url ||
          (p.seo as any)?.ogImage ||
          (p.seo as any)?.image ||
          null,
      }));
    }
  } catch (e: any) {
    console.warn("[blog] Failed to fetch published posts:", e?.message || e);
  }

  return [];
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="overflow-hidden bg-surface-dim min-h-screen">
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-7xl px-6">
          <span className="text-xs font-bold uppercase tracking-widest text-brand">
            OpenPost Publication
          </span>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Blog & Articles
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-300">
            Latest stories, guides, and engineering updates published with OpenPost CMS.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-white p-16 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand mb-4">
                <BookOpen className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-extrabold text-navy">No articles published yet</h2>
              <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
                Articles published in the OpenPost Studio will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col h-[420px] rounded-2xl border border-border bg-white overflow-hidden shadow-xs hover:border-brand/40 hover:shadow-lg transition-all duration-200"
                >
                  {/* Fixed Height Cover Image */}
                  <div className="h-48 w-full shrink-0 bg-slate-100 overflow-hidden relative">
                    {post.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-brand/20 via-orange/15 to-navy/10 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-brand/60" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 rounded-full bg-navy/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                      {post.category}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                        <Calendar className="h-3 w-3" />
                        <span>{post.date}</span>
                      </div>
                      <h3 className="mt-2.5 text-base font-bold text-navy group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-xs text-text-secondary line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-tertiary">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3 text-brand" /> {post.readingTime} min read
                      </span>
                      <span className="flex items-center gap-1 font-bold text-navy group-hover:text-brand group-hover:translate-x-0.5 transition">
                        Read <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
