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
  Table,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const categories = ["All", "Typography", "Media", "Interactive", "Layout & SEO"];

const blockItems = [
  { name: "Rich Paragraph", desc: "Markdown formatting, highlights & inline links", cat: "Typography", icon: FileText, tag: "text" },
  { name: "Dynamic Heading", desc: "H1–H4 with automatic slug anchor IDs", cat: "Typography", icon: PanelTop, tag: "heading" },
  { name: "WebP / AVIF Image", desc: "Responsive 5 layout modes + caption & zoom", cat: "Media", icon: ImageIcon, tag: "image" },
  { name: "Media Gallery", desc: "Fluid masonry grid & responsive carousels", cat: "Media", icon: LayoutGrid, tag: "gallery" },
  { name: "Syntax Code Block", desc: "Prism syntax highlighting across 45+ languages", cat: "Interactive", icon: Terminal, tag: "codeBlock" },
  { name: "Interactive Poll", desc: "Real-time voting with instant result graphs", cat: "Interactive", icon: BarChart3, tag: "poll" },
  { name: "Editorial Callout", desc: "Warning, Info, Success & Error highlight alerts", cat: "Typography", icon: Sparkles, tag: "callout" },
  { name: "Data Table", desc: "Cell formatting, sticky headers & CSV export", cat: "Layout & SEO", icon: Table, tag: "table" },
  { name: "Blockquote & Citation", desc: "Stylized typography quotes with author avatar", cat: "Typography", icon: MessageSquare, tag: "blockquote" },
  { name: "Schema.org FAQ", desc: "Collapsible accordion with Google FAQ Schema", cat: "Layout & SEO", icon: ListTree, tag: "faq" },
  { name: "Responsive Embed", desc: "YouTube, Vimeo, Twitter, Figma & Spotify", cat: "Media", icon: Globe, tag: "embed" },
  { name: "Action Button CTA", desc: "Primary, Secondary, and Glowing action triggers", cat: "Interactive", icon: ArrowUpRight, tag: "button" },
  { name: "Download Asset", desc: "File card with size, extension badge & counter", cat: "Media", icon: Download, tag: "download" },
  { name: "Accordion Drawer", desc: "Expandable disclosure for dense information", cat: "Layout & SEO", icon: Layers, tag: "accordion" },
  { name: "Video Player", desc: "Custom HTML5 video with poster & autoplay options", cat: "Media", icon: Play, tag: "video" },
  { name: "Section Divider", desc: "Decorative gradient horizontal rules and spacers", cat: "Layout & SEO", icon: PanelTop, tag: "divider" },
];

export function BlockShowcase3D() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredBlocks =
    activeCategory === "All"
      ? blockItems
      : blockItems.filter((b) => b.cat === activeCategory);

  return (
    <section id="blocks" className="bg-[#FAF9F5] py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              16+ Content Blocks
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Every content element ready out of the box.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Each block type renders with 100% fidelity across editor, preview, and public blog.
            </p>

            {/* Category Filter Pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-navy text-white shadow-xs scale-105"
                      : "border border-border bg-white text-text-secondary hover:text-navy hover:bg-surface-dim hover:scale-102"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Blocks Grid with Staggered Entrance */}
        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto" stagger={0.04}>
          {filteredBlocks.map((block) => (
            <StaggerItem key={block.name}>
              <div
                className="pro-card rounded-xl border border-border bg-white p-4 shadow-xs hover:border-brand/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-dim text-navy border border-border transition-transform group-hover:scale-110">
                    <block.icon className="h-4 w-4 text-brand" />
                  </div>
                  <span className="font-mono text-[10px] text-text-tertiary bg-surface-dim px-2 py-0.5 rounded-md border border-border">
                    /{block.tag}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold text-navy">{block.name}</h3>
                <p className="mt-1 text-xs text-text-secondary leading-relaxed">{block.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
