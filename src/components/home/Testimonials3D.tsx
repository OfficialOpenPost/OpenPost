"use client";

import {
  ShieldCheck,
  GitBranch,
  Database,
  CheckCircle2,
  X,
  ArrowUpRight,
  Terminal,
  Lock,
  Server,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const proofPillars = [
  {
    icon: GitBranch,
    badge: "MIT Licensed",
    title: "100% Open Source Integrity",
    description:
      "Full source code access with zero proprietary lock-in. Audit the codebase, deploy your own fork, or contribute to core.",
    action: {
      label: "Inspect Repository",
      href: "https://github.com/OfficialOpenPost/OpenPost.git",
      external: true,
    },
    highlights: ["Permissive MIT license", "Public git history", "Community audited"],
  },
  {
    icon: Database,
    badge: "Data Sovereignty",
    title: "Your Data Stays Yours",
    description:
      "Host on your own PostgreSQL and Cloudflare R2 buckets. No data hostage, no surprise API pricing, direct SQL access.",
    action: {
      label: "Self-Hosting Docs",
      href: "/docs",
      external: false,
    },
    highlights: ["Native PostgreSQL schema", "Direct SQL & Prisma", "Zero-egress R2 storage"],
  },
  {
    icon: ShieldCheck,
    badge: "Enforced Security",
    title: "Battle-Tested Access Controls",
    description:
      "A 5-tier role hierarchy (Owner → Contributor) with Supabase Row Level Security, HMAC webhooks, and SSRF guards.",
    action: {
      label: "Security Specs",
      href: "/security",
      external: false,
    },
    highlights: ["5-tier RBAC & RLS", "HMAC SHA-256 webhooks", "SSRF IP blocklist"],
  },
];

const comparison: { feature: string; openpost: string | boolean; typical: string | boolean }[] = [
  { feature: "Source code access", openpost: "Full — MIT", typical: "Locked SaaS" },
  { feature: "Hosting choice", openpost: "Cloud / Docker / bare metal", typical: "Vendor only" },
  { feature: "Database access", openpost: "Direct SQL + Prisma", typical: false },
  { feature: "API pricing tiers", openpost: "Unlimited", typical: "Metered per call" },
  { feature: "Vendor lock-in", openpost: false, typical: true },
  { feature: "Audit & fork freely", openpost: true, typical: false },
];

function Cell({ value, good }: { value: string | boolean; good: boolean }) {
  if (value === true)
    return <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" aria-label="Yes" />;
  if (value === false)
    return <X className="mx-auto h-4 w-4 text-text-tertiary" aria-label="No" />;
  return (
    <span
      className={`text-[11px] font-bold leading-tight ${
        good ? "text-emerald-700" : "text-text-tertiary"
      }`}
    >
      {value}
    </span>
  );
}

export function Testimonials3D() {
  return (
    <section id="proof" className="relative bg-white py-16 sm:py-24 border-b border-border overflow-hidden">
      {/* Ambient blooms */}
      <div className="absolute -top-24 right-0 h-[360px] w-[360px] rounded-full bg-brand/[0.04] blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 items-start">
          {/* LEFT: Narrative + live verification console */}
          <FadeIn direction="left">
            <div className="lg:sticky lg:top-24">
              <span className="text-xs font-bold uppercase tracking-widest text-brand">
                Product Proof &amp; Integrity
              </span>
              <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight leading-tight">
                Open source by design.
                <br />
                <span className="gradient-text-brand">Zero compromises.</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed max-w-lg">
                OpenPost is verified by architecture, not manufactured reviews. Every claim
                below is inspectable — license, code, and security guarantees included.
              </p>

              {/* Comparison table — side-by-side detail */}
              <div className="mt-7 overflow-hidden rounded-2xl border border-border shadow-lg shadow-navy/5">
                <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-surface-dim border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  <span className="px-3 py-2.5">Capability</span>
                  <span className="px-3 py-2.5 text-center text-navy bg-brand/10">OpenPost</span>
                  <span className="px-3 py-2.5 text-center">Typical CMS</span>
                </div>
                {comparison.map((row) => (
                  <div
                    key={row.feature}
                    className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-border last:border-b-0 text-center"
                  >
                    <span className="px-3 py-2.5 text-left text-xs font-semibold text-navy">
                      {row.feature}
                    </span>
                    <span className="px-3 py-2.5 flex items-center justify-center bg-brand/[0.04]">
                      <Cell value={row.openpost} good />
                    </span>
                    <span className="px-3 py-2.5 flex items-center justify-center">
                      <Cell value={row.typical} good={false} />
                    </span>
                  </div>
                ))}
              </div>

              {/* Verification console */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#2D3440] bg-[#12161D] shadow-lg">
                <div className="flex items-center gap-2 border-b border-[#2D3440] px-3.5 py-2">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px] text-slate-400">verify-integrity</span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> 4/4
                    PASSED
                  </span>
                </div>
                <div className="space-y-1.5 px-3.5 py-3 font-mono text-[11px]">
                  {[
                    "license: MIT — verified",
                    "rls: enabled on all project tables",
                    "webhooks: HMAC SHA-256 signed",
                    "egress: SSRF blocklist active",
                  ].map((line) => (
                    <div key={line} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="text-slate-300">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* RIGHT: stacked detailed proof cards */}
          <Stagger className="space-y-4" stagger={0.1}>
            {proofPillars.map((p) => {
              const Icon = p.icon;
              return (
                <StaggerItem key={p.title}>
                  <div className="card-glass-specular shimmer-surface group rounded-2xl p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-navy">
                        <Icon className="h-5 w-5 text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-navy tracking-tight">
                            {p.title}
                          </h3>
                          <span className="rounded-md bg-white border border-border px-2 py-0.5 text-[10px] font-bold text-navy font-mono">
                            {p.badge}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs sm:text-sm text-text-secondary leading-relaxed">
                          {p.description}
                        </p>

                        {/* Highlight chips — side by side */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.highlights.map((h) => (
                            <span
                              key={h}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
                            >
                              <CheckCircle2 className="h-3 w-3" /> {h}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <a
                            href={p.action.href}
                            target={p.action.external ? "_blank" : undefined}
                            rel={p.action.external ? "noreferrer" : undefined}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-brand transition"
                          >
                            <span>{p.action.label}</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                          <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                            {p.badge === "MIT Licensed" ? (
                              <Lock className="h-3 w-3" />
                            ) : p.badge === "Data Sovereignty" ? (
                              <Server className="h-3 w-3" />
                            ) : (
                              <ShieldCheck className="h-3 w-3" />
                            )}
                            Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
