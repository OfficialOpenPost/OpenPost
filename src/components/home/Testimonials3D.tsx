"use client";

import { ShieldCheck, GitBranch, Database, CheckCircle2, Lock, Terminal, ArrowUpRight } from "lucide-react";
import { FadeIn } from "@/components/motion";

const proofPillars = [
  {
    icon: GitBranch,
    badge: "MIT Licensed",
    title: "100% Open Source Integrity",
    description:
      "Full source code access with zero proprietary lock-in. Audit our codebase, deploy your own fork, or contribute to core development.",
    action: {
      label: "Inspect Repository",
      href: "https://github.com/OfficialOpenPost/OpenPost.git",
      external: true,
    },
    highlights: ["Permissive MIT License", "Public Git History", "Community Audited"],
  },
  {
    icon: Database,
    badge: "Data Sovereignty",
    title: "Your Data Stays Yours",
    description:
      "Host on your own PostgreSQL and Cloudflare R2 buckets. No vendor data hostage, no unexpected API pricing tiers, and direct SQL access.",
    action: {
      label: "Self-Hosting Docs",
      href: "/docs/deployment",
      external: false,
    },
    highlights: ["Native PostgreSQL Schema", "Direct SQL & Prisma Access", "Zero-Egress R2 Storage"],
  },
  {
    icon: ShieldCheck,
    badge: "Enforced Security",
    title: "Battle-Tested Access Controls",
    description:
      "Built-in 5-tier role hierarchy (Owner, Admin, Editor, Author, Contributor) with Supabase Row Level Security, HMAC webhooks, and SSRF guards.",
    action: {
      label: "Security Specs",
      href: "/security",
      external: false,
    },
    highlights: ["5-Tier RBAC & RLS", "HMAC SHA-256 Webhooks", "SSRF IP Blocklist"],
  },
];

export function Testimonials3D() {
  return (
    <section id="proof" className="bg-white py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Product Proof &amp; Integrity
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Open source by design. Built with zero compromises.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              OpenPost is verified by architecture, not manufactured reviews. Inspect our license, code, and security guarantees.
            </p>
          </div>
        </FadeIn>

        {/* 3 Verified Product Proof Cards with Prismatic Shimmer Elevation */}
        <div className="mt-10 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {proofPillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="card-glass-specular shimmer-surface rounded-2xl p-6 sm:p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-navy">
                      <Icon className="h-5 w-5 text-brand" />
                    </div>
                    <span className="rounded-md bg-white border border-border px-2.5 py-1 text-[11px] font-bold text-navy shadow-2xs font-mono">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base sm:text-lg font-bold text-navy tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {p.description}
                  </p>

                  <div className="mt-5 pt-4 border-t border-border/80 space-y-2">
                    {p.highlights.map((h) => (
                      <div key={h} className="flex items-center gap-2 text-xs text-navy font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/80">
                  <a
                    href={p.action.href}
                    target={p.action.external ? "_blank" : undefined}
                    rel={p.action.external ? "noreferrer" : undefined}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-brand transition"
                  >
                    <span>{p.action.label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

