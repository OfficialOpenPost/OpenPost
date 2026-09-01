import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, Calendar, ArrowLeft, Share2 } from "lucide-react";
import { SharedRender } from "@/components/render/SharedRender";
import { db } from "@/lib/db";

const POSTS: Record<string, { title: string; content: string; category: string; date: string; readingTime: number; author: string }> = {
  "10-tips-better-seo": {
    title: "10 Tips for Better SEO in 2026",
    content: "<p>Search in 2026 is AI-driven. Here are 10 tips that still work: structured content, fast images, and honest SEO warnings.</p><h2>1. Structured JSON</h2><p>Store content as JSON, not raw HTML — it’s safer and more portable.</p><blockquote>OpenPost does this by default.</blockquote><p>More content here...</p>",
    category: "SEO",
    date: "2026-08-28",
    readingTime: 6,
    author: "Priya Sharma",
  },
  "headless-nextjs": {
    title: "Building a Headless Blog with Next.js",
    content: "<p>Headless means your CMS and frontend are decoupled. Fetch from <code>/api/v1/posts</code> and render anywhere.</p><pre><code>fetch('/api/v1/posts?limit=10')</code></pre>",
    category: "Development",
    date: "2026-08-10",
    readingTime: 8,
    author: "Dana Kim",
  },
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Try DB first (published only)
  let post: any = null;
  try {
    // Check redirects
    const redir = await db.redirect.findFirst({ where: { oldSlug: slug } as never }).catch(() => null);
    if (redir) redirect(`/blog/${(redir as any).newSlug}`);
    post = await db.blog.findFirst({ where: { slug, status: "published" } as never, select: { title: true, slug: true, content: true, publishedAt: true, readingTime: true, seo: true, category: { select: { name: true } }, authors: { select: { author: { select: { name: true } } } } } as never }).catch(() => null);
  } catch {}

  // Fallback to mock for dev/no-DB or known slugs — ensures build never breaks without DB
  if (!post) {
    const mock = POSTS[slug];
    if (!mock) return notFound();
    return (
      <div className="overflow-hidden">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-text-tertiary hover:text-brand"><ArrowLeft className="h-4 w-4" /> Back to blog</Link>
          <div className="mt-8 flex items-center gap-3 text-xs">
            <span className="rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand">{mock.category}</span>
            <span className="flex items-center gap-1 text-text-tertiary"><Calendar className="h-3 w-3" /> {mock.date}</span>
            <span className="flex items-center gap-1 text-text-tertiary"><Clock className="h-3 w-3" /> {mock.readingTime} min</span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-navy">{mock.title}</h1>
          <p className="mt-3 text-sm text-text-secondary">By {mock.author} · <span className="inline-flex items-center gap-1"><Share2 className="h-3 w-3" /> Share</span></p>
          <div className="mt-8 h-64 rounded-2xl bg-gradient-to-br from-brand/20 to-orange/20 border border-border" />
          <article className="prose prose-slate mt-8 max-w-none prose-headings:text-navy prose-a:text-brand prose-blockquote:border-brand" dangerouslySetInnerHTML={{ __html: mock.content }} />
        </div>
      </div>
    );
  }

  const author = post.authors?.[0]?.author?.name ?? "OpenPost";
  const category = post.category?.name ?? "General";
  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "";
  const content = post.content as any;
  const isJson = content && typeof content === "object" && content.type === "doc";

  return (
    <div className="overflow-hidden">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-text-tertiary hover:text-brand"><ArrowLeft className="h-4 w-4" /> Back to blog</Link>
        <div className="mt-8 flex items-center gap-3 text-xs">
          <span className="rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand">{category}</span>
          {date && <span className="flex items-center gap-1 text-text-tertiary"><Calendar className="h-3 w-3" /> {date}</span>}
          <span className="flex items-center gap-1 text-text-tertiary"><Clock className="h-3 w-3" /> {post.readingTime ?? 5} min</span>
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-navy">{post.title}</h1>
        <p className="mt-3 text-sm text-text-secondary">By {author} · <span className="inline-flex items-center gap-1"><Share2 className="h-3 w-3" /> Share</span></p>
        <article className="mt-8">
          {isJson ? <SharedRender content={content} /> : <div className="prose prose-slate max-w-none prose-headings:text-navy prose-a:text-brand" dangerouslySetInnerHTML={{ __html: String(content) }} />}
        </article>
        <div className="mt-12 rounded-2xl border border-border bg-surface-raised p-6">
          <p className="text-sm font-bold text-navy">About the author</p>
          <p className="mt-2 text-sm text-text-secondary">{author} writes about content, SEO, and headless CMS.</p>
        </div>
      </div>
    </div>
  );
}
