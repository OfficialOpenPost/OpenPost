"use client";

import { useState } from "react";
import {
  Terminal as TerminalIcon,
  Cloud,
  Database,
  Globe,
  Shield,
  Copy,
  Check,
  Play,
  Sparkles,
  Layers,
  Cpu,
} from "lucide-react";
import { FadeIn, ScaleIn } from "@/components/motion";
import { Tilt3DCard } from "./Tilt3DCard";

const cliCommands = [
  {
    id: "init",
    title: "openpost-cli init",
    badge: "Fast Starter",
    desc: "Scaffold a Next.js 15 blog connected directly to your OpenPost CMS",
    cmd: "npx openpost-cli init my-blog",
    output: [
      { type: "info", text: "⚡ openpost-cli v0.2.3" },
      { type: "step", text: "✔ Connecting to CMS studio..." },
      { type: "step", text: "✔ Exchanging session token (op_live_...)" },
      { type: "step", text: "✔ Downloading Next.js 15 blog template" },
      { type: "step", text: "✔ Generating .env.local with OPENPOST_URL & PROJECT_ID" },
      { type: "success", text: "🎉 Successfully created my-blog at ./my-blog" },
      { type: "hint", text: "👉 Run 'cd my-blog && npm run dev' to start writing!" },
    ],
  },
  {
    id: "doctor",
    title: "openpost-cli doctor",
    badge: "Health Diagnostic",
    desc: "Verify CMS health, Supabase connection, and edge latency",
    cmd: "npx openpost-cli doctor --cms-url https://api.openpost.app",
    output: [
      { type: "info", text: "🔍 Running OpenPost Environment Diagnostics..." },
      { type: "step", text: "✔ Node.js version >= 18.0.0 (v20.11.0 detected)" },
      { type: "step", text: "✔ CMS Endpoint https://api.openpost.app reachable (24ms)" },
      { type: "step", text: "✔ PostgreSQL schema validated (021_site_config applied)" },
      { type: "step", text: "✔ Cloudflare R2 bucket connection healthy" },
      { type: "success", text: "✨ All 5 system health checks passed cleanly!" },
    ],
  },
  {
    id: "bootstrap",
    title: "cms:bootstrap",
    badge: "Owner Setup",
    desc: "Create initial root OWNER administrator in sovereign database",
    cmd: "npm run cms:bootstrap -- --email admin@example.com --password StrongPass123",
    output: [
      { type: "info", text: "🔐 Initializing OpenPost Root Security Matrix..." },
      { type: "step", text: "✔ Checking existing OWNER profile..." },
      { type: "step", text: "✔ Creating root OWNER role: admin@example.com" },
      { type: "step", text: "✔ Enforcing 5-tier RBAC rules & RLS policies" },
      { type: "success", text: "🚀 Root OWNER account created. Log in at /login" },
    ],
  },
  {
    id: "docker",
    title: "docker compose",
    badge: "Self-Hosted",
    desc: "Spin up a full sovereign stack with Postgres & local S3 storage",
    cmd: "git clone https://github.com/OfficialOpenPost/OpenPost.git\ncd OpenPost\ndocker compose up -d",
    output: [
      { type: "info", text: "🐳 Starting OpenPost Multi-Tenant Docker Cluster..." },
      { type: "step", text: "✔ Container openpost-db (PostgreSQL 16) ... Started" },
      { type: "step", text: "✔ Container openpost-app (Next.js 16) ... Started" },
      { type: "success", text: "🌐 OpenPost Studio running on http://localhost:3000" },
    ],
  },
];

export function DeployEcosystem3D() {
  const [activeTab, setActiveTab] = useState(cliCommands[0]);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(activeTab.cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="deploy" className="bg-[#FAF9F5] py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Developer CLI &amp; Ecosystem
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              A command-line experience like Sanity &amp; Astro.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Scaffold full-stack blog starters, diagnose database health, or self-host anywhere with zero vendor lock-in.
            </p>
          </div>
        </FadeIn>

        {/* Sanity-Style 3D Interactive CLI Playground */}
        <div className="mt-10 mx-auto max-w-5xl">
          {/* CLI Command Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {cliCommands.map((c) => {
              const isSelected = activeTab.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveTab(c);
                    setCopied(false);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
                    isSelected
                      ? "bg-navy text-white shadow-md shadow-navy/15 scale-[1.02]"
                      : "border border-border bg-white text-text-secondary hover:text-navy hover:bg-surface-raised"
                  }`}
                >
                  <TerminalIcon className={`h-3.5 w-3.5 ${isSelected ? "text-brand" : "text-text-tertiary"}`} />
                  <span>{c.title}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] ${
                      isSelected ? "bg-white/20 text-white" : "bg-surface-dim text-text-tertiary"
                    }`}
                  >
                    {c.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Linear-Style 3D Laser Border Terminal Window */}
          <div className="laser-border-container shadow-2xl shadow-navy/15">
            <div className="relative rounded-[calc(1rem-1px)] bg-[#12161D] overflow-hidden">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between border-b border-[#2D3440] bg-[#1E242E] px-4 py-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#FE4F01]" />
                  <div className="h-3 w-3 rounded-full bg-[#FEA611]" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-mono text-[11px] text-slate-400">
                    terminal — openpost-cli v0.2.3
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
                    {activeTab.desc}
                  </span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 rounded-lg bg-[#2D3440] border border-slate-700 px-3 py-1 text-xs font-bold text-white hover:bg-brand hover:text-navy transition shadow-xs"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied Command" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Terminal Input Prompt */}
              <div className="bg-[#12161D] p-5 border-b border-slate-800 font-mono text-sm">
                <div className="flex items-center gap-2 text-brand">
                  <span className="text-emerald-400 font-bold">$</span>
                  <span className="text-slate-100 font-semibold">{activeTab.cmd}</span>
                </div>
              </div>

              {/* Terminal Simulated Output */}
              <div className="bg-[#0F1318] p-5 font-mono text-xs text-slate-300 space-y-2 max-h-72 overflow-y-auto">
                {activeTab.output.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    {line.type === "info" && (
                      <span className="text-[#FEA611] font-semibold">{line.text}</span>
                    )}
                    {line.type === "step" && (
                      <span className="text-slate-300">{line.text}</span>
                    )}
                    {line.type === "success" && (
                      <span className="text-emerald-400 font-bold">{line.text}</span>
                    )}
                    {line.type === "hint" && (
                      <span className="text-cyan-300">{line.text}</span>
                    )}
                  </div>
                ))}
                <div className="pt-2 flex items-center gap-2 text-slate-500 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Process exited with code 0 (success)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Infrastructure Freedom Cards with Prismatic Shimmer Elevation */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {[
            { icon: Cloud, title: "Vercel + Next.js", desc: "One-click deployment with edge ISR caching" },
            { icon: Globe, title: "Cloudflare R2", desc: "Zero-egress S3-compatible media storage" },
            { icon: Database, title: "Supabase PostgreSQL", desc: "Prisma ORM with Row Level Security" },
            { icon: Shield, title: "Docker Self-Hosted", desc: "Complete data sovereignty under MIT License" },
          ].map((item) => (
            <div
              key={item.title}
              className="card-glass-specular shimmer-surface rounded-2xl p-5 shadow-xs"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-navy">
                <item.icon className="h-5 w-5 text-brand" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-navy">{item.title}</h3>
              <p className="mt-1 text-xs text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

