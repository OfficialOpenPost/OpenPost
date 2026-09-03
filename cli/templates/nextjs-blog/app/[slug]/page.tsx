import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPosts } from "@/lib/openpost";
import { ContentRenderer } from "@/components/ContentRenderer";
import { PostCard } from "@/components/PostCard";
import { CoverImage } from "@/components/CoverImage";
import { Clock, Calendar, ArrowLeft, Tag, ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export async function generateStaticParams() {
  try {
    const { posts } = await getPosts({ limit: 50 });
    return (posts || []).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  try {
    const { slug } = await Promise.resolve(params);
    const post = await getPostBySlug(slug);
    if (!post) return { title: "Article Not Found" };

    return {
      title: post.seo?.title || post.title,
      description: post.seo?.description || `Read ${post.title} on ${process.env.SITE_NAME || "OpenPost"}.`,
      openGraph: {
        title: post.seo?.title || post.title,
        description: post.seo?.description || `Read ${post.title}`,
        images: post.coverImage ? [{ url: post.coverImage }] : [],
        type: "article",
        publishedTime: post.publishedAt,
        authors: post.authors?.map((a) => a.name),
      },
      twitter: {
        card: "summary_large_image",
        title: post.seo?.title || post.title,
        description: post.seo?.description,
        images: post.coverImage ? [post.coverImage] : [],
      },
    };
  } catch {
    return { title: "Article" };
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  let post = null;
  let recentPosts: any[] = [];

  try {
    const [fetchedPost, postsData] = await Promise.all([
      getPostBySlug(slug),
      getPosts({ limit: 6 }),
    ]);
    post = fetchedPost;
    recentPosts = postsData?.posts || [];
  } catch (err) {
    console.error("Error loading blog post:", err);
  }

  if (!post) notFound();

  const relatedPosts = (recentPosts || []).filter((p) => p.slug !== slug).slice(0, 3);
  const author = post.authors?.[0];
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo?.description,
    image: post.coverImage,
    datePublished: post.publishedAt,
    author: post.authors?.map((a) => ({
      "@type": "Person",
      name: a.name,
      url: `/author/${a.slug}`,
    })),
  };

  return (
    <article className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Full-Width Cover Image */}
      {post.coverImage && (
        <CoverImage src={post.coverImage} alt={post.title} />
      )}

      {/* Content Container */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-20 relative z-10">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-slate-300 hover:text-[#6C63FF] transition shadow-md"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to All Stories
          </Link>
        </div>

        {/* Article Header Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 lg:p-10 space-y-6">
          {/* Category Badge */}
          {post.category && (
            <Link
              href={`/category/${post.category.slug}`}
              className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-black text-[#6C63FF] uppercase tracking-wider hover:bg-indigo-100 transition"
            >
              {post.category.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] font-display">
            {post.title}
          </h1>

          {/* Description */}
          {post.seo?.description && (
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              {post.seo.description}
            </p>
          )}

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-slate-100">
            {author && (
              <Link
                href={`/author/${author.slug}`}
                className="flex items-center gap-3 text-slate-900 hover:text-[#6C63FF] transition"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#4F46E5] flex items-center justify-center text-sm font-bold text-white shadow-sm">
                  {author.name.charAt(0)}
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-900">{author.name}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Author</span>
                </div>
              </Link>
            )}

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              {publishDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{publishDate}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{post.readingTime || 4} min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 lg:p-10">
          <div className="prose-editorial">
            <ContentRenderer content={post.content} polls={post.polls} />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-8 mt-8 border-t border-slate-100">
              <Tag className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 mr-1">Filed under:</span>
              {post.tags.map((t) => (
                <Link
                  key={t.id}
                  href={`/tag/${t.slug}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold text-slate-700 hover:border-slate-300 hover:text-[#6C63FF] transition"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Author Bio Box */}
        {author && (
          <div className="mt-8 bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#4F46E5] flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {author.name.charAt(0)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Written by {author.name}</h3>
                    <p className="text-xs text-slate-400">Contributing Columnist</p>
                  </div>
                  <Link
                    href={`/author/${author.slug}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-white hover:text-[#6C63FF] transition"
                  >
                    View Profile &rarr;
                  </Link>
                </div>
                {author.bio && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {author.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pb-16">
          <div className="pt-12 border-t border-slate-200 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#6C63FF]" />
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                  Recommended Stories
                </h3>
              </div>
              <Link href="/blog" className="text-xs font-bold text-[#6C63FF] hover:underline flex items-center gap-1">
                See all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((r) => (
                <PostCard key={r.id} post={r} />
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
