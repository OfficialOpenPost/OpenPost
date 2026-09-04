export interface DocSearchItem {
  title: string;
  category: string;
  slug: string;
  description: string;
  keywords?: string[];
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const DOCS_SEARCH_INDEX: DocSearchItem[] = [
  // Getting Started
  {
    title: "Overview & Architecture",
    category: "Getting Started",
    slug: "getting-started/overview",
    description: "Core architecture, headless concepts, block AST structure, and technology stack.",
    keywords: ["intro", "architecture", "stack", "nextjs", "supabase", "cloudflare", "prisma", "tiptap"],
  },
  {
    title: "5-Minute Quickstart",
    category: "Getting Started",
    slug: "getting-started/quickstart",
    description: "Get OpenPost running from git clone to first published post in under 5 minutes.",
    keywords: ["install", "setup", "quickstart", "start", "run", "local", "clone"],
  },
  {
    title: "Environment Variables",
    category: "Getting Started",
    slug: "getting-started/environment-variables",
    description: "Complete reference for all environment variables, connection strings, and API secrets.",
    keywords: ["env", "database_url", "r2", "supabase", "cron_secret", "config"],
  },
  // Guides & Setup
  {
    title: "Supabase & Postgres Setup",
    category: "Guides & Setup",
    slug: "supabase-setup",
    description: "Project setup, running migrations 001–017, session pooler :5432, RLS policies, and first admin.",
    keywords: ["supabase", "postgres", "sql", "migrations", "pooler", "rls", "first admin"],
  },
  {
    title: "Cloudflare R2 Media Storage",
    category: "Guides & Setup",
    slug: "cloudflare-setup",
    description: "R2 bucket creation, custom domain, CORS policies, S3 API tokens, and WebP pipeline.",
    keywords: ["cloudflare", "r2", "media", "images", "cors", "custom domain", "s3", "webp"],
  },
  {
    title: "Writing Studio & Editor",
    category: "Guides & Setup",
    slug: "editor",
    description: "Tiptap engine, 16 Slash blocks, 6 image layouts, autosave, IndexedDB, and SEO inspector.",
    keywords: ["editor", "tiptap", "blocks", "slash", "autosave", "indexeddb", "seo", "images"],
  },
  // Headless API Reference
  {
    title: "REST API Overview",
    category: "API Reference",
    slug: "api/overview",
    description: "Authentication with X-OpenPost-Token, project scoping, pagination, caching headers, and rate limits.",
    keywords: ["api", "rest", "auth", "token", "headers", "rate limit", "cache", "etag"],
  },
  {
    title: "Posts API Reference",
    category: "API Reference",
    slug: "api/posts",
    description: "CRUD endpoints for posts, drafts, revisions, publishing, searching, and restoring.",
    keywords: ["posts", "blogs", "get /api/v1/posts", "post", "revisions", "slug", "publish"],
  },
  {
    title: "Categories & Tags API",
    category: "API Reference",
    slug: "api/taxonomies",
    description: "Taxonomy management endpoints for hierarchical categories and flat tags.",
    keywords: ["categories", "tags", "taxonomies", "hierarchy", "slugs"],
  },
  {
    title: "Authors API Reference",
    category: "API Reference",
    slug: "api/authors",
    description: "Multi-author endpoints, bios, avatars, and linked user profiles.",
    keywords: ["authors", "contributors", "avatars", "social links"],
  },
  {
    title: "Polls & Voting API",
    category: "API Reference",
    slug: "api/polls",
    description: "Interactive poll queries, voting with IP/cookie fingerprinting, and results visibility.",
    keywords: ["polls", "voting", "fingerprint", "vote limit", "results"],
  },
  {
    title: "Media & Uploads API",
    category: "API Reference",
    slug: "api/media",
    description: "Presigned upload URLs, server direct upload, media library queries, and usage tracking.",
    keywords: ["media", "upload", "presign", "storage", "checksum"],
  },
  {
    title: "Cron & Health Checks",
    category: "API Reference",
    slug: "api/cron-health",
    description: "Scheduled post publishing cron endpoint and system health check monitor.",
    keywords: ["cron", "publish", "health", "cron_secret", "scheduler"],
  },
  // Webhooks & Integrations
  {
    title: "Webhooks Engine",
    category: "Webhooks",
    slug: "webhooks",
    description: "Publish/update lifecycle events, HMAC SHA-256 signature verification, and GROQ filters.",
    keywords: ["webhooks", "hmac", "signature", "events", "vercel deploy hook", "github actions"],
  },
  {
    title: "OpenPost CLI (openpost-cli)",
    category: "CLI & SDK",
    slug: "cli",
    description: "npx openpost-cli interactive setup, browser auth code handshake, and project generator.",
    keywords: ["cli", "npx", "openpost-cli", "auth code", "handshake", "scaffolding"],
  },
  {
    title: "Headless Frontend Integration",
    category: "Frontend",
    slug: "frontend",
    description: "Connecting Next.js 15/16 App Router, rendering block AST with ContentRenderer, and ISR.",
    keywords: ["frontend", "nextjs", "template", "renderer", "sharedrender", "isr"],
  },
  // Multi-Tenancy & Security
  {
    title: "Projects & Multi-Tenancy",
    category: "Management",
    slug: "projects",
    description: "Multi-project isolation, team invitations, integration tokens, and workspace settings.",
    keywords: ["projects", "multi-tenancy", "teams", "invites", "tokens"],
  },
  {
    title: "Security & Access Control (RBAC)",
    category: "Security",
    slug: "security",
    description: "Row-Level Security (RLS) deep dive, RBAC permissions matrix, SSRF defenses, and token hashing.",
    keywords: ["security", "rbac", "rls", "roles", "admin", "editor", "writer", "ssrf", "xss"],
  },
  // Deployment & Ops
  {
    title: "Deployment & Self-Hosting",
    category: "Deployment",
    slug: "deployment",
    description: "Deploying to Vercel, Docker Compose production stack, cron scheduler, and custom domains.",
    keywords: ["deployment", "vercel", "docker", "compose", "self-host", "production", "cron"],
  },
  {
    title: "Troubleshooting Guide",
    category: "Troubleshooting",
    slug: "troubleshooting",
    description: "Resolving Supabase IPv6 pooler errors, R2 CORS 403/404 issues, and DB migration fixes.",
    keywords: ["troubleshooting", "errors", "ipv6", "cors", "403", "404", "fk", "debug"],
  },
];

export function extractTocHeadings(content: string): TocItem[] {
  if (!content) return [];
  const lines = content.split("\n");
  const headings: TocItem[] = [];
  const seen = new Map<string, number>();

  const makeId = (text: string) => {
    const base = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/^-+|-+$/g, "") || "section";
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const text = line.replace(/^##\s+/, "").replace(/[*`_]/g, "").trim();
      if (!text) continue;
      const id = makeId(text);
      headings.push({ id, text, level: 2 });
    } else if (line.startsWith("### ")) {
      const text = line.replace(/^###\s+/, "").replace(/[*`_]/g, "").trim();
      if (!text) continue;
      const id = makeId(text);
      headings.push({ id, text, level: 3 });
    }
  }

  return headings;
}
