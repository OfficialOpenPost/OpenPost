"use client";

import { useState } from "react";
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
} from "lucide-react";
import { FadeIn } from "@/components/motion";

export function InteractiveEditor3D() {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"visual" | "json">("visual");

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
  });

  const [copied, setCopied] = useState(false);

  const totalVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);

  const handleVote = (id: string) => {
    if (hasVoted) return;
    setPollVotes((prev) => ({
      ...prev,
      [id]: prev[id] + 1,
    }));
    setHasVoted(id);
  };

  const generatedJson = {
    type: "doc",
    version: "1.4.0",
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
            text: "OpenPost stores all document content in safe, structured JSON. No arbitrary HTML parsing, no script injections, and instant edge compilation.",
          },
        ],
      },
      enabledBlocks.callout && {
        type: "callout",
        attrs: { variant: "success", title: "SEO Optimization" },
        content: [{ type: "text", text: "Readability score: 98/100 · Optimal title length (48 chars)" }],
      },
      enabledBlocks.code && {
        type: "codeBlock",
        attrs: { language: "typescript" },
        content: [{ type: "text", text: 'const { data } = await openpost.posts.get("crafting-content");' }],
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
    ].filter(Boolean),
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(generatedJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="interactive-editor" className="bg-[#FAF9F5] py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
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
        <div className="mt-8 mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-3 shadow-xs">
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

          {/* View Switcher & JSON Switch */}
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
                className={`px-2.5 py-1 rounded-md transition ${
                  activeTab === "visual" ? "bg-white text-navy shadow-xs" : "text-text-tertiary hover:text-navy"
                }`}
              >
                Canvas
              </button>
              <button
                onClick={() => setActiveTab("json")}
                className={`px-2.5 py-1 rounded-md transition ${
                  activeTab === "json" ? "bg-brand text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                }`}
              >
                JSON Schema
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Viewport */}
        <div className="mt-6 mx-auto flex justify-center">
          <div
            className={`transition-all duration-300 w-full ${
              device === "desktop"
                ? "max-w-4xl"
                : device === "tablet"
                ? "max-w-xl"
                : "max-w-sm"
            }`}
          >
            <div className="rounded-2xl border border-border bg-white shadow-lg shadow-navy/5 overflow-hidden">
              {/* Window Bar */}
              <div className="flex items-center justify-between border-b border-border bg-[#F9FAFB] px-4 py-2.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono text-[11px] text-text-tertiary">
                    openpost-editor.tsx
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Autosaved
                  </span>
                  <span className="text-text-tertiary">|</span>
                  <span className="text-text-secondary font-mono">1,480 words</span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 border-b border-border bg-white px-4 py-2 text-xs text-text-secondary">
                {["B", "I", "U", "S"].map((f) => (
                  <button
                    key={f}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-dim font-bold hover:bg-surface-raised"
                  >
                    {f}
                  </button>
                ))}
                <div className="h-3.5 w-px bg-border mx-1" />
                {["H1", "H2", "H3"].map((h) => (
                  <button
                    key={h}
                    className="rounded-md bg-surface-dim px-2 py-0.5 text-[10px] font-semibold hover:bg-surface-raised"
                  >
                    {h}
                  </button>
                ))}
                <div className="h-3.5 w-px bg-border mx-1" />
                {["List", "Quote", "Table", "Code", "Poll"].map((item) => (
                  <button
                    key={item}
                    className="rounded-md bg-surface-dim px-2 py-0.5 text-[10px] font-medium hover:bg-brand/10 hover:text-navy"
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Canvas Content */}
              <div className="min-h-[380px] p-6 bg-white">
                {activeTab === "visual" ? (
                  <div className="space-y-4">
                    {/* Small thumbnail preview banner */}
                    <div className="flex items-center gap-4 rounded-xl border border-border bg-[#FCFCF9] p-3">
                      <div className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border border-border">
                        <Image
                          src="/images/editor_showcase_3d.jpg"
                          alt="Editor Preview"
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-navy">Tiptap ProseMirror Engine</p>
                        <p className="text-[11px] text-text-tertiary truncate">
                          Zero XSS vulnerabilities · Structured AST output · 60fps typing
                        </p>
                      </div>
                    </div>

                    {/* Heading */}
                    {enabledBlocks.heading && (
                      <h1 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                        Crafting High-Performance Content with OpenPost
                      </h1>
                    )}

                    {/* Paragraph */}
                    {enabledBlocks.paragraph && (
                      <p className="text-sm leading-relaxed text-text-secondary">
                        Modern content creators demand extreme performance, instant autosaving,
                        and frictionless publishing. OpenPost stores every document as validated,
                        versioned JSON nodes — eliminating raw HTML vulnerabilities.
                      </p>
                    )}

                    {/* SEO Callout */}
                    {enabledBlocks.callout && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-emerald-900">
                              Lighthouse SEO 100/100 Validated
                            </h4>
                            <p className="mt-0.5 text-[11px] text-emerald-800 leading-relaxed">
                              OpenGraph metadata, Schema.org JSON-LD, and WebP media variants ready.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Code Block in 100% Light Mode */}
                    {enabledBlocks.code && (
                      <div className="overflow-hidden rounded-xl border border-border bg-[#F3F4F6] p-3.5">
                        <div className="flex items-center justify-between border-b border-border pb-1.5 mb-2">
                          <span className="text-[11px] font-mono text-brand font-bold">typescript</span>
                          <span className="text-[10px] text-text-tertiary font-mono">CODE_BLOCK</span>
                        </div>
                        <pre className="overflow-x-auto text-[11px] font-mono text-navy leading-relaxed">
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
                            <BarChart3 className="h-3.5 w-3.5 text-brand" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">
                              Reader Poll Widget
                            </span>
                          </div>
                          <span className="text-[10px] text-text-tertiary font-mono">
                            {totalVotes} Votes
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
                                  <span className="text-navy flex items-center gap-1.5">
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
                  </div>
                ) : (
                  /* JSON AST Tab */
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                      <span className="text-xs font-mono text-text-tertiary">Schema: openpost/ast/v1.4</span>
                      <button
                        onClick={copyJson}
                        className="flex items-center gap-1 rounded-md bg-surface-dim border border-border px-2.5 py-1 text-xs font-semibold text-navy hover:bg-surface-raised"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy JSON"}
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-[11px] font-mono text-navy leading-relaxed max-h-72 p-2 bg-[#F9FAFB] rounded-lg border border-border">
                      <code>{JSON.stringify(generatedJson, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
