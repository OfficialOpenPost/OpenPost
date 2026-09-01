<div align="center">

# ⚡ OpenPost

### The Modern, Multi-Tenant Headless CMS & Publishing Studio

**Write like WordPress &middot; Deliver like Sanity &middot; Own like Ghost**

<p align="center">
  <a href="https://github.com/OfficialOpenPost/OpenPost/actions"><img src="https://img.shields.io/badge/build-passing-2ea44f.svg?style=for-the-badge&logo=github-actions" alt="Build Status" /></a>
  <a href="https://github.com/OfficialOpenPost/OpenPost"><img src="https://img.shields.io/badge/tests-27%2F27%20passed-brightgreen.svg?style=for-the-badge&logo=vitest" alt="Vitest Tests" /></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.3%20(App%20Router)-000000.svg?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E.svg?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
  <a href="https://developers.cloudflare.com/r2"><img src="https://img.shields.io/badge/Storage-Cloudflare%20R2-F38020.svg?style=for-the-badge&logo=cloudflare" alt="Cloudflare R2" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-CSS%204.0-06B6D4.svg?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge" alt="License MIT" /></a>
</p>

<p align="center">
  <a href="#-quickstart-in-3-minutes"><strong>Quickstart</strong></a> &bull;
  <a href="#-key-features"><strong>Key Features</strong></a> &bull;
  <a href="#-architecture--database-model"><strong>Architecture</strong></a> &bull;
  <a href="#-cli-starter-generator"><strong>CLI Starter</strong></a> &bull;
  <a href="#-public-api-reference"><strong>API Reference</strong></a> &bull;
  <a href="#-rbac-permission-matrix"><strong>RBAC Model</strong></a> &bull;
  <a href="#-production-deployment"><strong>Deployment</strong></a>
</p>

---

</div>

## 🌟 Overview

**OpenPost** is an open-source, enterprise-ready headless Content Management System and collaborative writing studio built for developers, publishers, and modern engineering teams.

Unlike legacy monolithic CMS platforms or restrictive SaaS subscriptions, OpenPost gives you **100% data ownership**, strict multi-tenant project isolation, cryptographically hashed API tokens, direct Cloudflare R2 media streaming, and an instant Next.js blog generator CLI.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           OpenPost Architecture                         │
├───────────────────┬───────────────────────────────┬─────────────────────┤
│  Studio Layer     │      Core Engine & APIs       │  Frontend Delivery  │
│  - Tiptap Editor  │      - Project-Scoped RLS     │  - Next.js Starter  │
│  - Revision Logs  │      - REST API v1 Caching    │  - CLI Generator    │
│  - User Approvals │      - SSRF Webhooks Engine   │  - RSS / Sitemaps   │
│  - Role Controls  │      - Magic Byte S3 Storage  │  - On-Demand ISR    │
└───────────────────┴───────────────────────────────┴─────────────────────┘
```

---

## ✨ Key Features

| Capability | Description |
| :--- | :--- |
| 🛡️ **Multi-Tenant Isolation** | Strict project-level isolation at database layer with PostgreSQL Row Level Security (RLS) policies and composite indexes. |
| 👥 **Canonical 3-Tier RBAC** | Explicit permission hierarchy (`WRITER` &rarr; `EDITOR` &rarr; `ADMIN`) governing drafts, publishing, taxonomies, and team settings. |
| ⏳ **User Approval Workflow** | Automated gatekeeping for new user sign-ups (`pending` &rarr; `approved` / `rejected` / `suspended`) managed via Admin Settings. |
| 🔑 **Hashed API Token Engine** | High-entropy `op_live_<64-hex>` token generation with SHA-256 database hashing and project context resolution. |
| 💻 **Zero-Config CLI Generator** | `create-openpost` scaffolds a pre-wired Next.js 15 blog in seconds with automatic single-use code exchange. |
| ⚡ **Cloudflare R2 Direct S3** | Presigned client upload URLs, magic byte validation (PNG, JPEG, WebP, GIF, AVIF, PDF, SVG), and atomic asset deletion. |
| 🔒 **SSRF-Hardened Webhooks** | Real-time HMAC SHA-256 signed event delivery blocking loopback addresses, private RFC-1918 subnets, and cloud metadata. |
| 📊 **Interactive Embedded Polls** | In-article voting widgets with SHA-256 voter fingerprint deduplication and live percentage calculation. |
| 🕒 **Automated Scheduled Cron** | Background scheduled publishing dispatcher protected by `CRON_SECRET` bearer authentication. |
| 🚀 **Next.js 15 Blog Starter** | Production template featuring JSON-LD SEO schema, dynamic RSS (`/feed.xml`), sitemaps, and webhook-driven ISR revalidation. |

---

## 🚀 Quickstart in 3 Minutes

### Step 1: Clone & Install

```bash
git clone https://github.com/OfficialOpenPost/OpenPost.git
cd OpenPost
npm install
cp .env.example .env
```

### Step 2: Configure Supabase Database

1. Create a free project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Run the migrations in `supabase/migrations/` sequentially from `001` through `017_strict_rls_and_canonical_roles.sql`.
4. Update your `.env` file with your credentials:

```env
# Database & Supabase Auth
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# Cloudflare R2 Storage (S3 Compatible)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="openpost-media"
R2_PUBLIC_URL="https://media.yourdomain.com"

