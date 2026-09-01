"use client";

import { Check, X } from "lucide-react";
import { FadeIn } from "@/components/motion";

const benchmarkMetrics = [
  { label: "Global Edge Latency (TTFB)", openpost: "18ms", wordpress: "680ms", enterprise: "240ms" },
  { label: "Lighthouse Performance Score", openpost: "100 / 100", wordpress: "44 / 100", enterprise: "76 / 100" },
  { label: "Content Data Storage", openpost: "Structured JSON AST", wordpress: "Unsafe Raw HTML", enterprise: "Proprietary Schema" },
  { label: "Image Transcoding", openpost: "Auto WebP / AVIF in R2", wordpress: "Plugin dependent", enterprise: "Paid add-on" },
  { label: "Setup & Provisioning", openpost: "2 Minutes (CLI)", wordpress: "4+ Hours", enterprise: "2–4 Weeks" },
  { label: "Licensing & Ownership", openpost: "MIT (100% Free)", wordpress: "GPL (Plugin lock-in)", enterprise: "$1,200+/mo Locked" },
];

export function ComparisonBenchmark3D() {
  return (
    <section className="bg-white py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Performance Benchmark
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Why modern teams choose OpenPost.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Zero plugin bloat, zero unexpected subscription tiers, and no XSS injection vulnerabilities.
            </p>
          </div>
        </FadeIn>

        {/* Clean Light Benchmark Matrix Table */}
        <div className="mt-10 mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="border-b border-border bg-[#F9FAFB]">
                  <th className="py-3.5 px-4 text-xs font-bold text-text-secondary">Metric</th>
                  <th className="py-3.5 px-4 text-xs font-extrabold text-navy bg-brand/10 border-x border-brand/20 text-center">
                    ⚡ OpenPost
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-text-tertiary text-center">WordPress</th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-text-tertiary text-center">Enterprise CMS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {benchmarkMetrics.map((m) => (
                  <tr key={m.label} className="hover:bg-[#FCFCF9] transition">
                    <td className="py-3.5 px-4 font-semibold text-navy">
                      {m.label}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-navy bg-brand/5 border-x border-brand/20 text-center">
                      <span className="inline-flex items-center gap-1 text-navy font-extrabold">
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> {m.openpost}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary text-center">
                      {m.wordpress}
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary text-center">
                      {m.enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
