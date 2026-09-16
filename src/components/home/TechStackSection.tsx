"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  Database,
  Globe,
  Shield,
  Server,
  Cpu,
  Copy,
  Check,
  Terminal,
  ArrowUpRight,
  Box,
  Layers,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const stackItems = [
  {
    icon: "/next.svg",
    fallbackIcon: Globe,
    name: "Next.js 16",
    role: "Frontend & API",
    description: "App Router, Server Components, Edge Runtime. The fastest React framework.",
    link: "https://nextjs.org",
  },
  {
    icon: "/supabase.svg",
    fallbackIcon: Database,
    name: "Supabase",
    role: "Auth & Database",
    description: "Managed PostgreSQL with Row Level Security, Auth, and real-time subscriptions.",
    link: "https://supabase.com",
  },
  {
    icon: "/prisma.svg",
    fallbackIcon: Cpu,
    name: "Prisma ORM",
    role: "Type-Safe Queries",
    description: "Auto-generated TypeScript client, migrations, and schema validation.",
    link: "https://prisma.io",
  },
  {
    icon: "/r2.svg",
    fallbackIcon: Cloud,
    name: "Cloudflare R2",
    role: "Media Storage",
    description: "S3-compatible object storage with zero egress fees. Global edge delivery.",
    link: "https://developers.cloudflare.com/r2",
  },
  {
    icon: "/vercel.svg",
    fallbackIcon: Server,
    name: "Vercel",
    role: "Deployment",
    description: "Zero-config deploy with serverless functions, edge middleware, and analytics.",
    link: "https://vercel.com",
  },
  {
    icon: "/docker.svg",
    fallbackIcon: Box,
    name: "Docker",
    role: "Self-Host",
    description: "Full Docker Compose stack for air-gapped or on-premise deployments.",
    link: "https://docker.com",
  },
];

const deployOptions = [
  {
    title: "Vercel + Supabase",
    description: "Recommended for most teams. Deploy in under 5 minutes with zero configuration.",
    command: "npx openpost-cli init my-blog",
    badge: "Recommended",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    title: "Docker Self-Host",
    description: "Full control over your infrastructure. Run on any VPS or bare metal server.",
    command: "docker compose up -d",
    badge: "Full Control",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    title: "Manual Setup",
    description: "Clone the repo, configure .env, and deploy anywhere that supports Node.js 18+.",
    command: "git clone https://github.com/OfficialOpenPost/OpenPost.git",
    badge: "Flexible",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export function TechStackSection() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeDeploy, setActiveDeploy] = useState(0);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <section className="relative bg-white py-20 sm:py-32 border-b border-border overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-brand/[0.02] blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 mb-5">
              <Layers className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-bold text-navy uppercase tracking-wide">Tech Stack</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-navy tracking-tight leading-tight">
              Powered by the best
              <br />
              <span className="gradient-text-brand">open source tools</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
              Built on battle-tested infrastructure. Every component is chosen for performance,
              developer experience, and long-term reliability.
            </p>
          </div>
        </FadeIn>

        {/* Tech Stack Grid */}
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto" stagger={0.06}>
          {stackItems.map((item) => {
            const FallbackIcon = item.fallbackIcon;
            return (
              <StaggerItem key={item.name}>
                <motion.a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="group flex items-start gap-4 p-5 rounded-2xl border border-border/60 bg-white hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 transition-all"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-dim border border-border group-hover:border-brand/30 transition-colors shrink-0">
                    <FallbackIcon className="h-5 w-5 text-text-secondary group-hover:text-brand transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-navy">{item.name}</h3>
                      <ArrowUpRight className="h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[11px] font-semibold text-brand uppercase tracking-wide">{item.role}</span>
                    <p className="mt-1 text-xs text-text-secondary leading-relaxed">{item.description}</p>
                  </div>
                </motion.a>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* Deploy Options */}
        <FadeIn delay={0.2}>
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
                Deploy your way
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                Three deployment paths. Same powerful CMS. Pick what works for your team.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {deployOptions.map((opt, i) => (
                <motion.button
                  key={opt.title}
                  onClick={() => setActiveDeploy(i)}
                  whileHover={{ y: -2 }}
                  className={`text-left p-5 rounded-2xl border-2 transition-all ${
                    activeDeploy === i
                      ? "border-brand bg-brand/5 shadow-lg shadow-brand/5"
                      : "border-border bg-white hover:border-brand/30"
                  }`}
                >
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${opt.badgeColor}`}>
                    {opt.badge}
                  </span>
                  <h4 className="mt-3 text-base font-bold text-navy">{opt.title}</h4>
                  <p className="mt-1 text-xs text-text-secondary leading-relaxed">{opt.description}</p>

                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-navy px-3 py-2">
                    <Terminal className="h-3 w-3 text-emerald-400 shrink-0" />
                    <code className="text-[11px] font-mono text-slate-300 truncate flex-1">{opt.command}</code>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCommand(opt.command);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          copyCommand(opt.command);
                        }
                      }}
                      className="shrink-0 text-[10px] font-bold text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {copiedCmd === opt.command ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