# Cron Security
CRON_SECRET="your-secure-random-secret-key"
```

### Step 3: Run & Launch

```bash
npx prisma generate
npm run test     # Verifies all 27 automated tests pass
npm run dev      # Launches CMS at http://localhost:3000
```

1. Navigate to `http://localhost:3000/signup` and create your account.
2. The initial account is automatically approved or manageable via Dashboard Settings.
3. Create your first project, author articles, and publish instantly!

---

## 🛠️ CLI Starter Generator (`create-openpost`)

Quickly scaffold a fully connected Next.js blog frontend using the OpenPost CLI:

```bash
cd cli
npm install
npm run build
node dist/index.js
```

### Interactive CLI Workflow:
```text
=======================================================
  OpenPost CLI — Full-Stack Blog Starter Generator
=======================================================

? Enter your OpenPost CMS URL: http://localhost:3000
✓ Connected to OpenPost CMS successfully.

Opening browser for authorization: http://localhost:3000/cli/connect
? Paste the authorization code from your browser (OP-XXXX-YYYY-ZZZZ): OP-8F2A-4B1C-9E3D
✓ Authorized for project: Tech Publication (proj_8f2a4b1c)

? Enter the directory name for your new Next.js blog: my-tech-blog
Scaffolding Next.js production blog in: /projects/my-tech-blog...

=======================================================
  🎉 Successfully created my-tech-blog!
=======================================================

Next steps to start publishing:
  1. cd my-tech-blog
  2. npm install
  3. npm run dev -p 3001

Your blog is live at http://localhost:3001!
```

---

## 🔐 Canonical RBAC Permission Matrix

OpenPost enforces a three-tier canonical role structure with zero privilege ambiguity:

| Permission / Capability | WRITER (Level 1) | EDITOR (Level 2) | ADMIN (Level 3) |
| :--- | :---: | :---: | :---: |
| Create & Edit Own Drafts | ✅ | ✅ | ✅ |
| Edit Any Article in Project | ❌ | ✅ | ✅ |
| Publish & Schedule Articles | ❌ | ✅ | ✅ |
| Delete & Trash Articles | ❌ | ✅ | ✅ |
| Manage Taxonomies (Categories, Tags, Authors) | Read Only | ✅ | ✅ |
| Media Asset Upload & Usage Sync | Upload Own | Full Management | Full Management |
| Create & Revoke Project API Tokens | ❌ | ❌ | ✅ |
| Manage Webhooks & Endpoint Deliveries | ❌ | ❌ | ✅ |
| Approve / Reject / Suspend Users | ❌ | ❌ | ✅ |
| Modify Project Settings & Billing | ❌ | ❌ | ✅ |
| Delete Project | ❌ | ❌ | ✅ |

