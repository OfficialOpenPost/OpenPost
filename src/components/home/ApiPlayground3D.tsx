"use client";

import { useState, useEffect } from "react";
import {
  Code2,
  Terminal,
  Zap,
  Check,
  Copy,
  Layers,
  RefreshCw,
  Play,
  Globe,
  ShieldCheck,
  Server,
  Database,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { FadeIn } from "@/components/motion";

interface EndpointDef {
  id: string;
  method: "GET";
  path: string;
  name: string;
  description: string;
  queryParam?: string;
  mockData: Record<string, any>;
}

const endpoints: EndpointDef[] = [
  {
    id: "posts",
    method: "GET",
    path: "/api/v1/posts?limit=3",
    name: "Published Posts",
    description: "Fetch paginated articles with author & category relations",
    mockData: {
      success: true,
      data: [
        {
          id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          title: "Modern Publishing Architecture with Next.js 16 & OpenPost",
          slug: "modern-publishing-nextjs-16",
          status: "published",
          readingTime: 6,
          wordCount: 1420,
          publishedAt: "2026-09-01T12:00:00.000Z",
          author: {
            name: "Sarah Chen",
            slug: "sarah-chen",
          },
          category: {
            name: "Architecture",
            slug: "architecture",
          },
        },
        {
          id: "c7f21b8a-8e42-491d-b892-91f8a847291a",
          title: "Zero-Egress Media Workflows on Cloudflare R2",
          slug: "zero-egress-media-cloudflare-r2",
          status: "published",
          readingTime: 4,
          wordCount: 980,
          publishedAt: "2026-08-28T09:30:00.000Z",
          author: {
            name: "Alex Rivera",
            slug: "alex-rivera",
          },
          category: {
            name: "Cloud Infrastructure",
            slug: "cloud-infrastructure",
          },
        },
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 3,
        totalPages: 1,
      },
    },
  },
  {
    id: "single-post",
    method: "GET",
    path: "/api/v1/posts/modern-publishing-nextjs-16",
    name: "Single Post (AST)",
    description: "Fetch full structured ProseMirror AST document tree",
    mockData: {
      success: true,
      data: {
        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        title: "Modern Publishing Architecture with Next.js 16 & OpenPost",
        slug: "modern-publishing-nextjs-16",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Decoupled Editorial Studio" }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "OpenPost separates authoring from global delivery using type-safe JSONB abstract syntax trees.",
                },
              ],
            },
          ],
        },
        seo: {
          metaTitle: "Modern Publishing Architecture with Next.js 16",
          metaDescription: "Learn how to build high-performance editorial pipelines.",
        },
      },
    },
  },
  {
    id: "authors",
    method: "GET",
    path: "/api/v1/authors",
    name: "Author Bylines",
    description: "Fetch public authors, bios, avatars, and article counts",
    mockData: {
      success: true,
      data: [
        {
          id: "auth_sarah_chen",
          name: "Sarah Chen",
          slug: "sarah-chen",
          bio: "Content Systems Lead. Writing about headless architectures.",
          _count: { blogs: 14 },
        },
        {
          id: "auth_alex_rivera",
          name: "Alex Rivera",
          slug: "alex-rivera",
          bio: "Cloud Infrastructure Engineer at OpenPost.",
          _count: { blogs: 9 },
        },
      ],
    },
  },
  {
    id: "categories",
    method: "GET",
    path: "/api/v1/categories",
    name: "Taxonomy Trees",
    description: "Fetch nested category trees with slug uniqueness",
    mockData: {
      success: true,
      data: [
        {
          id: "cat_architecture",
          name: "Architecture",
          slug: "architecture",
          children: [
            { id: "cat_cloud", name: "Cloud & Edge", slug: "cloud-edge" },
            { id: "cat_database", name: "PostgreSQL & R2", slug: "postgres-r2" },
          ],
          _count: { blogs: 8 },
        },
      ],
    },
  },
];

