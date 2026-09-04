import Link from "next/link";

export const revalidate = 60;
import { getPosts, getAuthors } from "@/lib/openpost";
import { PostCard } from "@/components/PostCard";
import { NewsletterCard } from "@/components/NewsletterCard";
import { ArrowLeft, User, Globe, Sparkles } from "lucide-react";
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
  const { posts } = await getPosts({ author: slug, limit: 50 });

  return (
    <div className="w-full max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-300 hover:text-blue-600 transition shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Publications
        </Link>
      </div>

      {/* Author Hero Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-8 sm:p-12 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#1D4ED8] via-[#2563EB] to-[#3B82F6] text-3xl font-black text-white shadow-md">
            {author?.name ? author.name.slice(0, 2).toUpperCase() : <User className="h-12 w-12 text-white" />}
          </div>
          <div className="space-y-2.5 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-blue-600">
              <Sparkles className="h-3 w-3" /> Author Profile
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
              {author?.name || slug}
            </h1>
            <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
              {author?.bio || "Author and contributor at this publication."}
            </p>
            {author?.website && (
              <a
                href={author.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline pt-1"
              >
                <Globe className="h-3.5 w-3.5" /> {author.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Authored Articles */}
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
          Published Articles ({posts.length})
        </h2>

        {posts.length === 0 ? (
          <div className="py-24 text-center space-y-3 rounded-3xl border border-dashed border-slate-200 bg-white p-8">
            <p className="text-base font-bold text-slate-900">No articles published by this author yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Royal Blue Newsletter Card */}
      <NewsletterCard />
    </div>
  );
}
