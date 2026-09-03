"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Code2,
  FileText,
  Sparkles,
  CheckCircle2,
  Laptop,
  Tablet,
  Smartphone,
  Layers,
  BarChart3,
  Search,
  Sliders,
  Terminal,
  Zap,
  Copy,
  Check,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Quote,
  Table as TableIcon,
  Cpu,
  Activity,
  Gauge,
} from "lucide-react";
import { FadeIn, ScaleIn } from "@/components/motion";
import { Tilt3DCard } from "./Tilt3DCard";

export function InteractiveEditor3D() {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"visual" | "json">("visual");

  // Interactive formatting toggles
  const [activeFormats, setActiveFormats] = useState({
    bold: true,
    italic: false,
    underline: false,
  });

  // Interactive poll state
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({
    tiptap: 142,
    api: 98,
    seo: 114,
  });
  const [hasVoted, setHasVoted] = useState<string | null>(null);

  // Active blocks toggle
  const [enabledBlocks, setEnabledBlocks] = useState({
    heading: true,
    paragraph: true,
    code: true,
    poll: true,
    callout: true,
    table: true,
  });

  const [copied, setCopied] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const totalVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);

  const handleVote = (id: string) => {
    if (hasVoted) return;
    setPollVotes((prev) => ({
      ...prev,
      [id]: prev[id] + 1,
    }));
    setHasVoted(id);
  };

  const toggleFormat = (format: "bold" | "italic" | "underline") => {
    setActiveFormats((prev) => ({ ...prev, [format]: !prev[format] }));
  };

  const generatedJson = {
    type: "doc",
    version: "1.4.0",
    meta: {
      readingTimeMinutes: 5,
      wordCount: 1480,
      seoScore: 98,
    },
    content: [
      enabledBlocks.heading && {
        type: "heading",
        attrs: { level: 1, id: "why-structured-cms-matters" },
        content: [{ type: "text", text: "Crafting High-Performance Content with OpenPost" }],
      },
      enabledBlocks.paragraph && {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              activeFormats.bold ? { type: "bold" } : null,
              activeFormats.italic ? { type: "italic" } : null,
            ].filter(Boolean),
            text: "OpenPost stores all document content in safe, structured JSON. No arbitrary HTML parsing, no script injections, and instant edge compilation.",
          },
        ],
      },
      enabledBlocks.callout && {
        type: "callout",
        attrs: { variant: "success", title: "SEO Optimization Engine" },
        content: [{ type: "text", text: "Readability score: 98/100 · Optimal title length (48 chars) · Schema.org ready" }],
      },
      enabledBlocks.code && {
        type: "codeBlock",
        attrs: { language: "typescript" },
        content: [{ type: "text", text: 'const { data } = await openpost.posts.get("crafting-content");\nexport default function Page() { return <Renderer content={data} />; }' }],
      },
      enabledBlocks.poll && {
        type: "poll",
        attrs: {
          question: "Which feature is most critical for your publishing pipeline?",
          options: [
            { id: "tiptap", label: "Block Editor (Tiptap)" },
            { id: "api", label: "Headless Delivery API" },
            { id: "seo", label: "SEO & Social Sharing" },
          ],
        },
      },
      enabledBlocks.table && {
        type: "table",
        attrs: { rows: 2, cols: 3 },
        content: [
          { row: 1, cells: ["Feature", "OpenPost Engine", "Legacy WP"] },
          { row: 2, cells: ["Storage AST", "Safe JSONB", "Raw Vulnerable HTML"] },
        ],
      },
    ].filter(Boolean),
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(generatedJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="interactive-editor" className="bg-[#FAF9F5] py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Writing Studio Engine
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Test the block editor in real time.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Toggle content blocks below to preview structured rendering and instant JSON generation.
            </p>
          </div>
        </FadeIn>

        {/* Studio Controls Bar */}
        <div className="mt-8 mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 shadow-xs">
          {/* Block toggles */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-text-tertiary mr-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-brand" /> Blocks:
            </span>
            {[
              { id: "heading", label: "H1 Heading" },
              { id: "paragraph", label: "Paragraph" },
              { id: "callout", label: "SEO Callout" },
              { id: "code", label: "TypeScript Code" },
              { id: "poll", label: "Live Poll" },
              { id: "table", label: "Data Table" },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() =>
                  setEnabledBlocks((prev) => ({
                    ...prev,
                    [b.id as keyof typeof prev]: !prev[b.id as keyof typeof prev],
                  }))
                }
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  enabledBlocks[b.id as keyof typeof enabledBlocks]
                    ? "bg-brand/15 border border-brand/40 text-navy"
                    : "bg-surface-dim border border-border text-text-tertiary hover:text-text-primary"
                }`}
              >
                {enabledBlocks[b.id as keyof typeof enabledBlocks] ? "✓ " : "+ "}
                {b.label}
              </button>
            ))}
          </div>

          {/* Device & Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-surface-dim p-0.5 border border-border">
              <button
                onClick={() => setDevice("desktop")}
                className={`p-1.5 rounded-md transition ${
                  device === "desktop" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                }`}
                title="Desktop View"
              >
                <Laptop className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDevice("tablet")}
                className={`p-1.5 rounded-md transition ${
                  device === "tablet" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                }`}
                title="Tablet View"
              >
                <Tablet className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDevice("mobile")}
                className={`p-1.5 rounded-md transition ${
                  device === "mobile" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                }`}
                title="Mobile View"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center rounded-lg bg-surface-dim p-0.5 border border-border text-xs font-semibold">
              <button
                onClick={() => setActiveTab("visual")}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === "visual" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                }`}
              >
                Studio Canvas
              </button>
              <button
                onClick={() => setActiveTab("json")}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === "json" ? "bg-brand text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                }`}
              >
                JSON AST
              </button>
            </div>
          </div>
        </div>

        {/* 3D Canvas Studio Viewport */}
        <div className="mt-6 mx-auto flex justify-center">
          <div
            className={`transition-all duration-300 w-full ${
              device === "desktop"
                ? "max-w-5xl"
                : device === "tablet"
                ? "max-w-2xl"
                : "max-w-sm"
            }`}
          >
            <Tilt3DCard depth={4} className="shadow-2xl shadow-navy/10 overflow-hidden border-border bg-white">
              {/* Window Bar with Live Telemetry */}
              <div className="flex items-center justify-between border-b border-border bg-[#F9FAFB] px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono text-[11px] text-text-tertiary hidden sm:inline">
                    openpost-studio/article-editor.tsx
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Autosave
                  </span>
                  <span className="text-text-tertiary">|</span>
                  <span className="text-text-secondary font-mono">1,480 words (5 min read)</span>
                  <span className="hidden sm:inline-block rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 font-mono text-[10px] font-bold">
                    SEO: 98/100
                  </span>
                </div>
              </div>

              {/* Rich Formatting Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white px-4 py-2 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleFormat("bold")}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold transition ${
                      activeFormats.bold ? "bg-navy text-white" : "bg-surface-dim text-text-secondary hover:bg-surface-raised"
                    }`}
                    title="Bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleFormat("italic")}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold transition ${
                      activeFormats.italic ? "bg-navy text-white" : "bg-surface-dim text-text-secondary hover:bg-surface-raised"
                    }`}
                    title="Italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleFormat("underline")}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold transition ${
                      activeFormats.underline ? "bg-navy text-white" : "bg-surface-dim text-text-secondary hover:bg-surface-raised"
                    }`}
                    title="Underline"
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-4 w-px bg-border mx-1" />

                  <button
                    onClick={() => setEnabledBlocks((p) => ({ ...p, heading: !p.heading }))}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-[11px] transition ${
                      enabledBlocks.heading ? "bg-brand/15 text-navy border border-brand/30" : "bg-surface-dim text-text-secondary"
                    }`}
                  >
                    <Heading1 className="h-3.5 w-3.5 text-brand" /> H1
                  </button>
                  <button
                    onClick={() => setEnabledBlocks((p) => ({ ...p, code: !p.code }))}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-[11px] transition ${
                      enabledBlocks.code ? "bg-brand/15 text-navy border border-brand/30" : "bg-surface-dim text-text-secondary"
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5 text-brand" /> Code
                  </button>
                  <button
                    onClick={() => setEnabledBlocks((p) => ({ ...p, poll: !p.poll }))}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-[11px] transition ${
                      enabledBlocks.poll ? "bg-brand/15 text-navy border border-brand/30" : "bg-surface-dim text-text-secondary"
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-[#FE4F01]" /> Poll
                  </button>
                </div>

                {/* Quick Insert / Slash Command Helper */}
                <div className="relative">
                  <button
                    onClick={() => setShowSlashMenu(!showSlashMenu)}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-[#F9FAFB] px-2.5 py-1 text-xs font-semibold text-navy hover:bg-surface-raised transition shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5 text-brand" />
                    <span>Insert Block</span>
                    <kbd className="rounded bg-white border border-border px-1 py-0.2 text-[10px] text-text-tertiary font-mono">/</kbd>
                  </button>

                  {showSlashMenu && (
                    <div className="absolute right-0 top-9 z-20 w-56 rounded-xl border border-border bg-white p-2 shadow-xl shadow-navy/10 animate-in fade-in slide-in-from-top-2">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                        Available Blocks
                      </p>
                      {[
                        { label: "Interactive Poll", icon: BarChart3, key: "poll" },
                        { label: "TypeScript Code", icon: Code2, key: "code" },
                        { label: "SEO Callout", icon: CheckCircle2, key: "callout" },
                        { label: "Data Table", icon: TableIcon, key: "table" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setEnabledBlocks((p) => ({ ...p, [item.key]: true }));
                            setShowSlashMenu(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-navy hover:bg-surface-dim transition"
                        >
                          <item.icon className="h-3.5 w-3.5 text-brand" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Canvas Content Body */}
              <div className="min-h-[420px] p-6 sm:p-8 bg-white">
                {activeTab === "visual" ? (
                  <div className="space-y-5">
                    {/* Header Image / Cover Preview */}
                    <div className="flex items-center gap-4 rounded-xl border border-border bg-[#FCFCF9] p-3.5">
                      <div className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border border-border shadow-xs">
                        <Image
                          src="/images/editor_showcase_3d.jpg"
                          alt="Editor Preview"
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-navy">Tiptap ProseMirror Engine</span>
                          <span className="rounded bg-brand/15 px-2 py-0.2 text-[10px] font-bold text-navy">
                            AST Safe
                          </span>
                        </div>
                        <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                          Zero XSS vulnerabilities · 60fps typing · Clean JSON output
                        </p>
                      </div>
                    </div>

                    {/* H1 Heading */}
                    {enabledBlocks.heading && (
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-navy tracking-tight leading-tight">
                        Crafting High-Performance Content with OpenPost
                      </h1>
                    )}

                    {/* Paragraph */}
                    {enabledBlocks.paragraph && (
                      <p
                        className={`text-sm sm:text-base leading-relaxed text-text-secondary ${
                          activeFormats.bold ? "font-semibold text-navy" : ""
                        } ${activeFormats.italic ? "italic" : ""} ${
                          activeFormats.underline ? "underline underline-offset-4 decoration-brand" : ""
                        }`}
                      >
                        Modern content creators demand extreme performance, instant autosaving,
                        and frictionless publishing. OpenPost stores every document as validated,
                        versioned JSON nodes — eliminating raw HTML vulnerabilities and enabling sub-50ms headless API delivery.
                      </p>
                    )}

                    {/* SEO Callout */}
                    {enabledBlocks.callout && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-emerald-900">
                              Lighthouse SEO 100/100 Validated
                            </h4>
                            <p className="mt-0.5 text-[11px] text-emerald-800 leading-relaxed">
                              OpenGraph metadata, Schema.org JSON-LD, and WebP media variants automatically generated.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TypeScript Code Block */}
                    {enabledBlocks.code && (
                      <div className="overflow-hidden rounded-xl border border-border bg-[#F3F4F6] p-4">
                        <div className="flex items-center justify-between border-b border-border pb-2 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <Code2 className="h-3.5 w-3.5 text-brand" />
                            <span className="text-[11px] font-mono text-navy font-bold">typescript</span>
                          </div>
                          <span className="text-[10px] text-text-tertiary font-mono">AST_NODE_CODE</span>
                        </div>
                        <pre className="overflow-x-auto text-xs font-mono text-navy leading-relaxed">
                          <code>{`const post = await openpost.posts.getBySlug("crafting-content");
export default function BlogPost() {
  return <OpenPostRenderer content={post.content} />;
}`}</code>
                        </pre>
                      </div>
                    )}

                    {/* Interactive Poll Block */}
                    {enabledBlocks.poll && (
                      <div className="rounded-xl border border-brand/30 bg-[#FFFBF5] p-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <BarChart3 className="h-4 w-4 text-brand" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">
                              Interactive Reader Poll Widget
                            </span>
                          </div>
                          <span className="text-[10px] text-text-tertiary font-mono">
                            {totalVotes} Votes Cast
                          </span>
                        </div>

                        <p className="text-xs font-bold text-navy mb-3">
                          Which feature is most critical for your publishing pipeline?
                        </p>

                        <div className="space-y-2">
                          {[
                            { id: "tiptap", label: "Block Editor (Tiptap)" },
                            { id: "api", label: "Headless REST API" },
                            { id: "seo", label: "SEO & Social Preview" },
                          ].map((option) => {
                            const votes = pollVotes[option.id];
                            const percent = Math.round((votes / totalVotes) * 100);
                            const isSelected = hasVoted === option.id;

                            return (
                              <button
                                key={option.id}
                                onClick={() => handleVote(option.id)}
                                className={`relative w-full overflow-hidden rounded-lg border p-2.5 text-left transition ${
                                  isSelected
                                    ? "border-brand bg-brand/10 font-bold"
                                    : "border-border bg-white hover:border-brand/40"
                                }`}
                              >
                                <div
                                  className="absolute inset-y-0 left-0 bg-brand/15 transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                                <div className="relative flex items-center justify-between text-xs">
                                  <span className="text-navy flex items-center gap-1.5 font-medium">
                                    {isSelected && <Check className="h-3.5 w-3.5 text-brand" />}
                                    {option.label}
                                  </span>
                                  <span className="font-mono font-bold text-navy">
                                    {percent}% ({votes})
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Data Table */}
                    {enabledBlocks.table && (
                      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-border bg-[#F9FAFB] font-bold text-navy">
                            <tr>
                              <th className="p-2.5">Architecture Feature</th>
                              <th className="p-2.5">OpenPost Engine</th>
                              <th className="p-2.5">Legacy Systems</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border font-mono text-[11px] text-text-secondary">
                            <tr>
                              <td className="p-2.5 font-bold text-navy font-sans">Storage Model</td>
                              <td className="p-2.5 text-emerald-600 font-bold">ProseMirror JSONB AST</td>
                              <td className="p-2.5 text-red-500">Unstructured HTML Blobs</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold text-navy font-sans">Security</td>
                              <td className="p-2.5 text-emerald-600 font-bold">5-Tier Strict RBAC + RLS</td>
                              <td className="p-2.5 text-amber-600">Plugin Vulnerabilities</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  /* JSON AST Tab */
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-brand" />
                        <span className="text-xs font-mono font-bold text-navy">ProseMirror Document AST (openpost/v1.4)</span>
                      </div>
                      <button
                        onClick={copyJson}
                        className="flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-dark transition shadow-xs"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? "Copied" : "Copy JSON AST"}</span>
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-[11px] font-mono text-navy leading-relaxed max-h-96 p-4 bg-[#F9FAFB] rounded-xl border border-border">
                      <code>{JSON.stringify(generatedJson, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            </Tilt3DCard>
          </div>
        </div>
      </div>
    </section>
  );
}

