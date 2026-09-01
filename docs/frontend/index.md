# Headless Frontend Integration (Next.js)

Connect any Next.js 15 or 16 App Router frontend to OpenPost and render articles with instant loading, ISR caching, and full SEO structured data.

---

## 1. Client SDK Setup

Create a helper file `lib/openpost.ts` in your frontend project:

```typescript
// lib/openpost.ts
const OPENPOST_URL = process.env.OPENPOST_URL || "https://cms.yourdomain.com";
const OPENPOST_TOKEN = process.env.OPENPOST_TOKEN;

export async function fetchOpenPost(endpoint: string, options: RequestInit = {}) {
  const url = `${OPENPOST_URL}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(OPENPOST_TOKEN ? { "X-OpenPost-Token": OPENPOST_TOKEN } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    next: { revalidate: 60, ...(options as any)?.next },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`OpenPost API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
```

---

## 2. Rendering Blog Posts List (`app/blog/page.tsx`)

```tsx
// app/blog/page.tsx
import Link from "next/link";
import { fetchOpenPost } from "@/lib/openpost";

export default async function BlogIndexPage() {
  const { data: posts } = await fetchOpenPost("/posts?limit=12");

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-extrabold text-slate-900 mb-8">Latest Articles</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post: any) => (
          <Link 
            key={post.id} 
            href={`/blog/${post.slug}`} 
            className="border rounded-2xl p-6 hover:border-amber-500 hover:shadow-lg transition-all"
          >
            {post.featuredImage && (
              <img 
                src={post.featuredImage.url} 
                alt={post.title} 
                className="w-full h-48 object-cover rounded-xl mb-4" 
              />
            )}
            <div className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-2">
              {post.category?.name || "Uncategorized"}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{post.title}</h2>
            <p className="text-sm text-slate-500">
              {post.readingTime} min read · {new Date(post.publishedAt).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## 3. Rendering a Single Article (`app/blog/[slug]/page.tsx`)

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import { fetchOpenPost } from "@/lib/openpost";
import { ContentRenderer } from "@/components/ContentRenderer";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchOpenPost(`/posts/${slug}`);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription,
    openGraph: {
      title: post.title,
      description: post.seo?.metaDescription,
      images: post.featuredImage?.url ? [post.featuredImage.url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchOpenPost(`/posts/${slug}`);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{post.readingTime} min read</span>
          <span>•</span>
          <span>Published on {new Date(post.publishedAt).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Render 16 custom JSON AST blocks */}
      <ContentRenderer content={post.content} />
    </article>
  );
}
```

---

## 4. `ContentRenderer` Component

The `ContentRenderer` component parses the ProseMirror JSON tree and maps each block type to a polished React component (Callout, CodeBlock, Gallery, FAQ Accordion, Button CTA, PollWidget, YouTube).

See `templates/nextjs-blog/components/ContentRenderer.tsx` for the full reference implementation.