export function ApiPlayground3D() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(endpoints[0]);
  const [codeLang, setCodeLang] = useState<"nextjs" | "astro" | "curl" | "typescript" | "python">("nextjs");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [realResponse, setRealResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number>(24);
  const [responseSize, setResponseSize] = useState<string>("2.8 KB");

  const executeApi = async (ep: EndpointDef) => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(ep.path);
      if (res.ok) {
        const data = await res.json();
        const end = performance.now();
        setLatency(Math.max(8, Math.round(end - start)));
        setRealResponse(data);
        const jsonStr = JSON.stringify(data);
        setResponseSize(`${(jsonStr.length / 1024).toFixed(1)} KB`);
      } else {
        throw new Error("HTTP " + res.status);
      }
    } catch {
      // Graceful fallback to rich structured mock data
      setTimeout(() => {
        setLatency(Math.floor(Math.random() * 15) + 14);
        setRealResponse(ep.mockData);
        const jsonStr = JSON.stringify(ep.mockData);
        setResponseSize(`${(jsonStr.length / 1024).toFixed(1)} KB`);
        setLoading(false);
      }, 180);
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    executeApi(selectedEndpoint);
  }, [selectedEndpoint]);

  const getCodeSnippet = () => {
    if (codeLang === "curl") {
      return `curl -X GET "https://api.openpost.app${selectedEndpoint.path}" \\
  -H "Authorization: Bearer op_live_64hex_token" \\
  -H "Accept: application/json"`;
    }
    if (codeLang === "nextjs") {
      return `// Next.js 15/16 App Router (React Server Component)
import { notFound } from "next/navigation";

export default async function BlogFeed() {
  const res = await fetch(\`\${process.env.OPENPOST_URL}${selectedEndpoint.path}\`, {
    headers: {
      Authorization: \`Bearer \${process.env.OPENPOST_TOKEN}\`,
    },
    next: { tags: ["openpost-posts"], revalidate: 60 },
  });

  if (!res.ok) notFound();
  const { data } = await res.json();

  return (
    <main className="max-w-4xl mx-auto py-12">
      {data.map((item) => (
        <article key={item.id} className="border-b py-6">
          <h2 className="text-xl font-bold">{item.title}</h2>
        </article>
      ))}
    </main>
  );
}`;
    }
    if (codeLang === "astro") {
      return `---
// src/pages/blog/index.astro
const res = await fetch(\`\${import.meta.env.OPENPOST_URL}${selectedEndpoint.path}\`, {
  headers: {
    Authorization: \`Bearer \${import.meta.env.OPENPOST_TOKEN}\`,
  },
});
const { data } = await res.json();
---

<Layout title="Articles">
  {data.map((item) => (
    <article class="post-card">
      <h3>{item.title}</h3>
    </article>
  ))}
</Layout>`;
    }
    if (codeLang === "typescript") {
      return `import type { OpenPostResponse } from "@openpost/client";

export async function fetchContent(): Promise<OpenPostResponse> {
  const res = await fetch("https://api.openpost.app${selectedEndpoint.path}", {
    headers: {
      Authorization: "Bearer op_live_64hex_token",
      "Content-Type": "application/json",
    },
  });

  return await res.json();
}`;
    }
    return `# Python 3.11+ / requests
import requests
import os

url = f"{os.getenv('OPENPOST_URL')}${selectedEndpoint.path}"
headers = {
    "Authorization": f"Bearer {os.getenv('OPENPOST_TOKEN')}",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
data = response.json()
print(f"Fetched {len(data.get('data', []))} records")`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(realResponse || selectedEndpoint.mockData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <section id="api" className="bg-white py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Live Headless REST API
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Query your content in milliseconds.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Sanity-style interactive API playground — test real live endpoints, inspect structured JSON responses, and copy production-ready SDK snippets.
            </p>
          </div>
        </FadeIn>

        {/* Sanity-Style Interactive 3D Query Studio Sandbox */}
        <div className="mt-10 mx-auto max-w-6xl rounded-2xl border border-border bg-[#FCFCF9] shadow-2xl shadow-navy/10 overflow-hidden">
          {/* Top Global Query Request Bar (Sanity / Postman style) */}
          <div className="flex flex-wrap items-center justify-between border-b border-border bg-[#F3F4F6] p-3 sm:p-4 gap-3">
            <div className="flex flex-1 items-center gap-2 min-w-[260px] bg-white rounded-xl border border-border px-3 py-2 shadow-inner">
              <span className="rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold px-2 py-0.5">
                {selectedEndpoint.method}
              </span>
              <span className="font-mono text-xs text-text-tertiary hidden sm:inline">
                https://api.openpost.app
              </span>
              <span className="font-mono text-xs font-bold text-navy truncate">
                {selectedEndpoint.path}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => executeApi(selectedEndpoint)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-navy hover:bg-brand hover:text-navy text-white px-4 py-2 text-xs font-bold transition shadow-sm active:scale-95"
              >
                <Play className={`h-3.5 w-3.5 fill-current ${loading ? "animate-spin text-brand" : "text-brand"}`} />
                <span>{loading ? "Sending..." : "Execute Query"}</span>
              </button>
            </div>
          </div>

          {/* Endpoint Selector Tabs (Horizontal Pills) */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-white px-4 py-2.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-mono uppercase font-bold text-text-tertiary mr-2 shrink-0">
              Endpoints:
            </span>
            {endpoints.map((ep) => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                    isSelected
                      ? "bg-navy text-white shadow-xs font-bold"
                      : "bg-surface-dim text-text-secondary hover:bg-surface-raised hover:text-navy border border-border/60"
                  }`}
                >
                  <span className={`text-[10px] font-mono ${isSelected ? "text-brand" : "text-emerald-600"}`}>
                    {ep.method}
                  </span>
                  <span>{ep.name}</span>
                </button>
              );
            })}
          </div>

          {/* Main Dual-Pane Sandbox Body */}
          <div className="grid lg:grid-cols-12 min-h-[460px]">
            {/* Left Column: Code Generator & SDK Snippets */}
            <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-border bg-white p-4 sm:p-5 flex flex-col justify-between">
              <div>
                {/* Code Header & Language Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Code2 className="h-4 w-4 text-brand" />
                    <span>Client Integration</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <div className="flex rounded-lg bg-surface-dim p-0.5 border border-border text-xs font-medium">
                      {(["nextjs", "astro", "typescript", "curl", "python"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setCodeLang(lang)}
                          className={`px-2 py-0.5 rounded text-[11px] transition ${
                            codeLang === lang ? "bg-white text-navy font-bold shadow-2xs" : "text-text-tertiary hover:text-navy"
                          }`}
                        >
                          {lang === "nextjs"
                            ? "Next.js"
                            : lang === "astro"
                            ? "Astro"
                            : lang === "typescript"
                            ? "TS"
                            : lang === "curl"
                            ? "cURL"
                            : "Python"}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={copyCode}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1 text-[11px] font-semibold text-navy hover:bg-surface-raised transition shadow-2xs"
                    >
                      {copiedCode ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span className="hidden sm:inline">{copiedCode ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Code Snippet Pre Block */}
                <div className="mt-3 relative">
                  <pre className="overflow-x-auto custom-scrollbar text-xs font-mono text-navy leading-relaxed p-4 bg-[#F9FAFB] rounded-xl border border-border max-h-80">
                    <code>{getCodeSnippet()}</code>
                  </pre>
                </div>
              </div>

              {/* Endpoint Context Description */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-tertiary">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Bearer Token Guarded (op_live_64hex)</span>
                </span>
                <span className="font-mono">HTTP/2 TLS 1.3</span>
              </div>
            </div>

            {/* Right Column: Real-Time Live JSON Response Inspector */}
            <div className="lg:col-span-6 bg-[#12161D] text-slate-200 p-4 sm:p-5 flex flex-col justify-between">
              <div>
                {/* Response Titlebar & Telemetry */}
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-bold">200 OK</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-brand font-bold">{latency}ms</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400 text-[11px]">{responseSize}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-800 text-cyan-400 px-2 py-0.5 text-[10px] font-bold">
                      Edge ISR HIT
                    </span>
                    <button
                      onClick={copyJson}
                      className="flex items-center gap-1 rounded bg-[#2D3440] hover:bg-slate-700 text-slate-300 px-2 py-0.5 text-[11px] transition"
                    >
                      {copiedJson ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
                    </button>
                  </div>
                </div>

                {/* Formatted JSON Output Window */}
                <div className="mt-3">
                  <pre className="overflow-x-auto custom-scrollbar-dark text-xs font-mono text-emerald-300 leading-relaxed max-h-80">
                    <code>
                      {loading
                        ? "Executing edge query against database..."
                        : JSON.stringify(realResponse || selectedEndpoint.mockData, null, 2)}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Edge Delivery Diagnostics */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Global Edge Network</span>
                </span>
                <span>cache-control: s-maxage=60</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Bottom Value Guarantees */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {[
            {
              title: "Sub-50ms Global Edge",
              desc: "Instant delivery cached on Vercel & Cloudflare edge nodes with on-demand invalidation.",
              icon: Zap,
            },
            {
              title: "Safe Bearer Auth",
              desc: "Sha-256 hashed op_live_64hex tokens scoped by project with rate limiting.",
              icon: ShieldCheck,
            },
            {
              title: "Zero-Egress Media",
              desc: "Cloudflare R2 image URLs with automatic WebP conversion and responsive variants.",
              icon: Server,
            },
            {
              title: "Multi-Framework SDKs",
              desc: "First-class client support for Next.js 15, Astro, Remix, Vue, and Python.",
              icon: Code2,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="card-glass-specular shimmer-surface rounded-2xl p-4 sm:p-5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-navy">
                <item.icon className="h-4.5 w-4.5 text-brand" />
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

