import Link from "next/link";
import { getPosts, getAuthors } from "@/lib/openpost";
import { ArrowLeft, Clock, User, Globe } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Author: ${slug}`,
    description: `Articles published by ${slug}`,
  };
}

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const authors = await getAuthors();
  const author = authors.find((a) => a.slug === slug);
  const { posts } = await getPosts({ author: slug, limit: 30 });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-10">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All Articles
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-brand/20 text-2xl font-black text-navy shadow-inner">
            {author?.name ? author.name.slice(0, 2).toUpperCase() : <User className="h-10 w-10 text-navy" />}
          </div>
          <div className="space-y-2 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-navy">{author?.name || slug}</h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {author?.bio || "Author and contributor at OpenPost Publication."}
            </p>
            {author?.website && (
              <a
                href={author.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline pt-1"
              >
                <Globe className="h-3.5 w-3.5" /> {author.website}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-black text-navy">Published Articles ({posts.length})</h2>

        {posts.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">No articles published by this author yet.</p>
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
    </div>
  );
}
