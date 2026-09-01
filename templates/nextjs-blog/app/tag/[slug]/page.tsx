import Link from "next/link";
import { getPosts, getTags } from "@/lib/openpost";
import { ArrowLeft, Clock, Tag } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Tagged: #${slug}`,
    description: `Articles tagged with #${slug}`,
  };
}

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tags = await getTags();
  const tag = tags.find((t) => t.slug === slug);
  const { posts } = await getPosts({ tag: slug, limit: 30 });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All Articles
      </Link>

      <div className="border-b border-slate-200 pb-8 space-y-3">
        <div className="flex items-center gap-2 text-brand">
          <Tag className="h-4 w-4 text-brand" />
          <span className="text-xs font-black uppercase tracking-wider text-navy">Tag Archive</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
          #{tag?.name || slug}
        </h1>
      </div>

      {posts.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <p className="text-base font-bold text-navy">No articles tagged with #{slug}.</p>
          <Link href="/blog" className="text-xs font-bold text-brand hover:underline">
            Browse all articles &rarr;
          </Link>
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
