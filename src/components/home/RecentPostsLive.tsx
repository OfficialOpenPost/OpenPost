"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  PenLine,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Tilt3DCard } from "./Tilt3DCard";

interface PostItem {
  id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  readingTime?: number;
  category?: { name: string } | string;
  author?: { name: string };
  coverImage?: string;
}

export function RecentPostsLive() {
  const [recent, setRecent] = useState<PostItem[]>([]);
  const [stats, setStats] = useState<{ posts: number; categories: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/posts?limit=6")
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j.data)) setRecent(j.data.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    Promise.all([
      fetch("/api/v1/posts?limit=1").then((r) => r.json()).catch(() => ({})),
      fetch("/api/v1/categories").then((r) => r.json()).catch(() => ({})),
    ]).then(([p, c]) => {
      const posts = Array.isArray(p.data) ? p.data.length : 0;
      const cats = Array.isArray(c.data) ? c.data.length : 0;
      if (posts || cats) setStats({ posts, categories: cats });
    });
  }, []);

  return (
    <section className="bg-white py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-border">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Live from your CMS
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Latest Published Articles — Real Data
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">
              Queried directly from{" "}
              <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs text-navy font-bold">
                GET /api/v1/posts?limit=6
              </code>
              {stats ? ` · ${stats.posts} Total Articles · ${stats.categories} Categories` : ""}
            </p>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy hover:text-brand transition"
          >
            View Public Blog <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Real Live Posts List / Empty State */}
        {recent.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-border bg-[#FCFCF9] p-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-navy">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-base font-bold text-navy">No published articles yet</h3>
            <p className="mt-1 text-xs text-text-secondary max-w-md mx-auto">
              Create your first article in the block editor — it will instantly stream live here and at <code className="font-mono text-xs font-bold">/blog</code>.
            </p>
            <div className="mt-4 flex justify-center">
              <Link
                href="/dashboard/editor"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-navy shadow-xs hover:bg-brand-hover hover:text-white transition"
              >
                Open Block Editor <PenLine className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((post) => {
              const catName =
                typeof post.category === "object" && post.category !== null
                  ? post.category.name
                  : typeof post.category === "string"
                  ? post.category
                  : "General";

              return (
                <Tilt3DCard
                  key={post.id}
                  depth={8}
                  className="group hover:border-brand/50 hover:shadow-lg transition-all duration-300"
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="p-5 block h-full flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="rounded-full bg-brand/15 px-2.5 py-0.5 font-bold text-navy text-[11px]">
                          {catName}
                        </span>
                        <span className="flex items-center gap-1 text-text-tertiary font-mono text-[11px]">
                          <Clock className="h-3 w-3" />
                          {post.readingTime ?? 5} min read
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-bold text-navy leading-snug group-hover:text-brand line-clamp-2 transition-colors">
                        {post.title}
                      </h3>
                      <p className="mt-1 font-mono text-xs text-text-tertiary">/{post.slug}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-tertiary">
                      <span>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Published"}
                      </span>
                      <span className="flex items-center gap-0.5 font-bold text-navy group-hover:text-brand">
                        Read <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </Tilt3DCard>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
