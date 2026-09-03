"use client";

import { useState } from "react";
import {
  FileText,
  PanelTop,
  Image as ImageIcon,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  BarChart3,
  Terminal,
  Globe,
  ListTree,
  ArrowUpRight,
  Download,
  Layers,
  Play,
  Table as TableIcon,
  Check,
  Copy,
  ChevronDown,
  Info,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { FadeIn } from "@/components/motion";

const categories = ["All", "Typography", "Media", "Interactive", "Layout & SEO"];

interface BlockItem {
  name: string;
  desc: string;
  cat: string;
  icon: any;
  tag: string;
  defaultJson: Record<string, any>;
}

const blockItems: BlockItem[] = [
  {
    name: "Interactive Poll",
    desc: "Real-time voting with instant percentage distribution graphs",
    cat: "Interactive",
    icon: BarChart3,
    tag: "poll",
    defaultJson: {
      type: "poll",
      attrs: {
        question: "What is your primary publishing frontend?",
        options: [
          { id: "next", label: "Next.js 15 / 16 (App Router)" },
          { id: "astro", label: "Astro Island Architecture" },
          { id: "remix", label: "Remix / React Router 7" },
        ],
      },
    },
  },
  {
    name: "Syntax Code Block",
    desc: "Syntax highlighting with line numbering and copy action",
    cat: "Interactive",
    icon: Terminal,
    tag: "codeBlock",
    defaultJson: {
      type: "codeBlock",
      attrs: { language: "typescript" },
      content: [{ type: "text", text: `const post = await openpost.posts.get("modern-web");\nconsole.log(post.readingTime);` }],
    },
  },
  {
    name: "Editorial Callout",
    desc: "Highlighted insight alert with custom severity variants",
    cat: "Typography",
    icon: Sparkles,
    tag: "callout",
    defaultJson: {
      type: "callout",
      attrs: { variant: "info", title: "Pro Tip" },
      content: [{ type: "text", text: "OpenPost strips malicious scripts at the AST boundary to guarantee safe rendering." }],
    },
  },
  {
    name: "Schema.org FAQ",
    desc: "Collapsible disclosure drawer that automatically synthesizes Google FAQ Schema",
    cat: "Layout & SEO",
    icon: ListTree,
    tag: "faq",
    defaultJson: {
      type: "faqItem",
      attrs: {
        question: "Does OpenPost support self-hosting?",
        answer: "Yes, OpenPost is 100% open source under the MIT License and can be run via Docker or Node.",
      },
    },
  },
  {
    name: "Dynamic Heading",
    desc: "H1–H4 with automatic slug anchor IDs for table of contents",
    cat: "Typography",
    icon: PanelTop,
    tag: "heading",
    defaultJson: {
      type: "heading",
      attrs: { level: 2, id: "structured-content-pipelines" },
      content: [{ type: "text", text: "Structured Content Pipelines at Global Scale" }],
    },
  },
  {
    name: "Rich Paragraph",
    desc: "Markdown formatting, typographic hierarchy, and inline link annotations",
    cat: "Typography",
    icon: FileText,
    tag: "paragraph",
    defaultJson: {
      type: "paragraph",
      content: [
        { type: "text", text: "Articles are composed of modular nodes that can be safely transformed into " },
        { type: "text", marks: [{ type: "bold" }], text: "React Server Components" },
        { type: "text", text: " or static HTML." },
      ],
    },
  },
  {
    name: "Data Table",
    desc: "Multi-column structured data with sticky headers and cell formatting",
    cat: "Layout & SEO",
    icon: TableIcon,
    tag: "table",
    defaultJson: {
      type: "table",
      content: [
        { type: "tableRow", content: [{ type: "tableHeader", content: [{ type: "text", text: "Framework" }] }, { type: "tableHeader", content: [{ type: "text", text: "Support" }] }] },
        { type: "tableRow", content: [{ type: "tableCell", content: [{ type: "text", text: "Next.js" }] }, { type: "tableCell", content: [{ type: "text", text: "Native RSC" }] }] },
      ],
    },
  },
  {
    name: "Blockquote & Citation",
    desc: "Stylized editorial pull quote with author byline",
    cat: "Typography",
    icon: MessageSquare,
    tag: "blockquote",
    defaultJson: {
      type: "blockquote",
      attrs: { author: "OpenPost Architecture Guide" },
      content: [{ type: "text", text: "Great content systems treat words as structured data, not raw markup strings." }],
    },
  },
  {
    name: "Action Button CTA",
    desc: "Primary, secondary, and outbound button action triggers",
    cat: "Interactive",
    icon: ArrowUpRight,
    tag: "button",
    defaultJson: {
      type: "button",
      attrs: { text: "Start Reading", url: "/blog", variant: "primary" },
    },
  },
];

export function BlockShowcase3D() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedBlock, setSelectedBlock] = useState<BlockItem>(blockItems[0]);
  const [viewMode, setViewMode] = useState<"render" | "json">("render");
  const [copied, setCopied] = useState(false);

  // Poll state inside playground
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({ next: 142, astro: 89, remix: 44 });
  const [votedOption, setVotedOption] = useState<string | null>(null);

  // FAQ state inside playground
  const [faqOpen, setFaqOpen] = useState(true);

  // Callout variant inside playground
  const [calloutVariant, setCalloutVariant] = useState<"info" | "warning" | "success">("info");

  const filteredBlocks =
    activeCategory === "All"
      ? blockItems
      : blockItems.filter((b) => b.cat === activeCategory);

  const handleVote = (id: string) => {
    if (votedOption) return;
    setVotedOption(id);
    setPollVotes((prev) => ({ ...prev, [id]: prev[id] + 1 }));
  };

  const totalPollVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedBlock.defaultJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="blocks" className="bg-[#FAF9F5] py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Content Block Playground
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Modular blocks for modern publishing.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Click any block type below to test live rendering and inspect its structured JSON AST schema.
            </p>

            {/* Category Filter Pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    activeCategory === cat
                      ? "bg-navy text-white shadow-xs"
                      : "border border-border bg-white text-text-secondary hover:text-navy hover:bg-surface-dim"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* 2-Column Playground Layout: Block List (Left) + Interactive Live Canvas (Right) */}
        <div className="mt-10 grid gap-6 lg:grid-cols-12 max-w-6xl mx-auto items-start">
          {/* Left Column: Block Selection Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[560px] overflow-y-auto custom-scrollbar pr-1">
            {filteredBlocks.map((block) => {
              const isSelected = selectedBlock.tag === block.tag;
              const IconComponent = block.icon;
              return (
                <button
                  key={block.name}
                  onClick={() => setSelectedBlock(block)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                    isSelected
                      ? "bg-white border-brand shadow-md shadow-brand/10 ring-1 ring-brand/30"
                      : "bg-white/80 border-border hover:bg-white hover:border-border-hover shadow-xs"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                      isSelected ? "bg-brand text-white" : "bg-surface-dim text-navy border border-border"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-navy truncate">{block.name}</h4>
                      <span className="font-mono text-[10px] text-text-tertiary bg-surface-dim px-1.5 py-0.5 rounded border border-border shrink-0">
                        /{block.tag}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                      {block.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Live Interactive Canvas Frame */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-white shadow-xl shadow-navy/5 overflow-hidden sticky top-20">
            {/* Top Bar with Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between border-b border-border bg-[#F9FAFB] px-4 py-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-xs font-bold text-navy">
                  Canvas Preview — <span className="text-brand">/{selectedBlock.tag}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setViewMode("render")}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    viewMode === "render"
                      ? "bg-navy text-white"
                      : "text-text-secondary hover:bg-surface-raised"
                  }`}
                >
                  Live Render
                </button>
                <button
                  onClick={() => setViewMode("json")}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    viewMode === "json"
                      ? "bg-navy text-white"
                      : "text-text-secondary hover:bg-surface-raised"
                  }`}
                >
                  JSON AST
                </button>
              </div>
            </div>

            {/* Canvas Body */}
            <div className="p-6 min-h-[360px] flex flex-col justify-center bg-white relative">
              {viewMode === "render" ? (
                <div className="w-full max-w-lg mx-auto">
                  {/* POLL DEMO */}
                  {selectedBlock.tag === "poll" && (
                    <div className="rounded-xl border border-border bg-[#FAF9F5] p-5 shadow-xs">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                        <span className="font-bold text-navy flex items-center gap-1.5">
                          <BarChart3 className="h-4 w-4 text-[#FE4F01]" /> Interactive Community Poll
                        </span>
                        <span className="text-text-tertiary font-mono">{totalPollVotes} votes</span>
                      </div>
                      <h4 className="mt-3 text-sm font-bold text-navy leading-snug">
                        {selectedBlock.defaultJson.attrs.question}
                      </h4>
                      <div className="mt-4 space-y-2">
                        {selectedBlock.defaultJson.attrs.options.map((opt: any) => {
                          const count = pollVotes[opt.id] ?? 0;
                          const pct = Math.round((count / totalPollVotes) * 100);
                          const isVoted = votedOption === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleVote(opt.id)}
                              className={`relative w-full overflow-hidden rounded-lg border p-2.5 text-left text-xs transition ${
                                isVoted
                                  ? "border-brand bg-brand/10 font-bold text-navy"
                                  : "border-border bg-white hover:bg-surface-raised text-text-primary"
                              }`}
                            >
                              <div
                                className="absolute inset-y-0 left-0 bg-brand/15 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                              <div className="relative flex items-center justify-between">
                                <span>{opt.label}</span>
                                <span className="font-mono text-[11px] font-bold text-text-secondary">
                                  {pct}%
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CODE BLOCK DEMO */}
                  {selectedBlock.tag === "codeBlock" && (
                    <div className="rounded-xl border border-border bg-[#1E242E] text-white p-4 shadow-xs font-mono text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-white/60">
                        <span className="text-[11px] text-brand font-bold">typescript</span>
                        <span>Read-only AST</span>
                      </div>
                      <pre className="mt-3 overflow-x-auto text-white/90 leading-relaxed">
                        <code>{selectedBlock.defaultJson.content[0].text}</code>
                      </pre>
                    </div>
                  )}

                  {/* EDITORIAL CALLOUT DEMO */}
                  {selectedBlock.tag === "callout" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-text-tertiary">Variant:</span>
                        {(["info", "warning", "success"] as const).map((v) => (
                          <button
                            key={v}
                            onClick={() => setCalloutVariant(v)}
                            className={`rounded px-2 py-0.5 text-[11px] capitalize font-bold transition ${
                              calloutVariant === v
                                ? "bg-navy text-white"
                                : "bg-surface-raised text-text-secondary hover:text-navy"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>

                      <div
                        className={`rounded-xl border p-4 text-xs leading-relaxed flex items-start gap-3 ${
                          calloutVariant === "info"
                            ? "border-blue-200 bg-blue-50/60 text-blue-900"
                            : calloutVariant === "warning"
                            ? "border-amber-200 bg-amber-50/60 text-amber-900"
                            : "border-emerald-200 bg-emerald-50/60 text-emerald-900"
                        }`}
                      >
                        {calloutVariant === "info" && <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />}
                        {calloutVariant === "warning" && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />}
                        {calloutVariant === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />}
                        <div>
                          <p className="font-bold text-sm mb-1 capitalize">{calloutVariant} Notice</p>
                          <p>{selectedBlock.defaultJson.content[0].text}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FAQ DEMO */}
                  {selectedBlock.tag === "faq" && (
                    <div className="rounded-xl border border-border bg-[#FCFCF9] overflow-hidden">
                      <button
                        onClick={() => setFaqOpen(!faqOpen)}
                        className="w-full flex items-center justify-between p-4 text-left font-bold text-navy text-sm hover:bg-surface-raised transition"
                      >
                        <span>{selectedBlock.defaultJson.attrs.question}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${faqOpen ? "rotate-180" : ""}`} />
                      </button>
                      {faqOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-text-secondary leading-relaxed border-t border-border bg-white">
                          <p>{selectedBlock.defaultJson.attrs.answer}</p>
                          <span className="inline-block mt-2 font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            + Schema.org JSON-LD Synthesized
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DYNAMIC HEADING DEMO */}
                  {selectedBlock.tag === "heading" && (
                    <div className="space-y-2">
                      <div className="group flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                          {selectedBlock.defaultJson.content[0].text}
                        </h2>
                        <span className="font-mono text-xs text-brand font-bold opacity-75">
                          #structured-content-pipelines
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        Heading auto-registers an anchor ID in the document outline for quick deep-linking.
                      </p>
                    </div>
                  )}

                  {/* RICH PARAGRAPH DEMO */}
                  {selectedBlock.tag === "paragraph" && (
                    <div className="space-y-2 text-sm text-navy leading-relaxed p-4 rounded-xl bg-surface-dim border border-border">
                      <p>
                        Articles are composed of modular nodes that can be safely transformed into{" "}
                        <strong className="text-brand font-extrabold">React Server Components</strong> or static HTML.
                        No raw markup injection risks.
                      </p>
                    </div>
                  )}

                  {/* DATA TABLE DEMO */}
                  {selectedBlock.tag === "table" && (
                    <div className="overflow-hidden rounded-xl border border-border bg-white text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-dim border-b border-border text-navy font-bold">
                            <th className="p-3">Framework</th>
                            <th className="p-3">Renderer Support</th>
                            <th className="p-3">Edge Cache</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-text-secondary">
                          <tr>
                            <td className="p-3 font-semibold text-navy">Next.js 16</td>
                            <td className="p-3">Native Server Components</td>
                            <td className="p-3 text-emerald-700 font-bold">Global CDN</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold text-navy">Astro</td>
                            <td className="p-3">Zero-JS Hydration</td>
                            <td className="p-3 text-emerald-700 font-bold">Sub-20ms</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* BLOCKQUOTE DEMO */}
                  {selectedBlock.tag === "blockquote" && (
                    <blockquote className="border-l-4 border-brand bg-[#FFFBF5] p-5 rounded-r-xl">
                      <p className="text-sm font-medium italic text-navy leading-relaxed">
                        &ldquo;{selectedBlock.defaultJson.content[0].text}&rdquo;
                      </p>
                      <cite className="block mt-2 text-xs font-bold text-text-secondary not-italic">
                        — {selectedBlock.defaultJson.attrs.author}
                      </cite>
                    </blockquote>
                  )}

                  {/* ACTION BUTTON CTA DEMO */}
                  {selectedBlock.tag === "button" && (
                    <div className="p-6 rounded-xl bg-surface-dim border border-border text-center space-y-3">
                      <p className="text-xs text-text-secondary font-medium">Rendered In-Article CTA Button:</p>
                      <div className="flex justify-center gap-2">
                        <button className="rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-navy-dark transition">
                          Start Reading Free
                        </button>
                        <button className="rounded-xl border border-border bg-white px-5 py-2.5 text-xs font-bold text-navy hover:bg-surface-dim transition">
                          View API Specs
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* JSON AST VIEWER */
                <div className="relative rounded-xl border border-border bg-[#1E242E] text-emerald-400 p-4 font-mono text-xs leading-relaxed overflow-x-auto custom-scrollbar-dark">
                  <button
                    onClick={copyJson}
                    className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 text-white px-2 py-1 text-[11px] font-bold transition"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy JSON"}
                  </button>
                  <pre className="text-white/90">
                    <code>{JSON.stringify(selectedBlock.defaultJson, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