---

## 📡 Public API Reference (`/api/v1/*`)

All public endpoints support project scoping via `Authorization: Bearer op_live_...`, `?project=<slug>`, or `X-OpenPost-Project: <id>` headers.

### 1. List Published Articles
```http
GET /api/v1/posts?limit=10&category=engineering&cursor=eyJ...
```
```json
{
  "data": [
    {
      "id": "c7a8b9e1-2f3d-4e5a-b6c7-d8e9f0a1b2c3",
      "title": "Scaling PostgreSQL with RLS and Next.js",
      "slug": "scaling-postgresql-with-rls",
      "publishedAt": "2026-09-01T12:00:00.000Z",
      "readingTime": 5,
      "wordCount": 1150,
      "coverImage": "https://media.yourdomain.com/openpost-media/cover-image.webp",
      "category": { "name": "Engineering", "slug": "engineering" },
      "authors": [{ "name": "Alex Mercer", "slug": "alex-mercer" }],
      "tags": [{ "name": "PostgreSQL", "slug": "postgresql" }]
    }
  ],
  "meta": { "hasMore": false, "cursor": null }
}
```

### 2. Fetch Single Article
```http
GET /api/v1/posts/scaling-postgresql-with-rls
```
*Note: Returns 301 Redirect payload if the article slug was updated.*

### 3. Submit Poll Vote
```http
POST /api/v1/polls/poll_12345/vote
Content-Type: application/json

{
  "optionId": "opt_67890"
}
```

---

## 🧪 Automated Test Suite

OpenPost includes a robust automated test suite written with **Vitest** verifying all core security components:

```bash
npm run test
```

```text
 RUN  v4.1.11 OpenPost

 ✓ tests/rbac.test.ts (5 tests)
 ✓ tests/api-token.test.ts (3 tests)
 ✓ tests/storage-security.test.ts (7 tests)
 ✓ tests/ssrf-webhook.test.ts (6 tests)
 ✓ tests/slug-reading-time.test.ts (3 tests)
 ✓ tests/webhook-signing.test.ts (3 tests)

 Test Files  6 passed (6)
      Tests  27 passed (27)
```

---

## 🚢 Production Deployment

### Option A: Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

```bash
npm i -g vercel
vercel --prod
```
*Make sure to configure all environment variables from `.env.example` in your Vercel Project Settings.*

### Option B: Docker Container
```bash
docker build -t openpost:latest .
docker run -p 3000:3000 --env-file .env openpost:latest
```

### Scheduled Publishing Cron
Set up a 1-minute recurring cron trigger (e.g. AWS EventBridge, Vercel Cron, GitHub Actions) to call:
```bash
curl -X POST https://your-domain.com/api/cron/publish \
  -H "Authorization: Bearer <CRON_SECRET>"
```

---

## 🛡️ Security & Responsible Disclosure

OpenPost takes application security seriously:
- **SSRF Prevention**: All external webhook URLs are strictly validated against private IP blocks and cloud instance metadata services.
- **Constant-Time HMAC**: Webhook signatures are verified using `crypto.timingSafeEqual`.
- **Magic Byte Validation**: Uploaded media must match declared MIME headers and pass binary header inspection.
- **SQL Injection & RLS**: All queries are executed via Prisma ORM parameterized statements and guarded by PostgreSQL RLS.

If you discover a security vulnerability, please send an advisory to `security@openpost.app`.

---

## 📄 License

OpenPost is open-source software licensed under the **[MIT License](LICENSE)**.

<div align="center">
  <sub>Built with ❤️ by the OpenPost Community. Empowering independent writing and headless publishing worldwide.</sub>
</div>
