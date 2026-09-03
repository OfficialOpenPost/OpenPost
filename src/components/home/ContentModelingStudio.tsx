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
  CheckCircle2,
  Copy,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { FadeIn } from "@/components/motion";

interface SchemaModel {
  id: string;
  name: string;
  endpoint: string;
  description: string;
  icon: any;
  fieldCount: number;
  fields: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    badge?: string;
  }>;
  tsDefinition: string;
  prismaDefinition: string;
}

const schemas: SchemaModel[] = [
  {
    id: "article",
    name: "Article Post",
    endpoint: "GET /api/v1/posts",
    description: "Structured document model with ProseMirror AST nodes, author relations, and SEO metadata.",
    icon: FileText,
    fieldCount: 8,
    fields: [
      { name: "id", type: "UUID", description: "Immutable primary entity identifier", required: true },
      { name: "title", type: "String", description: "H1 article title", required: true },
      { name: "slug", type: "Slug", description: "SEO-safe URL slug with collision detection", required: true, badge: "Unique" },
      { name: "content", type: "JSONB", description: "Safe ProseMirror AST document tree", required: true, badge: "Type-Safe AST" },
      { name: "status", type: "Enum", description: "draft | published | scheduled | trash", required: true },
      { name: "authorId", type: "Relation<Author>", description: "Linked public byline author", required: false },
      { name: "categoryId", type: "Relation<Category>", description: "Primary nested taxonomy classification", required: false },
      { name: "seo", type: "JSONB", description: "OpenGraph, Twitter card, & Schema.org JSON-LD", required: false },
    ],
    tsDefinition: `export interface OpenPostArticle {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "scheduled" | "trash";
  content: TiptapDocumentJSON;
  author?: {
    id: string;
    name: string;
    slug: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}`,
    prismaDefinition: `model Blog {
  id          String       @id @default(uuid())
  title       String
  slug        String
  content     Json         // ProseMirror AST
  status      BlogStatus   @default(DRAFT)
  projectId   String
  authorId    String?
  categoryId  String?
  project     Project      @relation(fields: [projectId], references: [id])
  author      Author?      @relation(fields: [authorId], references: [id])
  category    Category?    @relation(fields: [categoryId], references: [id])
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([projectId, slug])
}`,
  },
  {
    id: "author",
    name: "Author Byline",
    endpoint: "GET /api/v1/authors",
    description: "Public byline profile with bio, avatar image relation, and social handles.",
    icon: User,
    fieldCount: 7,
    fields: [
      { name: "id", type: "UUID", description: "Unique author profile identifier", required: true },
      { name: "name", type: "String", description: "Public display name on articles", required: true },
      { name: "slug", type: "Slug", description: "Author byline URL (/authors/[slug])", required: true, badge: "Unique" },
      { name: "bio", type: "Text", description: "Short markdown biography", required: false },
      { name: "photoId", type: "Relation<Media>", description: "Linked avatar in Media Library", required: false },
      { name: "socialLinks", type: "JSONB", description: "Twitter, GitHub, LinkedIn URLs", required: false },
      { name: "linkedUserId", type: "Relation<User>", description: "Optional link to dashboard user", required: false },
    ],
    tsDefinition: `export interface OpenPostAuthor {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  socialLinks?: Record<string, string>;
  photo?: {
    publicUrl: string;
    webpUrl?: string;
  };
  _count: {
    blogs: number;
  };
}`,
    prismaDefinition: `model Author {
  id           String    @id @default(uuid())
  name         String
  slug         String
  bio          String?
  projectId    String
  linkedUserId String?
  blogs        Blog[]
  project      Project   @relation(fields: [projectId], references: [id])

  @@unique([projectId, slug])
}`,
  },
  {
    id: "media",
    name: "Media Asset",
    endpoint: "GET /api/v1/media",
    description: "Cloudflare R2 zero-egress asset storage with automatic WebP conversion.",
    icon: ImageIcon,
    fieldCount: 6,
    fields: [
      { name: "id", type: "UUID", description: "Media record identifier", required: true },
      { name: "originalFilename", type: "String", description: "Original uploaded filename", required: true },
      { name: "mimeType", type: "MIME", description: "Validated format (WebP, PNG, JPEG, AVIF)", required: true, badge: "Magic Bytes" },
      { name: "sizeBytes", type: "BigInt", description: "Exact file size in bytes", required: true },
      { name: "variants", type: "JSONB", description: "Auto-generated WebP & CDN URLs", required: true },
      { name: "checksum", type: "SHA-256", description: "Content digest for deduplication", required: true },
    ],
    tsDefinition: `export interface OpenPostMedia {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
  variants: {
    webp?: { url: string; sizeBytes: number };
    thumbnail?: { url: string };
  };
}`,
    prismaDefinition: `model Media {
  id               String   @id @default(uuid())
  originalFilename String
  mimeType         String
  sizeBytes        Int
  storageKey       String
  checksum         String
  projectId        String
  project          Project  @relation(fields: [projectId], references: [id])
  createdAt        DateTime @default(now())
}`,
  },
  {
    id: "category",
    name: "Taxonomy Tree",
    endpoint: "GET /api/v1/categories",
    description: "Hierarchical category trees and tags with slug collision prevention.",
    icon: FolderTree,
    fieldCount: 5,
    fields: [
      { name: "id", type: "UUID", description: "Unique category identifier", required: true },
      { name: "name", type: "String", description: "Category display title", required: true },
      { name: "slug", type: "Slug", description: "Category URL slug (/category/[slug])", required: true, badge: "Unique" },
      { name: "parentId", type: "Relation<Category>", description: "Self-referencing tree relation", required: false },
      { name: "postCount", type: "Computed", description: "Live count of published articles", required: true },
    ],
    tsDefinition: `export interface OpenPostCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: OpenPostCategory[];
  _count: {
    blogs: number;
  };
}`,
    prismaDefinition: `model Category {
  id        String     @id @default(uuid())
  name      String
  slug      String
  parentId  String?
  parent    Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  blogs     Blog[]
  projectId String

  @@unique([projectId, slug])
}`,
  },
];

