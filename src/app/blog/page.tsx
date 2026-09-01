import Link from "next/link";
import { Search, Calendar, Clock, ArrowRight } from "lucide-react";

const POSTS = [
  { slug: "10-tips-better-seo", title: "10 Tips for Better SEO in 2026", excerpt: "Learn the latest SEO strategies that actually move the needle.", category: "SEO", date: "2026-08-28", readingTime: 6, featured: true },
  { slug: "headless-nextjs", title: "Building a Headless Blog with Next.js", excerpt: "How to build a blazing fast headless CMS frontend.", category: "Development", date: "2026-08-10", readingTime: 8 },
  { slug: "getting-started-openpost", title: "Getting Started with OpenPost", excerpt: "From zero to published in 5 minutes.", category: "Guides", date: "2026-08-02", readingTime: 4 },
];

export default function BlogPage() {
  return (
    <div className="overflow-hidden">
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Blog</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-400">Updates, guides, and stories from the OpenPost team. Served via headless API — build any frontend.</p>
          <div className="mt-6 flex gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input placeholder="Search posts..." className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {POSTS.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group rounded-2xl border border-border bg-surface overflow-hidden hover:border-brand/20 hover:shadow-lg transition">
                <div className="h-48 bg-gradient-to-br from-brand/20 to-orange/20" />
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-brand/10 px-2.5 py-1 font-semibold text-brand">{post.category}</span>
                    <span className="text-text-tertiary flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {post.date}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-navy group-hover:text-brand transition line-clamp-2">{post.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary line-clamp-2">{post.excerpt}</p>
                  <p className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand">
                    <Clock className="h-3 w-3" /> {post.readingTime} min read <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
