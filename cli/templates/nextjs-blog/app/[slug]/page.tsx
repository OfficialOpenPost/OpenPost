import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPosts } from "@/lib/openpost";
import { SharedRender } from "@/components/SharedRender";
import { EDITOR_STYLES } from "@/components/editor-styles";
import { ArticleEngagement } from "@/components/ArticleEngagement";
import { PostCard } from "@/components/PostCard";
import { Clock, Calendar, Tag, User, Sparkles, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    if (!post) return { title: "Article Not Found" };

    return {
      title: post.seo?.title || post.title,
      description: post.seo?.description || `Read ${post.title} on OpenPost blog.`,
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let post = null;
  let recentPosts: any[] = [];

  try {
    const [fetchedPost, postsData] = await Promise.all([
      getPostBySlug(slug),
      getPosts({ limit: 4 }),
    ]);
    post = fetchedPost;
    recentPosts = postsData?.posts || [];
  } catch (err) {
    console.error("Error loading blog post:", err);
  }

  if (!post) {
    return notFound();
  }

  const relatedPosts = (recentPosts || []).filter((p) => p.slug !== slug).slice(0, 3);
  const author = post.authors?.[0];
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const coverUrl = post.coverImage || (post.seo as any)?.ogImage || (post.seo as any)?.image || null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo?.description,
    image: coverUrl,
    datePublished: post.publishedAt,
    author: post.authors?.map((a) => ({
      "@type": "Person",
      name: a.name,
      url: `/author/${a.slug}`,
    })),
  };

  return (
    <div className="w-full max-w-[1560px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-12">
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 1. Hero Cover Image Backdrop ── */}
      <div className="relative w-full">
        {coverUrl ? (
          <div className="w-full h-[320px] sm:h-[400px] md:h-[460px] lg:h-[500px] overflow-hidden rounded-[32px] bg-slate-900 border border-slate-200/80 shadow-md relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={post.title}
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-[260px] sm:h-[320px] rounded-[32px] bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 shadow-md" />
        )}

        {/* ── 2. The Royal Blue Card (Hovering 50% across the boundary) ── */}
        <div className="-translate-y-1/2 relative z-20 w-[94%] sm:w-[90%] lg:w-[84%] max-w-4xl mx-auto rounded-[32px] bg-gradient-to-r from-[#1E5BF8] via-[#2563EB] to-[#3B82F6] p-5 sm:p-8 lg:p-10 text-white shadow-[0_25px_60px_-15px_rgba(30,91,248,0.45)] border-2 border-white/25 rounded-[24px] sm:rounded-[32px] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[calc(50%+6px)] hover:shadow-[0_35px_75px_-15px_rgba(30,91,248,0.6)] space-y-4">
          {/* Decorative Right Arch Elements */}
          <div className="absolute right-0 top-0 bottom-0 w-48 pointer-events-none hidden sm:block overflow-hidden">
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-48 h-60 rounded-t-full border-[14px] border-white/10" />
            <div className="absolute right-14 top-1/2 -translate-y-1/2 w-36 h-48 rounded-t-full bg-white/5" />
          </div>

          <div className="relative z-10 space-y-3.5">
            {/* Category Badge & Metadata Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100 font-medium">
              <div className="flex items-center gap-2.5 flex-wrap">
                {post.category ? (
                  <Link
                    href={`/category/${post.category.slug}`}
                    className="inline-flex items-center rounded-full bg-white text-blue-700 hover:bg-blue-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider shadow-sm transition"
                  >
                    {post.category.name}
                  </Link>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-white uppercase tracking-wider border border-white/20 shadow-2xs">
                    Article
                  </span>
                )}
                {publishDate && (
                  <span className="flex items-center gap-1 text-xs text-blue-100 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-blue-200" />
                    <span>{publishDate}</span>
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 font-mono text-xs text-blue-200">
                <Clock className="h-3.5 w-3.5" />
                <span>{post.readingTime || 4} min read ({post.wordCount || 0} words)</span>
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug font-display">
              {post.title}
            </h1>

            {/* Subtitle / Excerpt */}
            {post.seo?.description && (
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal max-w-2xl line-clamp-2">
                {post.seo.description}
              </p>
            )}

            {/* Author Byline & Horizontal Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-white/15 text-xs text-white">
              <div className="flex items-center gap-2.5">
                {author && (
                  <>
                    <div className="h-8 w-8 shrink-0 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center text-xs shadow-xs">
                      {author.name.charAt(0)}
                    </div>
                    <div className="leading-tight">
                      <span className="block font-bold text-xs sm:text-sm text-white">{author.name}</span>
                      <span className="text-[10px] text-blue-200">Author & Contributor</span>
                    </div>
                  </>
                )}
              </div>

              {/* Horizontal Engagement Bar */}
              <ArticleEngagement slug={post.slug} title={post.title} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Ultra-Wide Card-Less Editorial Article Body (Maximized Content Visibility) ── */}
      <article className="w-full max-w-[1400px] 2xl:max-w-[1560px] mx-auto -mt-16 sm:-mt-20 md:-mt-24 relative z-10 px-2 sm:px-4 lg:px-6 space-y-12">
        {/* Article Prose Body with expanded canvas */}
        <div className="tiptap prose prose-lg prose-slate max-w-none text-slate-800 leading-relaxed font-normal">
          <SharedRender content={post.content} />
        </div>

        {/* Tags Section */}
        {post.tags && post.tags.length > 0 && (
          <div className="pt-8 border-t border-slate-200 flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 mr-1">Tags:</span>
            {post.tags.map((t) => (
              <Link
                key={t.id}
                href={`/tag/${t.slug}`}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:border-blue-600 hover:text-blue-600 transition shadow-2xs"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        {/* Author Bio Section */}
        {author && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xs">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 text-lg font-black shadow-xs">
              {author.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-slate-900 font-display">{author.name}</h4>
                <Link href={`/author/${author.slug}`} className="text-xs font-bold text-blue-600 hover:underline">
                  View profile &rarr;
                </Link>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {author.bio || "Staff writer and contributor at OpenPost Publication."}
              </p>
            </div>
          </div>
        )}
      </article>

      {/* ── 4. Recommended Articles Section ── */}
      {relatedPosts.length > 0 && (
        <section className="space-y-6 pt-16 max-w-[1400px] 2xl:max-w-[1560px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                Recommended Stories
              </h3>
            </div>
            <Link href="/" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              See all articles <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((r) => (
              <PostCard key={r.id} post={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
