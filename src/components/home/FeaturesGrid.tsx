"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  PenLine,
  Globe,
  Shield,
  Zap,
  Database,
  Code2,
  Search,
  Users,
  Layers,
  BarChart3,
  Lock,
  Cpu,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const features = [
  {
    icon: PenLine,
    title: "Block Editor",
    description: "Notion-smooth block editor with 16+ content types. Slash commands, drag-and-drop, inline media, and real-time autosave.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    detail: "Tiptap-powered with custom schema validation",
  },
  {
    icon: Globe,
    title: "Headless REST API",
    description: "RESTful API with multi-framework SDKs. Sub-50ms edge delivery for Next.js, Astro, Remix, or any frontend.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    detail: "Bearer auth, cursor pagination, ISR caching",
  },
  {
    icon: Shield,
    title: "5-Tier RBAC",
    description: "Owner, Admin, Editor, Author, Contributor. Granular permissions enforced server-side with Supabase RLS.",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    detail: "Row-level security + project isolation",
  },
  {
    icon: Search,
    title: "SEO Engine",
    description: "OpenGraph cards, Schema.org JSON-LD, and live SERP preview. Every post is search-engine optimized out of the box.",
    color: "from-purple-500 to-pink-600",
    bg: "bg-purple-50",
    detail: "Auto-generated structured data markup",
  },
  {
    icon: Database,
    title: "Data Sovereignty",
    description: "PostgreSQL + Cloudflare R2. Your data stays yours. Direct SQL access, Prisma schemas, zero vendor lock-in.",
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-50",
    detail: "Self-host with Docker or deploy to Vercel",
  },
  {
    icon: Zap,
    title: "Intelligent Autosave",
    description: "Debounced autosave with IndexedDB recovery. Never lose a word, even on connection drops or browser crashes.",
    color: "from-yellow-500 to-amber-600",
    bg: "bg-yellow-50",
    detail: "2s debounce + blur + beforeunload beacon",
  },
  {
    icon: Code2,
    title: "Developer CLI",
    description: "Scaffold, deploy, and manage with openpost-cli. Init, doctor, bootstrap, and Docker commands included.",
    color: "from-slate-500 to-gray-700",
    bg: "bg-slate-50",
    detail: "npx openpost-cli init my-blog",
  },
  {
    icon: Users,
    title: "Team Workflow",
    description: "Invite teammates, assign roles, manage approvals. Complete audit trail for every action in your publication.",
    color: "from-rose-500 to-red-600",
    bg: "bg-rose-50",
    detail: "Invite tokens with 7-day expiry",
  },
  {
    icon: Layers,
    title: "Structured Content",
    description: "Documents stored as validated ProseMirror AST nodes. Type-safe, versioned, and portable across platforms.",
    color: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-50",
    detail: "JSON schema validation + content revisions",
  },
];

export function FeaturesGrid() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative bg-white py-20 sm:py-32 border-b border-border overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-brand/[0.02] blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-flame/[0.02] blur-[80px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 mb-5">
              <Zap className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-bold text-navy uppercase tracking-wide">Everything You Need</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-navy tracking-tight leading-tight">
              Built for modern
              <br />
              <span className="gradient-text-brand">publishing teams</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
              A complete CMS with the writing experience of Google Docs, the power of a headless API,
              and the freedom of open source. No compromises.
            </p>
          </div>
        </FadeIn>

        {/* Features Grid */}
        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto" stagger={0.06}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={f.title}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative p-6 rounded-2xl border border-border/60 bg-white hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 cursor-default"
                >
                  {/* Icon */}
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-lg shadow-brand/10 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <h3 className="mt-4 text-lg font-bold text-navy tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">{f.description}</p>

                  {/* Detail tag */}
                  <div className="mt-4 pt-3 border-t border-border/60">
                    <span className="text-[11px] font-mono font-semibold text-text-tertiary group-hover:text-brand transition-colors">
                      {f.detail}
                    </span>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* Bottom highlight */}
        <FadeIn delay={0.3}>
          <div className="mt-14 text-center">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-surface-dim px-6 py-3">
              <div className="flex -space-x-1">
                {[Lock, Shield, Database].map((Icon, i) => (
                  <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-border shadow-xs">
                    <Icon className="h-3.5 w-3.5 text-brand" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-text-secondary">
                Enterprise-grade security with <span className="text-navy font-bold">SSRF guards</span>, <span className="text-navy font-bold">HMAC webhooks</span>, and <span className="text-navy font-bold">rate limiting</span>
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
