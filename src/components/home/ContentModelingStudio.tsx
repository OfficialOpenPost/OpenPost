"use client";

import { useState } from "react";
import {
  Database,
  Code2,
  Layers,
  FileText,
  User,
  FolderTree,
  Image as ImageIcon,
  Check,
  Copy,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

interface SchemaModel {
  id: string;
  name: string;
  description: string;
  icon: any;
  fields: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    badge?: string;
  }>;
  tsDefinition: string;
  jsonExample: Record<string, any>;
}

const schemas: SchemaModel[] = [
  {
    id: "article",
    name: "Article & Post",
    description: "Structured blog post model with Tiptap AST nodes, taxonomy relations, and SEO metadata.",
    icon: FileText,
    fields: [
      { name: "id", type: "UUID", description: "Unique immutable entity identifier", required: true },
      { name: "title", type: "String", description: "H1 article title", required: true },
      { name: "slug", type: "Slug", description: "SEO-safe URL slug with collision detection", required: true, badge: "Unique" },
      { name: "content", type: "JSONB (AST)", description: "Type-safe ProseMirror document nodes", required: true, badge: "Safe AST" },
      { name: "status", type: "Enum", description: "draft | published | scheduled | trash", required: true },
      { name: "authorId", type: "Reference<Author>", description: "Linked public byline author", required: false },
      { name: "categoryId", type: "Reference<Category>", description: "Primary taxonomy classification", required: false },
      { name: "seo", type: "JSONB", description: "OpenGraph, Twitter card, & Schema.org JSON-LD", required: false },
    ],
    tsDefinition: `export interface OpenPostArticle {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "scheduled" | "trash";
  content: TiptapDocumentJSON;
  wordCount: number;
  readingTime: number;
  publishedAt: string | null;
  scheduledAt: string | null;
  author?: {
    id: string;
    name: string;
    slug: string;
    avatarUrl?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  featuredImage?: {
    id: string;
    variants: {
      publicUrl: string;
      webp?: { url: string };
    };
  };
}`,
    jsonExample: {
      id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      title: "Building Modern Publishing Workflows with Next.js 16 & OpenPost",
      slug: "modern-publishing-nextjs-16",
      status: "published",
      wordCount: 1420,
      readingTime: 6,
      publishedAt: "2026-09-01T12:00:00.000Z",
      category: {
        id: "cat_engineering_01",
        name: "Engineering",
        slug: "engineering",
      },
      author: {
        id: "auth_sarah_chen",
        name: "Sarah Chen",
        slug: "sarah-chen",
      },
    },
  },
  {
    id: "author",
    name: "Author & Byline",
    description: "Public byline profile with bio, avatar image relation, and social handles.",
    icon: User,
    fields: [
      { name: "id", type: "UUID", description: "Unique author profile identifier", required: true },
      { name: "name", type: "String", description: "Public display name on articles", required: true },
      { name: "slug", type: "Slug", description: "Author byline URL (/authors/[slug])", required: true, badge: "Unique" },
      { name: "bio", type: "Text", description: "Short markdown author biography", required: false },
      { name: "photoId", type: "Reference<Media>", description: "Linked avatar image in Media Library", required: false },
      { name: "socialLinks", type: "JSONB", description: "Twitter, GitHub, LinkedIn, Website URLs", required: false },
      { name: "linkedUserId", type: "Reference<User>", description: "Optional link to dashboard login account", required: false },
    ],
    tsDefinition: `export interface OpenPostAuthor {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  photo?: {
    publicUrl: string;
    webpUrl?: string;
  };
  _count: {
    blogs: number;
  };
}`,
    jsonExample: {
      id: "auth_sarah_chen",
      name: "Sarah Chen",
      slug: "sarah-chen",
      bio: "Content Systems Lead at NextFlow Media. Writing about headless architectures and edge performance.",
      socialLinks: {
        twitter: "https://twitter.com/sarahchen",
        github: "https://github.com/sarahchen",
      },
      _count: {
        blogs: 14,
      },
    },
  },
  {
    id: "media",
    name: "Media Asset Pipeline",
    description: "Cloudflare R2 zero-egress asset storage with automatic WebP conversion and EXIF stripping.",
    icon: ImageIcon,
    fields: [
      { name: "id", type: "UUID", description: "Media record identifier", required: true },
      { name: "originalFilename", type: "String", description: "Original uploaded filename", required: true },
      { name: "mimeType", type: "MIME", description: "Validated format (WebP, PNG, JPEG, AVIF)", required: true, badge: "Magic Bytes" },
      { name: "sizeBytes", type: "BigInt", description: "Exact file size in bytes", required: true },
      { name: "variants", type: "JSONB", description: "Auto-generated WebP and optimized CDN URLs", required: true },
      { name: "checksum", type: "SHA-256", description: "Content digest for deduplication", required: true },
    ],
    tsDefinition: `export interface OpenPostMediaAsset {
  id: string;
  originalFilename: string;
  mimeType: "image/webp" | "image/png" | "image/jpeg" | "image/avif" | "application/pdf";
  sizeBytes: number;
  variants: {
    publicUrl: string;
    key: string;
    webp?: { url: string; size?: number };
  };
  checksum: string;
  altTextDefault?: string;
  createdAt: string;
}`,
    jsonExample: {
      id: "med_98f12a",
      originalFilename: "architecture-diagram.png",
      mimeType: "image/webp",
      sizeBytes: 84210,
      variants: {
        publicUrl: "https://assets.openpost.app/openpost-media/arch-diagram.webp",
        webp: {
          url: "https://assets.openpost.app/openpost-media/arch-diagram.webp",
          size: 84210,
        },
      },
      altTextDefault: "OpenPost Cloud Architecture Diagram",
    },
  },
];

