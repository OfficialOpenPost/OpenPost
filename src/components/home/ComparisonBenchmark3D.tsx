"use client";

import { useState } from "react";
import {
  Layers,
  Database,
  Cloud,
  Globe,
  ShieldCheck,
  Zap,
  ArrowRight,
  FileCode,
  Lock,
  Cpu,
  CheckCircle2,
} from "lucide-react";
import { FadeIn } from "@/components/motion";

const pipelineStages = [
  {
    id: "editor",
    title: "1. Block Engine",
    subtitle: "Tiptap Document Canvas",
    icon: Layers,
    badge: "Zero-Lag Studio",
    details:
      "Writers compose with modular content blocks, slash commands, and real-time autosave. Raw inputs are sanitized at entry.",
    specs: ["Modular AST Nodes", "Keyboard Shortcuts", "Offline Autosave"],
  },
  {
    id: "ast",
    title: "2. Structured AST",
    subtitle: "Type-Safe JSON Storage",
    icon: FileCode,
    badge: "XSS-Immune",
    details:
      "Content is stored as structured JSON syntax trees rather than fragile raw HTML strings, completely eliminating cross-site scripting vulnerabilities.",
    specs: ["ProseMirror JSONB", "Zod Schema Validation", "Granular Revisions"],
  },
  {
    id: "storage",
    title: "3. Sovereign Database",
    subtitle: "Postgres + Cloudflare R2",
    icon: Database,
    badge: "100% Data Control",
    details:
      "PostgreSQL manages relations and metadata while Cloudflare R2 stores media with automated WebP conversion and zero egress bandwidth fees.",
    specs: ["Supabase PostgreSQL", "5-Tier RBAC & RLS", "Automated WebP/AVIF"],
  },
  {
    id: "delivery",
    title: "4. Headless Delivery",
    subtitle: "Global Edge Distribution",
    icon: Globe,
    badge: "Sub-50ms API",
    details:
      "Deploy anywhere and consume content via standard REST endpoints with ISR, on-demand revalidation, and webhooks.",
    specs: ["REST Endpoints", "On-Demand Invalidation", "HMAC Signed Webhooks"],
  },
];

export function ComparisonBenchmark3D() {
  const [activeStage, setActiveStage] = useState(pipelineStages[0]);

  return (
    <section id="architecture" className="bg-white py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Publishing Architecture
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              From editorial thought to global delivery.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              A high-performance decoupled architecture designed for speed, security, and complete data ownership.
            </p>
          </div>
        </FadeIn>

        {/* Pipeline Stage Buttons (Responsive 4-Step Flow) */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {pipelineStages.map((stage) => {
            const isActive = activeStage.id === stage.id;
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  isActive
                    ? "border-brand bg-[#FFFBF5] shadow-sm ring-1 ring-brand/30"
                    : "border-border bg-white hover:bg-surface-dim"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isActive ? "bg-brand text-white" : "bg-surface-dim text-navy border border-border"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-text-tertiary">
                    {stage.badge}
                  </span>
                </div>
                <h4 className="mt-3 text-xs font-bold text-navy">{stage.title}</h4>
                <p className="text-[11px] text-text-secondary truncate">{stage.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Active Stage Interactive Deep Dive Canvas */}
        <div className="card-glass-specular mt-8 mx-auto max-w-5xl rounded-2xl p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-12 items-center">
            {/* Left: Stage Explainer */}
            <div className="md:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-bold text-navy">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                <span>Verified Architecture Guarantee</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                {activeStage.subtitle}
              </h3>

              <p className="text-sm text-text-secondary leading-relaxed">
                {activeStage.details}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                {activeStage.specs.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1 text-xs font-medium text-navy shadow-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Technical Diagram Card */}
            <div className="md:col-span-5 rounded-xl border border-border bg-white p-5 shadow-xs font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2 text-text-tertiary text-[11px]">
                <span className="flex items-center gap-1.5 font-bold text-navy">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Data Flow Pipeline
                </span>
                <span className="text-emerald-600 font-bold">Active Check</span>
              </div>

              <div className="space-y-2 text-[11px] text-navy">
                <div className={`p-2.5 rounded-lg border transition-all ${
                  activeStage.id === "editor" ? "bg-brand/15 border-brand/40 font-bold" : "bg-surface-dim border-border"
                } flex items-center justify-between`}>
                  <span>Input Layer:</span>
                  <span className="font-bold text-brand">Sanitized AST</span>
                </div>
                <div className={`p-2.5 rounded-lg border transition-all ${
                  activeStage.id === "ast" ? "bg-brand/15 border-brand/40 font-bold" : "bg-surface-dim border-border"
                } flex items-center justify-between`}>
                  <span>Persistence:</span>
                  <span className="font-bold text-navy">PostgreSQL (RLS)</span>
                </div>
                <div className={`p-2.5 rounded-lg border transition-all ${
                  activeStage.id === "storage" ? "bg-brand/15 border-brand/40 font-bold" : "bg-surface-dim border-border"
                } flex items-center justify-between`}>
                  <span>Media Storage:</span>
                  <span className="font-bold text-[#FE4F01]">Cloudflare R2 (WebP)</span>
                </div>
                <div className={`p-2.5 rounded-lg border transition-all ${
                  activeStage.id === "delivery" ? "bg-brand/15 border-brand/40 font-bold" : "bg-surface-dim border-border"
                } flex items-center justify-between`}>
                  <span>API Protocol:</span>
                  <span className="font-bold text-emerald-700">Type-Safe REST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

