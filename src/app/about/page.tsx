"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Target, Zap, Shield, Heart, Users, Globe, ArrowRight, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-navy overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(254,166,17,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(254,166,17,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-6 py-20 relative">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold text-brand">Our Story</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-6xl">
              Built for people
              <br />
              <span className="text-brand">who love to write.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              OpenPost started with a simple frustration: existing tools force you to choose between simplicity and power. We built a CMS that gives you both — open, fast, and yours to own.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <FadeIn>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand">Our Mission</p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
                  To be the most reliable, focused writing-and-publishing tool for professional blogging.
                </h2>
                <p className="mt-6 text-base leading-relaxed text-text-secondary">
                  Every feature is judged by one question: does this make writing, organizing, or publishing blog content better? If not, we don&apos;t build it. We stay narrow so you can go deep — on your craft, your content, and your audience.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">MIT Licensed</span>
                  <span className="rounded-full bg-surface-raised border border-border px-4 py-2 text-sm font-medium text-text-secondary">Self-hostable</span>
                  <span className="rounded-full bg-surface-raised border border-border px-4 py-2 text-sm font-medium text-text-secondary">No vendor lock-in</span>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Active Writers", value: "2,400+" },
                  { label: "Posts Published", value: "48k+" },
                  { label: "GitHub Stars", value: "4.2k" },
                  { label: "Uptime", value: "99.99%" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-border bg-surface-raised p-6 text-center">
                    <p className="text-2xl font-bold text-brand">{s.value}</p>
                    <p className="mt-1 text-xs font-medium text-text-tertiary">{s.label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-surface-raised py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">Values</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">What we stand for</h2>
              <p className="mt-4 text-base text-text-secondary">Guiding principles that shape every product decision.</p>
            </div>
          </FadeIn>
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
            {[
              { icon: Zap, title: "Fast and responsive", desc: "Under 50ms input latency. No loading spinners while you type." },
              { icon: Shield, title: "Never lose work", desc: "Autosave everywhere, crash recovery via IndexedDB, revision history." },
              { icon: Target, title: "Focused on blogging", desc: "Not a website builder, not a marketing suite — just writing done right." },
              { icon: Heart, title: "Simple for beginners", desc: "Powerful for pros, approachable for first-time bloggers. Word-like familiarity." },
              { icon: Globe, title: "Open and portable", desc: "MIT license, structured JSON, deploy on Vercel + Supabase + Cloudflare." },
              { icon: Users, title: "Built for teams", desc: "Roles, permissions, and a headless API that scales from solo to agency." },
            ].map((v) => (
              <StaggerItem key={v.title}>
                <div className="group rounded-2xl border border-border bg-surface p-7 hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 transition hover:-translate-y-1 h-full">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition">
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-text-primary">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{v.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Team */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">Team</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">Small team, big ambition</h2>
              <p className="mt-4 text-base text-text-secondary">We&apos;re writers, designers, and engineers who felt the pain ourselves — and decided to fix it.</p>
            </div>
          </FadeIn>
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
            {[
              { name: "Aarav Sharma", role: "Founder & CEO", initials: "AS" },
              { name: "Priya Patel", role: "Head of Product", initials: "PP" },
              { name: "Marcus Lee", role: "Engineering Lead", initials: "ML" },
              { name: "Sofia Nguyen", role: "Design Lead", initials: "SN" },
            ].map((p) => (
              <StaggerItem key={p.name}>
                <div className="rounded-2xl border border-border bg-surface p-6 text-center hover:shadow-lg transition hover:-translate-y-1">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-orange text-white text-lg font-bold">
                    {p.initials}
                  </div>
                  <h3 className="mt-4 text-base font-bold text-text-primary">{p.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-brand">{p.role}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-navy py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/10 blur-[100px]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Want to build with us?</h2>
            <p className="mt-4 text-base text-slate-400">Open source, open roadmap, open to contributions. Star us on GitHub or deploy your own instance in 5 minutes.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-sm font-bold text-navy hover:bg-brand-hover transition">
                Start Writing Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-8 py-3.5 text-sm font-bold text-slate-300 hover:border-slate-500 hover:text-white transition">
                Contact Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
