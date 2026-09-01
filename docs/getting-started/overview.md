# OpenPost Overview & Architecture

OpenPost is an open-source, headless, block-based Content Management System (CMS) designed for modern engineering teams, content creators, and publishing platforms.

It combines the intuitive writing experience of WordPress and Notion with the clean headless API architecture of Sanity and Ghost.

---

## Why OpenPost?

Most blogging solutions force you to choose between monolithic platforms with rigid templates (like WordPress) or expensive SaaS headless systems with vendor lock-in (like Contentful or Sanity).

OpenPost gives you:
- **Zero Vendor Lock-in**: All your posts are saved as structured JSON in your own PostgreSQL database (Supabase).
- **Fast Media Delivery**: Uploads are saved directly to your Cloudflare R2 bucket with custom domain support and zero egress fees.
- **Tiptap Writing Studio**: A distraction-free canvas with 16 Slash `/` custom blocks (Callout, Gallery, Accordion, CTA buttons, Polls).
- **High-Performance Headless API**: Published-only REST endpoints with cursor pagination, ISR caching headers, and ETags.
- **One-Command CLI**: Connect any Next.js frontend in 30 seconds using `npx openpost-cli`.

---

## Architecture Diagram

OpenPost is architected around 4 core decoupled layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Writing Studio & CMS                     │
│  (Next.js 16 App Router · Tailwind CSS · Tiptap Editor)     │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Supabase Postgres       │ │       Cloudflare R2        │
│ (Prisma ORM · RLS · JSONB)   │ │ (S3 Presigned · WebP CDN)  │
└──────────────┬───────────────┘ └─────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Headless REST API & Webhooks                │
│    (GET /api/v1/posts · HMAC Webhooks · Cron Publishing)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Consumers (Any)                  │
│    (Next.js · Astro · Remix · Gatsby · iOS / Mobile Apps)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Server components, API routes, and SSR |
| **Database** | Supabase (PostgreSQL 15+) | Structured data, JSONB blocks, Full-Text Search |
| **ORM** | Prisma 6.x | Schema management, type safety, and migrations |
| **Object Storage** | Cloudflare R2 | S3-compatible media storage with $0 egress fees |
| **Editor** | Tiptap (ProseMirror AST) | Block-based rich text and custom slash commands |
| **Authentication** | Supabase Auth + RBAC | Role-Based Access Control and RLS policies |
| **Styling** | Tailwind CSS 4 | Clean design system and responsive layout |

---

## Block-Based Content Model (No Raw HTML)

Unlike legacy CMS engines that store raw HTML strings (vulnerable to XSS and broken layouts), OpenPost stores your articles as a structured **JSON Abstract Syntax Tree (AST)**.

Here is an example of an article stored in OpenPost:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Welcome to OpenPost" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "This is a clean, structured block of text." }
      ]
    },
    {
      "type": "callout",
      "attrs": { "type": "tip" },
      "content": [{ "type": "text", "text": "Tip: Use slash commands to insert blocks." }]
    }
  ]
}
```

This ensures that your content can be rendered identically anywhere: on a website, a mobile app, an RSS feed, or sent via email.

---

## Next Steps

- Follow the [5-Minute Quickstart](/docs/getting-started/quickstart) to get OpenPost running locally.
- Configure [Supabase Postgres](/docs/supabase-setup) and run the migrations.
- Set up [Cloudflare R2](/docs/cloudflare-setup) for fast media uploads.
