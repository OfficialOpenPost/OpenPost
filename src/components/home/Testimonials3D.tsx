"use client";

import { Star, CheckCircle2 } from "lucide-react";
import { FadeIn } from "@/components/motion";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Content Director",
    company: "NextFlow Media",
    avatar: "S",
    text: "OpenPost is the first CMS where our writers actually enjoy writing. The block editor is fast, autosave is bulletproof, and the headless API saves our engineers hours every week.",
  },
  {
    name: "James Rodriguez",
    role: "Full-Stack Engineer",
    company: "DevCraft Studio",
    avatar: "J",
    text: "We migrated three client publications from WordPress to OpenPost. Global edge caching dropped our average TTFB from 650ms to 18ms. Structured JSON eliminated broken rendering.",
  },
  {
    name: "Aisha Patel",
    role: "Head of SEO",
    company: "ScaleWave",
    avatar: "A",
    text: "The SEO engine is a game changer. Having live SERP preview, automated WebP variants, and Google FAQ Schema generated on every save boosted our organic reach significantly.",
  },
];

export function Testimonials3D() {
  return (
    <section className="bg-white py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Community &amp; Reviews
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Loved by creators &amp; engineering teams.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Trusted by content creators, publications, and developers worldwide.
            </p>
          </div>
        </FadeIn>

        {/* 3 Review Cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border bg-[#FAF9F5] p-6 flex flex-col justify-between shadow-xs hover:border-brand/40 transition"
            >
              <div>
                <div className="flex items-center gap-1 text-brand">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-brand text-brand" />
                  ))}
                </div>
                <p className="mt-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 font-bold text-navy text-xs">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy flex items-center gap-1">
                    {t.name}
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  </h4>
                  <p className="text-[11px] text-text-tertiary">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
