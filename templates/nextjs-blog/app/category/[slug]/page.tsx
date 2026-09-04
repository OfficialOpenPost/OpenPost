import Link from "next/link";

export const revalidate = 60;
import { getPosts, getCategories } from "@/lib/openpost";
import { PostCard } from "@/components/PostCard";
import { NewsletterCard } from "@/components/NewsletterCard";
import { ArrowLeft, Folder, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Topic: ${slug}`,
    description: `Articles categorized under ${slug}`,
  };
}

export default async function CategoryArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  const { posts } = await getPosts({ category: slug, limit: 50 });

  return (
    <div className="w-full max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Back link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-300 hover:text-blue-600 transition shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Publications
        </Link>
      </div>

      {/* Category Banner Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-8 sm:p-12 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-blue-600">
          <Folder className="h-3.5 w-3.5" /> Category Archive
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
          {category?.name || slug}
        </h1>
        {category?.description && (
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            {category.description}
          </p>
        )}
        <p className="text-xs font-bold text-slate-400">
          Showing {posts.length} published stor{posts.length === 1 ? "y" : "ies"}
        </p>
      </div>

      {/* Grid */}
      {posts.length === 0 ? (
        <div className="py-24 text-center space-y-3 rounded-3xl border border-dashed border-slate-200 bg-white p-8">
          <p className="text-base font-bold text-slate-900">No articles found in this category.</p>
          <Link href="/" className="text-xs font-bold text-blue-600 hover:underline">
            Browse all articles &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Royal Blue Newsletter Card */}
      <NewsletterCard />
    </div>
  );
}