export function ContentModelingStudio() {
  const [activeSchema, setActiveSchema] = useState(schemas[0]);
  const [activeView, setActiveView] = useState<"fields" | "typescript" | "prisma">("fields");
  const [copied, setCopied] = useState(false);

  const copyDefinition = () => {
    const code = activeView === "typescript" ? activeSchema.tsDefinition : activeSchema.prismaDefinition;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="content-model" className="bg-[#FAF9F5] py-16 sm:py-24 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12 items-center">
          {/* LEFT SIDE: Interactive Schema Card */}
          <div className="lg:col-span-7">
            <div className="card-glass-specular rounded-2xl overflow-hidden shadow-2xl shadow-navy/10 border border-border bg-white">
              {/* Card Window Titlebar */}
              <div className="flex flex-wrap items-center justify-between border-b border-border bg-[#F9FAFB] px-4 py-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-1 text-xs font-mono font-bold text-navy">
                    openpost.schema/{activeSchema.id}
                  </span>
                  <span className="rounded bg-brand/15 px-2 py-0.5 text-[10px] font-mono font-bold text-navy hidden sm:inline-block">
                    {activeSchema.endpoint}
                  </span>
                </div>

                {/* View Mode Toggle & Copy */}
                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-lg bg-surface-dim p-0.5 border border-border text-xs font-semibold">
                    <button
                      onClick={() => setActiveView("fields")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeView === "fields" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                      }`}
                    >
                      Fields
                    </button>
                    <button
                      onClick={() => setActiveView("typescript")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeView === "typescript" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                      }`}
                    >
                      TypeScript
                    </button>
                    <button
                      onClick={() => setActiveView("prisma")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        activeView === "prisma" ? "bg-white text-navy shadow-xs font-bold" : "text-text-tertiary hover:text-navy"
                      }`}
                    >
                      Prisma
                    </button>
                  </div>

                  {activeView !== "fields" && (
                    <button
                      onClick={copyDefinition}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-navy hover:bg-surface-raised transition shadow-xs"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body: Data / Code View */}
              <div className="p-4 sm:p-6 bg-white min-h-[380px] flex flex-col justify-between">
                {activeView === "fields" && (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border text-[11px] font-bold text-text-tertiary uppercase tracking-wider pb-2">
                          <th className="py-2 px-3">Field</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Description</th>
                          <th className="py-2 px-3 text-center">Required</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {activeSchema.fields.map((f) => (
                          <tr key={f.name} className="hover:bg-[#FAF9F5] transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-navy">
                              {f.name}
                              {f.badge && (
                                <span className="ml-1.5 rounded bg-brand/15 px-1.5 py-0.2 text-[10px] font-bold text-navy">
                                  {f.badge}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="rounded bg-surface-dim border border-border px-1.5 py-0.5 font-mono text-[11px] text-text-secondary font-semibold">
                                {f.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-text-secondary leading-tight">
                              {f.description}
                            </td>
                            <td className="py-2.5 px-3 text-center">
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

                {activeView === "typescript" && (
                  <div className="h-full">
                    <pre className="overflow-x-auto custom-scrollbar text-xs font-mono text-navy leading-relaxed p-4 bg-[#F9FAFB] rounded-xl border border-border h-full max-h-80">
                      <code>{activeSchema.tsDefinition}</code>
                    </pre>
                  </div>
                )}

                {activeView === "prisma" && (
                  <div className="h-full">
                    <pre className="overflow-x-auto custom-scrollbar text-xs font-mono text-navy leading-relaxed p-4 bg-[#F9FAFB] rounded-xl border border-border h-full max-h-80">
                      <code>{activeSchema.prismaDefinition}</code>
                    </pre>
                  </div>
                )}

                {/* Bottom Card Telemetry */}
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-tertiary">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <Check className="h-3.5 w-3.5" /> Zod Validated
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-navy">
                      <Zap className="h-3.5 w-3.5 text-brand" /> Type-Safe JSONB
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-text-secondary">
                      <Database className="h-3.5 w-3.5 text-navy" /> PostgreSQL Native
                    </span>
                  </div>
                  <span className="font-mono text-text-tertiary">
                    Schema v1.4
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Clean Editorial Text Content (No Outer Card) */}
          <div className="lg:col-span-5 space-y-6">
            <FadeIn>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-bold text-navy">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span>Structured Content Engine</span>
              </div>

              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-navy tracking-tight leading-tight">
                Schema-driven content modeling.
              </h2>

              <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
                Just like Sanity and Strapi — define flexible, type-safe content models visually or in code, served instantly over global edge REST APIs.
              </p>

              {/* Interactive Model Selector Buttons */}
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary font-mono mb-2.5">
                  Select Model to Preview:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {schemas.map((s) => {
                    const isSelected = activeSchema.id === s.id;
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveSchema(s)}
                        className={`flex items-center justify-between rounded-xl p-2.5 text-left text-xs font-bold transition ${
                          isSelected
                            ? "bg-navy text-white shadow-md shadow-navy/15 scale-[1.02]"
                            : "border border-border bg-white text-navy hover:bg-surface-raised"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? "text-brand" : "text-text-tertiary"}`} />
                          <span>{s.name}</span>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                            isSelected ? "bg-white/20 text-white" : "bg-surface-dim text-text-tertiary"
                          }`}
                        >
                          {s.fieldCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Schema Focus Note */}
              <div className="mt-5 p-3.5 rounded-xl border border-border bg-white text-xs">
                <p className="font-bold text-navy flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{activeSchema.name} Overview</span>
                </p>
                <p className="mt-1 text-text-secondary leading-relaxed text-[11px]">
                  {activeSchema.description}
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="mt-5 space-y-2 pt-2 border-t border-border text-xs text-navy font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Zod runtime schema validation on every mutation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Auto-generated TypeScript interfaces for Next.js &amp; Astro</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Zero-lockin native PostgreSQL schema migrations with Prisma</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