export function ContentModelingStudio() {
  const [activeSchema, setActiveSchema] = useState<SchemaModel>(schemas[0]);
  const [activeTab, setActiveTab] = useState<"fields" | "typescript" | "json">("fields");
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    const text = activeTab === "typescript" ? activeSchema.tsDefinition : JSON.stringify(activeSchema.jsonExample, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="content-model" className="bg-[#FAF9F5] py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Structured Content Engine
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Schema-driven content modeling.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-secondary">
              Just like Sanity and Strapi — define flexible, type-safe content models visually or in code, served instantly over global edge REST APIs.
            </p>
          </div>
        </FadeIn>

        {/* Schema Model Selector */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
          {schemas.map((s) => {
            const isSelected = activeSchema.id === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSchema(s)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
                  isSelected
                    ? "bg-navy text-white shadow-navy/10 scale-105"
                    : "border border-border bg-white text-text-secondary hover:text-navy hover:bg-surface-raised"
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? "text-brand" : "text-text-tertiary"}`} />
                {s.name}
              </button>
            );
          })}
        </div>

        {/* Interactive Schema Viewer Card */}
        <div className="mt-8 mx-auto max-w-5xl rounded-2xl border border-border bg-white shadow-lg shadow-navy/5 overflow-hidden">
          {/* Card Header & Tabs */}
          <div className="flex flex-wrap items-center justify-between border-b border-border bg-[#F9FAFB] px-5 py-3 gap-3">
            <div>
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <activeSchema.icon className="h-4 w-4 text-brand" />
                <span>{activeSchema.name} Schema Definition</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">{activeSchema.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-surface-dim p-0.5 border border-border text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("fields")}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === "fields" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                  }`}
                >
                  Fields &amp; Types
                </button>
                <button
                  onClick={() => setActiveTab("typescript")}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === "typescript" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                  }`}
                >
                  TypeScript
                </button>
                <button
                  onClick={() => setActiveTab("json")}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === "json" ? "bg-brand text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                  }`}
                >
                  REST Payload
                </button>
              </div>

              {activeTab !== "fields" && (
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-navy hover:bg-surface-raised transition shadow-xs"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: Visual Fields List */}
          {activeTab === "fields" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-[#FCFCF9] text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                    <th className="py-3 px-5">Field Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {activeSchema.fields.map((f) => (
                    <tr key={f.name} className="hover:bg-[#FAF9F5] transition">
                      <td className="py-3 px-5 font-mono font-bold text-navy">
                        {f.name}
                        {f.badge && (
                          <span className="ml-2 rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold text-navy">
                            {f.badge}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-surface-dim border border-border px-2 py-0.5 font-mono text-[11px] text-text-secondary font-semibold">
                          {f.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{f.description}</td>
                      <td className="py-3 px-4 text-center">
                        {f.required ? (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-text-tertiary text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: TypeScript Types */}
          {activeTab === "typescript" && (
            <div className="p-5 bg-white">
              <pre className="overflow-x-auto text-xs font-mono text-navy leading-relaxed max-h-96 rounded-xl border border-border bg-[#F9FAFB] p-4">
                <code>{activeSchema.tsDefinition}</code>
              </pre>
            </div>
          )}

          {/* Tab 3: JSON Payload */}
          {activeTab === "json" && (
            <div className="p-5 bg-white">
              <pre className="overflow-x-auto text-xs font-mono text-navy leading-relaxed max-h-96 rounded-xl border border-border bg-[#F9FAFB] p-4">
                <code>{JSON.stringify(activeSchema.jsonExample, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>

        {/* 3 Value Pillars */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-5xl mx-auto">
          <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-navy font-bold text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Strict Schema Validation
            </div>
            <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
              Zod &amp; Prisma schema guards on every mutation. Clean input sanitization with zero XSS vulnerabilities.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-navy font-bold text-xs">
              <Zap className="h-4 w-4 text-brand" />
              Type-Safe API Consumption
            </div>
            <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
              Generate TypeScript definitions directly from your CMS project. Full end-to-end autocomplete in Next.js &amp; Astro.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-navy font-bold text-xs">
              <Database className="h-4 w-4 text-[#FE4F01]" />
              Multi-Tenant Isolation
            </div>
            <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
              Every content model is isolated by project workspace with canonical 5-tier RBAC and audit logging.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
