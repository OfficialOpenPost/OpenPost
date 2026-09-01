"use client";

import { useState } from "react";
import {
  Terminal,
  Cloud,
  Database,
  Globe,
  Shield,
  Copy,
  Check,
} from "lucide-react";
import { FadeIn } from "@/components/motion";

const deployTabs = [
  {
    id: "cli",
    title: "OpenPost CLI (Recommended)",
    cmd: `npx openpost-cli init my-blog
# Follow interactive prompt to connect Supabase & Cloudflare R2
cd my-blog
npm run dev`,
  },
  {
    id: "docker",
    title: "Docker Compose",
    cmd: `git clone https://github.com/OfficialOpenPost/OpenPost.git
cd OpenPost
docker compose up -d
# Open http://localhost:3000 in browser`,
  },
  {
    id: "vercel",
    title: "Vercel + Supabase",
    cmd: `npx create-openpost --template vercel
# Link Supabase project URL and API keys in environment settings`,
  },
];

export function DeployEcosystem3D() {
  const [activeTab, setActiveTab] = useState(deployTabs[0]);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(activeTab.cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="deploy" className="bg-[#FAF9F5] py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Infrastructure Freedom
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Deploy anywhere. Zero vendor lock-in.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              OpenPost is 100% open source under the MIT License. Run on Vercel, Supabase, Cloudflare R2, or self-host with Docker.
            </p>
          </div>
        </FadeIn>

        {/* Clean Light CLI Terminal Card */}
        <div className="mt-8 mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
            {/* Terminal Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-border bg-[#F9FAFB] px-4 py-2.5 gap-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 font-mono text-[11px] text-text-tertiary">
                  setup-openpost.sh
                </span>
              </div>

              <div className="flex items-center gap-1">
                {deployTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                      activeTab.id === tab.id
                        ? "bg-navy text-white"
                        : "text-text-secondary hover:bg-surface-raised"
                    }`}
                  >
                    {tab.title.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal Code Body */}
            <div className="relative p-5 bg-[#FCFCF9]">
              <button
                onClick={copyCode}
                className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-white border border-border px-2.5 py-1 text-xs font-bold text-navy hover:bg-surface-dim transition shadow-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>

              <pre className="overflow-x-auto text-xs font-mono text-navy leading-relaxed pr-16">
                <code>{activeTab.cmd}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* 4 Provider Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {[
            { icon: Cloud, title: "Vercel + Supabase", desc: "Recommended serverless stack" },
            { icon: Globe, title: "Cloudflare R2", desc: "Zero-egress media storage" },
            { icon: Database, title: "PostgreSQL Database", desc: "Prisma schema migrations" },
            { icon: Shield, title: "Docker Self-Hosted", desc: "Full sovereign data control" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-white p-4 shadow-xs hover:border-brand/40 transition"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-navy">
                <item.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-xs font-bold text-navy">{item.title}</h3>
              <p className="mt-0.5 text-[11px] text-text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
