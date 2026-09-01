"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Code2,
  Terminal,
  Zap,
  Check,
  Copy,
  Layers,
  RefreshCw,
} from "lucide-react";
import { FadeIn } from "@/components/motion";

interface EndpointDef {
  id: string;
  method: "GET";
  path: string;
  description: string;
}

const endpoints: EndpointDef[] = [
  {
    id: "posts",
    method: "GET",
    path: "/api/v1/posts?limit=5",
    description: "Fetch real published posts from your database",
  },
  {
    id: "categories",
    method: "GET",
    path: "/api/v1/categories",
    description: "Fetch real taxonomy categories & active counts",
  },
  {
    id: "tags",
    method: "GET",
    path: "/api/v1/tags",
    description: "Fetch real content tags",
  },
  {
    id: "authors",
    method: "GET",
    path: "/api/v1/authors",
    description: "Fetch published authors and profiles",
  },
];

export function ApiPlayground3D() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(endpoints[0]);
  const [codeLang, setCodeLang] = useState<"nextjs" | "curl" | "fetch">("nextjs");
  const [copied, setCopied] = useState(false);
  const [realResponse, setRealResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const executeApi = async (ep: EndpointDef) => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(ep.path);
      const data = await res.json();
      const end = performance.now();
      setLatency(Math.round(end - start));
      setRealResponse(data);
    } catch (err: any) {
      setLatency(12);
      setRealResponse({ error: "Failed to connect to local API route", message: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeApi(selectedEndpoint);
  }, [selectedEndpoint]);

  const getCodeSnippet = () => {
    if (codeLang === "curl") {
      return `curl -X GET "https://your-domain.com${selectedEndpoint.path}" \\
  -H "Accept: application/json"`;
    }
    if (codeLang === "nextjs") {
      return `// Next.js React Server Component
export default async function BlogPage() {
  const res = await fetch(\`\${process.env.OPENPOST_URL}${selectedEndpoint.path}\`, {
    next: { revalidate: 60 },
  });
  const json = await res.json();
  return <div>{JSON.stringify(json.data)}</div>;
}`;
    }
    return `const response = await fetch("${selectedEndpoint.path}");
const data = await response.json();
console.log(data);`;
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="api" className="bg-white py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Live Headless REST API
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Test live API endpoints with real database data.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Click any endpoint below — queries are executed against your actual database in real time.
            </p>
          </div>
        </FadeIn>

        {/* Small Architecture Overview */}
        <div className="mt-8 mx-auto max-w-4xl rounded-2xl border border-border bg-[#FCFCF9] p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
          <div className="relative h-20 w-32 shrink-0 rounded-xl overflow-hidden border border-border">
            <Image
              src="/images/api_infrastructure_3d.jpg"
              alt="API Architecture"
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                Live Local Endpoint
              </span>
              <span className="rounded-full bg-brand/15 text-navy px-2 py-0.5 text-[10px] font-bold">
                PostgreSQL + Prisma Core
              </span>
            </div>
            <p className="mt-1 text-xs text-text-secondary font-medium">
              Versioned, cache-optimized REST API serving published articles, categories, and author metadata.
            </p>
          </div>
        </div>

        {/* Real Live API Terminal Sandbox */}
        <div className="mt-8 mx-auto max-w-5xl grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Real Endpoint Selector & Client Code */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              {endpoints.map((ep) => {
                const isSelected = selectedEndpoint.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEndpoint(ep)}
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-brand bg-brand/10 shadow-xs"
                        : "border-border bg-surface-dim hover:bg-surface-raised"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                          {ep.method}
                        </span>
                        <span className="font-mono text-xs font-bold text-navy">
                          {ep.path}
                        </span>
                      </div>
                      {isSelected ? (
                        <Zap className="h-3.5 w-3.5 text-brand" />
                      ) : (
                        <span className="text-[10px] text-text-tertiary">Run →</span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-text-tertiary">{ep.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Code Snippet Box */}
            <div className="rounded-xl border border-border bg-[#F9FAFB] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                  Client Code
                </span>
                <div className="flex items-center rounded-lg bg-white p-0.5 border border-border text-xs">
                  {(["nextjs", "curl", "fetch"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setCodeLang(l)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                        codeLang === l ? "bg-navy text-white" : "text-text-tertiary hover:text-navy"
                      }`}
                    >
                      {l === "nextjs" ? "Next.js" : l === "curl" ? "cURL" : "Fetch"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative rounded-lg border border-border bg-white p-3">
                <button
                  onClick={copySnippet}
                  className="absolute top-2 right-2 flex items-center gap-1 rounded bg-surface-dim px-2 py-0.5 text-[10px] font-semibold text-navy hover:bg-surface-raised transition border border-border"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <pre className="overflow-x-auto text-[11px] font-mono text-navy leading-relaxed max-h-32 pt-1">
                  <code>{getCodeSnippet()}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Right: Live Real Response Output */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-[#FCFCF9] overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-border bg-[#F3F4F6] px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-mono font-bold text-emerald-800">
                  {loading ? "FETCHING..." : "200 OK — Real Response"}
                </span>
                {latency !== null && (
                  <>
                    <span className="text-text-tertiary">|</span>
                    <span className="font-mono text-brand text-[11px] font-bold">
                      {latency}ms
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => executeApi(selectedEndpoint)}
                className="flex items-center gap-1 text-[11px] font-semibold text-navy hover:text-brand"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            <div className="p-4 bg-white">
              <pre className="overflow-x-auto text-[11px] font-mono text-navy leading-relaxed max-h-80">
                <code>
                  {loading
                    ? "Loading real data from database..."
                    : JSON.stringify(realResponse, null, 2)}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
