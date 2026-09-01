"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Eye, Clock, Trash2, Plus, TrendingUp, Users, ArrowUpRight, Calendar, PenLine, Image as ImageIcon, Webhook, Activity, Edit3, CheckCircle2 } from "lucide-react";

const stats = [
  { label: "Published", value: "0", change: "No posts yet", icon: Eye, color: "brand" },
  { label: "Drafts", value: "0", change: "Start writing", icon: FileText, color: "nary" },
  { label: "Scheduled", value: "0", change: "Nothing scheduled", icon: Clock, color: "orange" },
  { label: "Trash", value: "0", change: "Empty", icon: Trash2, color: "flame" },
] as const;

const recentPosts: { title: string; slug: string; status: "Published" | "Draft" | "Scheduled"; author: string; category: string; time: string; words: number; readingTime: number }[] = [];

const activity: { user: string; action: string; target: string; time: string; color: string }[] = [];

const statusStyles = {
  Published: "bg-success/10 text-success border-success/20",
  Draft: "bg-brand/10 text-brand border-brand/20",
  Scheduled: "bg-orange/10 text-orange border-orange/20",
} as const;

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#F0F0F1]">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-semibold text-brand">All systems operational</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy">Good morning</h1>
            <p className="mt-2 text-sm text-text-secondary flex items-center gap-2">
              <Calendar className="h-4 w-4 text-text-tertiary" /> {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} · Your content at a glance
            </p>
          </div>
          <Link href="/dashboard/editor" className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-navy shadow-md shadow-brand/20 hover:bg-brand-hover transition">
            <PenLine className="h-4 w-4" /> New Post
          </Link>
        </div>

        {/* Getting started — proper onboarding for new dashboard */}
        <div className="mt-8 rounded-md border border-[#C3C4C7] bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-navy">Getting started</h2>
          <p className="mt-1 text-sm text-text-secondary">Complete these steps to launch your first post — right sidebar has all navigation.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { step: "1", title: "Create your first post", desc: "Write in the editor, add a featured image", href: "/dashboard/editor", done: false },
              { step: "2", title: "Add a category", desc: "Organize content for readers & SEO", href: "/dashboard/categories", done: false },
              { step: "3", title: "Invite an author", desc: "Collaborate with your team", href: "/dashboard/authors", done: false },
            ].map((item) => (
              <Link key={item.step} href={item.href} className="group rounded-xl border border-border bg-[#FCFCF9] p-4 hover:border-brand/20 hover:bg-white transition flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-white text-sm font-bold group-hover:bg-brand group-hover:text-navy transition">{item.step}</span>
                <div>
                  <p className="text-sm font-semibold text-navy">{item.title}</p>
                  <p className="text-xs text-text-tertiary">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats — fixed height WordPress widgets */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-md border border-[#C3C4C7] bg-white p-6 hover:border-brand/20 hover:shadow-md hover:-translate-y-0.5 transition-all h-[148px] flex flex-col"
            >
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-brand/5 blur-2xl group-hover:bg-brand/10 transition" />
              <div className="relative flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color === "brand" ? "bg-brand/10 text-brand" : s.color === "orange" ? "bg-orange/10 text-orange" : s.color === "flame" ? "bg-flame/10 text-flame" : s.color === "nary" ? "bg-navy/10 text-navy" : "bg-success/10 text-success"}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-success/60" />
              </div>
              <p className="relative mt-4 text-3xl font-bold tracking-tight text-navy">{s.value}</p>
              <p className="relative mt-1 text-sm font-semibold text-text-primary">{s.label}</p>
              <p className="relative mt-auto pt-2 text-xs text-text-tertiary border-t border-[#E5E7EB]">{s.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Recently edited — fixed height WordPress widget */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="lg:col-span-2 rounded-md border border-[#C3C4C7] bg-white p-6 h-[420px] flex flex-col shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand" /> Recently Edited
              </h2>
              <Link href="/dashboard/blogs" className="text-xs font-semibold text-brand hover:text-flame inline-flex items-center gap-1">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {recentPosts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised">
                    <FileText className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-navy">No posts yet</p>
                  <p className="mt-1 text-xs text-text-tertiary">Create your first post — it will appear here and you can edit it anytime.</p>
                  <Link href="/dashboard/editor" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-navy hover:bg-brand-hover">
                    <Plus className="h-4 w-4" /> New Post
                  </Link>
                </div>
              ) : (
                recentPosts.map((post) => (
                  <Link key={post.slug} href={`/dashboard/editor/${post.slug}`} className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-surface-raised hover:border-brand/20 transition group">
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-text-tertiary group-hover:bg-brand group-hover:text-white transition">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate group-hover:text-brand transition">{post.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {post.author}
                        </span>
                        <span>·</span>
                        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs font-medium">{post.category}</span>
                        <span>·</span>
                        <span>{post.words} words · {post.readingTime} min</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[post.status]}`}>
                        {post.status === "Published" ? <CheckCircle2 className="h-3 w-3" /> : post.status === "Scheduled" ? <Clock className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                        {post.status}
                      </span>
                      <span className="text-xs text-text-tertiary">{post.time}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick stats + actions */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="rounded-md border border-[#C3C4C7] bg-white p-6 min-h-[320px] shadow-sm"
            >
              <h2 className="text-base font-bold text-navy">Quick Stats</h2>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Total words", value: "0", sub: "No posts yet" },
                  { label: "Avg. reading time", value: "—", sub: "Per post" },
                  { label: "Published this month", value: "0", sub: "No posts" },
                  { label: "Drafts in review", value: "0", sub: "No drafts" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{row.label}</p>
                      <p className="text-xs text-text-tertiary">{row.sub}</p>
                    </div>
                    <p className="text-lg font-bold text-navy">{row.value}</p>
                  </div>
                ))}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-text-tertiary">Monthly goal</span>
                    <span className="font-semibold text-navy">0 / 16 posts</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                    <div className="h-full w-[0%] bg-brand rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="rounded-md border border-[#C3C4C7] bg-navy p-6 text-white overflow-hidden relative h-[180px] shadow-sm"
            >
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-brand/10 blur-2xl" />
              <h3 className="relative text-base font-bold">Quick Actions</h3>
              <div className="relative mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "New Post", href: "/dashboard/editor", icon: PenLine },
                  { label: "Media", href: "/dashboard/media", icon: ImageIcon },
                  { label: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
                  { label: "Settings", href: "/dashboard/settings", icon: Clock },
                ].map((a) => (
                  <Link key={a.label} href={a.href} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-3 text-sm font-semibold hover:bg-white/15 transition">
                    <a.icon className="h-4 w-4 text-brand" /> {a.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Activity feed — fixed height */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-6 rounded-md border border-[#C3C4C7] bg-white p-6 h-[180px] shadow-sm"
        >
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand" /> Activity Feed
          </h2>
          <div className="mt-6">
            {activity.length === 0 ? (
              <p className="text-sm text-text-tertiary">No activity yet — publish your first post to see history here.</p>
            ) : (
              <div className="space-y-0">
                {activity.map((item, i) => (
                  <div key={i} className="flex gap-4 pb-4 last:pb-0 relative">
                    {i !== activity.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />}
                    <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.color} text-white text-xs font-bold`}>{item.user[0]}</div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-sm text-text-primary">
                        <span className="font-semibold text-navy">{item.user}</span> {item.action} <span className="font-medium text-navy">{item.target}</span>
                      </p>
                      <p className="text-xs text-text-tertiary">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
