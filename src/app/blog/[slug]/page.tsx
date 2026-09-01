import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, Calendar, ArrowLeft, Share2, Folder, User, AlertTriangle } from "lucide-react";
import { SharedRender } from "@/components/render/SharedRender";
import { db } from "@/lib/db";
import { EDITOR_STYLES } from "@/components/editor/editor-styles";

const POSTS: Record<
  string,
  {
    title: string;
    content: string;
    category: string;
    date: string;
    readingTime: number;
    author: string;
  }
> = {
  "10-tips-better-seo": {
    title: "10 Tips for Better SEO in 2026",
    content:
      "<p>Search in 2026 is AI-driven. Here are 10 tips that still work: structured content, fast images, and honest SEO warnings.</p><h2>1. Structured JSON</h2><p>Store content as JSON, not raw HTML — it’s safer and more portable.</p><blockquote>OpenPost does this by default.</blockquote><p>More content here...</p>",
    category: "SEO",
    date: "2026-08-28",
    readingTime: 6,
    author: "Priya Sharma",
  },
  "headless-nextjs": {
    title: "Building a Headless Blog with Next.js",
    content:
      "<p>Headless means your CMS and frontend are decoupled. Fetch from <code>/api/v1/posts</code> and render anywhere.</p><pre><code>fetch('/api/v1/posts?limit=10')</code></pre>",
    category: "Development",
    date: "2026-08-10",
    readingTime: 8,
    author: "Dana Kim",
  },
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try DB first
  let post: any = null;
  try {
    // Check redirects
    const redir = await db.redirect
      .findFirst({ where: { oldSlug: slug } as never })
      .catch(() => null);
    if (redir) redirect(`/blog/${(redir as any).newSlug}`);

    post = await db.blog
      .findFirst({
        where: { slug } as never,
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          readingTime: true,
          wordCount: true,
          seo: true,
          featuredImage: { select: { id: true, variants: true, originalFilename: true } },
          category: { select: { name: true } },
          author: { select: { name: true, email: true } },
          authors: { select: { author: { select: { name: true } } } },
        } as never,
      })
      .catch((err) => {
        console.error("Error fetching blog by slug:", err);
        return null;
      });
  } catch (err) {
    console.error("BlogPostPage error:", err);
  }

  // Fallback to mock for dev/no-DB or known slugs — ensures build never breaks without DB
  if (!post) {
    const mock = POSTS[slug];
    if (!mock) return notFound();
    return (
      <div className="min-h-screen bg-[#F4F5F7] py-8 sm:py-12">
        <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />
        <div className="mx-auto w-full max-w-[940px] 2xl:max-w-[1040px] px-4 sm:px-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] px-6 sm:px-14 py-8 sm:py-12">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-text-tertiary hover:text-brand transition mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Back to all articles
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
              <span className="rounded-full bg-brand/10 px-3 py-1 font-bold text-brand">
                {mock.category}
              </span>
              <span className="flex items-center gap-1 text-text-tertiary">
                <Calendar className="h-3.5 w-3.5" /> {mock.date}
              </span>
              <span className="flex items-center gap-1 text-text-tertiary">
                <Clock className="h-3.5 w-3.5" /> {mock.readingTime} min read
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-navy leading-tight mb-4">
              {mock.title}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mb-8">
              Written by <span className="font-semibold text-navy">{mock.author}</span>
            </p>
            <article
              className="tiptap prose prose-lg prose-navy max-w-none"
              dangerouslySetInnerHTML={{ __html: mock.content }}
            />
          </div>
        </div>
      </div>
    );
  }

  const isDraft = post.status === "draft";
  const authorName =
    post.authors?.[0]?.author?.name || post.author?.name || "OpenPost Team";
  const categoryName = post.category?.name || "Articles";
  const dateStr = new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  let content = post.content as any;
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {}
  }
  const isJson = content && typeof content === "object" && content.type === "doc";
  const coverUrl =
    (post.featuredImage?.variants as any)?.publicUrl ||
    (post.featuredImage as any)?.url ||
    (post.seo as any)?.ogImage ||
    (post.seo as any)?.image ||
    null;

  return (
    <div className="min-h-screen bg-[#F4F5F7] py-6 sm:py-10">
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />

      {/* Draft Mode Notice */}
      {isDraft && (
        <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1680px] px-4 sm:px-8 mb-4">
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900 flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Draft Preview Mode — This article is unpublished and only visible to you.
            </span>
            <Link
              href={`/dashboard/editor/${post.id}`}
              className="underline text-amber-900 hover:text-amber-950 font-semibold"
            >
              Edit in Studio
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1440px] 2xl:max-w-[1680px] px-4 sm:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] px-6 sm:px-14 py-8 sm:py-12">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-text-tertiary hover:text-brand transition"
            >
              <ArrowLeft className="h-4 w-4" /> Back to all articles
            </Link>
            <span className="text-xs font-mono text-text-tertiary">
              {post.wordCount || 0} words · ~{post.readingTime || 4} min read
            </span>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 font-bold text-brand">
              <Folder className="h-3 w-3" /> {categoryName}
            </span>
            <span className="flex items-center gap-1 text-text-tertiary">
              <Calendar className="h-3.5 w-3.5" /> {dateStr}
            </span>
            <span className="flex items-center gap-1 text-text-tertiary">
              <Clock className="h-3.5 w-3.5" /> {post.readingTime || 4} min read
            </span>
          </div>

          {/* Article Title */}
          <h1 className="text-3xl sm:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-navy leading-tight mb-4">
            {post.title}
          </h1>

          {/* Author info */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary mb-8">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-raised font-bold text-navy text-[11px]">
              <User className="h-3.5 w-3.5" />
            </span>
            <span>
              By <span className="font-semibold text-navy">{authorName}</span>
            </span>
          </div>

          {/* Big Uncropped Featured Cover Image just below Title */}
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <div className="w-full mb-10 rounded-2xl overflow-hidden border border-border shadow-xs bg-slate-50 flex justify-center">
              <img
                src={coverUrl}
                alt={post.title}
                className="w-full h-auto max-h-[720px] object-contain rounded-2xl block"
              />
            </div>
          )}

          {/* Article Content Render */}
          <article className="tiptap prose prose-lg prose-navy max-w-none">
            {isJson ? (
              <SharedRender content={content} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: String(content || "") }} />
            )}
          </article>

          {/* Author Card Footer */}
          <div className="mt-14 rounded-2xl border border-border bg-[#F9FAFB] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-navy font-extrabold text-lg">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-navy">{authorName}</p>
              <p className="mt-1 text-xs text-text-secondary">
                Published on OpenPost CMS. Sharing engineering insights, content architecture, and web development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
