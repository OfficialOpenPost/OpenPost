"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FadeIn } from "@/components/motion";

const metrics = [
  { label: "Sub-50ms", sub: "API Response", value: 50, suffix: "ms", prefix: "<" },
  { label: "100%", sub: "Open Source", value: 100, suffix: "%", prefix: "" },
  { label: "5-Tier", sub: "RBAC System", value: 5, suffix: "-Tier", prefix: "" },
  { label: "16+", sub: "Block Types", value: 16, suffix: "+", prefix: "" },
  { label: "24/7", sub: "Data Owned", value: 24, suffix: "/7", prefix: "" },
];

function AnimatedCounter({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1200;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count}{suffix}
    </span>
  );
}

export function SocialProofBar() {
  return (
    <section className="relative bg-navy py-12 sm:py-16 overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(254,166,17,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(254,166,17,0.12) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-brand/80">
              Trusted by engineering teams worldwide
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {metrics.map((m, i) => (
            <FadeIn key={m.label} delay={i * 0.08}>
              <div className="text-center group">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  <AnimatedCounter value={m.value} suffix={m.suffix} prefix={m.prefix} />
                </div>
                <div className="mt-1 text-xs font-semibold text-brand/70 uppercase tracking-wide">{m.sub}</div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4}>
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-semibold text-white/40 uppercase tracking-widest">
            <span>MIT Licensed</span>
            <span className="hidden sm:inline">•</span>
            <span>Supabase + PostgreSQL</span>
            <span className="hidden sm:inline">•</span>
            <span>Cloudflare R2</span>
            <span className="hidden sm:inline">•</span>
            <span>Vercel Ready</span>
            <span className="hidden sm:inline">•</span>
            <span>Docker Self-Host</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
