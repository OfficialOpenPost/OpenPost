import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPosts } from "@/lib/openpost";
import { ContentRenderer } from "@/components/ContentRenderer";
import { Clock, Calendar, ArrowLeft, Tag, Share2, User } from "lucide-react";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const { posts } = await getPosts({ limit: 50 });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
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
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // JSON-LD Structured Data for Google SEO
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
    <article className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy transition mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Articles
      </Link>

      <header className="space-y-4 mb-8">
        {post.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="inline-block rounded-full bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand hover:bg-brand/20 transition"
          >
            {post.category.name}
          </Link>
        )}

        <h1 className="text-3xl sm:text-5xl font-black text-navy tracking-tight leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-2 border-b border-slate-100 pb-6">
          {post.authors && post.authors.length > 0 && (
            <div className="flex items-center gap-2 text-navy">
              <User className="h-4 w-4 text-slate-400" />
              <span>
                {post.authors.map((a, i) => (
                  <Link key={a.id} href={`/author/${a.slug}`} className="hover:text-brand transition">
                    {a.name}{i < (post.authors?.length || 1) - 1 ? ", " : ""}
                  </Link>
                ))}
              </span>
            </div>
          )}

          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>

          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {post.readingTime || 3} min read ({post.wordCount || 0} words)
          </span>
        </div>
      </header>

      {/* Hero Featured Image */}
      {post.coverImage && (
        <div className="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-auto max-h-[550px] object-cover"
          />
        </div>
      )}

      {/* Main Content Body */}
      <div className="my-10">
        <ContentRenderer content={post.content} polls={post.polls} />
      </div>

      {/* Tags Section */}
      {post.tags && post.tags.length > 0 && (
        <div className="my-10 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-slate-400" />
            {post.tags.map((t) => (
              <Link
                key={t.id}
                href={`/tag/${t.slug}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:border-brand hover:text-brand transition shadow-2xs"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Author Profile Card */}
      {post.authors && post.authors.length > 0 && (
        <div className="my-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-2xs">
          {post.authors.map((author) => (
            <div key={author.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/20 text-lg font-black text-navy">
                {author.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-navy">{author.name}</h4>
                  <Link href={`/author/${author.slug}`} className="text-xs font-bold text-brand hover:underline">
                    View profile &rarr;
                  </Link>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {author.bio || "Staff writer and contributor at OpenPost Publication."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
