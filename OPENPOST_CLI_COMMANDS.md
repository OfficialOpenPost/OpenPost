# OpenPost CLI — Complete Command & Usage Guide

> **Package:** `openpost-cli` (v0.2.3)  
> **Repository:** [https://github.com/OfficialOpenPost/OpenPost](https://github.com/OfficialOpenPost/OpenPost)  
> **Production CMS URL:** `https://openpostcms.vercel.app`

---

## 📌 Overview

`openpost-cli` is the official command-line tool for **OpenPost CMS**. It lets developers scaffold, authenticate, and connect decoupled frontend websites (Next.js 15, Astro, Remix, etc.) to your self-hosted OpenPost CMS in seconds — completely automating `.env.local` configuration and API token exchange.

You do **not** need to install it permanently; you can run it on-demand with `npx`.

---

## ⚡ Quick Reference Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Interactive Scaffolding** | `npx openpost-cli` |
| **Scaffold specific folder** | `npx openpost-cli init my-blog` |
| **Connect to specific CMS URL** | `npx openpost-cli init my-blog --cms-url https://openpostcms.vercel.app` |
| **Non-interactive / CI (Automated)**| `npx openpost-cli init my-blog --cms-url https://openpostcms.vercel.app --code OP-1234-5678 --yes` |
| **Check CMS Health Diagnostic** | `npx openpost-cli doctor --cms-url https://openpostcms.vercel.app` |
| **Log into CMS Studio** | `npx openpost-cli login --cms-url https://openpostcms.vercel.app` |
| **Log out & clear local tokens** | `npx openpost-cli logout` |
| **Check CLI Version** | `npx openpost-cli --version` |
| **View Help & All Flags** | `npx openpost-cli --help` |

---

## 📖 Command Details & Examples

### 1. `init` — Scaffold a Next.js Blog Connected to OpenPost

Creates a new Next.js 15 blog directory, downloads the pre-configured starter template, exchanges authorization credentials with OpenPost CMS, and injects `.env.local`.

#### Basic Usage (Interactive):
```bash
npx openpost-cli init my-blog
```

#### Full Options & Flags:
```bash
npx openpost-cli init [project-name] [flags]
```

- `--cms-url <url>`: Specify the OpenPost CMS Studio URL (e.g. `https://openpostcms.vercel.app`).
- `--code <OP-XXXX-XXXX>`: Provide the 8-character connection code directly to skip browser prompt.
- `--project <name>`: Directory name for the new blog.
- `--skip-health`: Bypass the pre-flight `GET /api/health` check.
- `--yes` or `-y`: Accept defaults automatically.

#### Real-World Examples:

**Example A: Interactive Walkthrough**
```bash
npx openpost-cli init blog-frontend
# 1. Prompts for CMS URL (enter https://openpostcms.vercel.app)
# 2. Automatically opens browser to https://openpostcms.vercel.app/cli/connect
# 3. Copy the OP-XXXX-XXXX code from dashboard and paste it
# 4. Ready! Created ./blog-frontend with .env.local
```

**Example B: One-Liner (Automated Script / CI)**
```bash
npx openpost-cli init tech-blog \
  --cms-url https://openpostcms.vercel.app \
  --code OP-8492-3104 \
  --yes
```

**Example C: Local Development with Local CMS**
```bash
npx openpost-cli init local-blog --cms-url http://localhost:3000
```

---

### 2. `doctor` — Run CMS Health Diagnostic

Validates connectivity to your OpenPost CMS instance, checks database availability, Cloudflare R2 storage, Supabase auth, and API health.

#### Usage:
```bash
npx openpost-cli doctor --cms-url https://openpostcms.vercel.app
```

#### Output Example:
```
OpenPost CLI — CMS Health Doctor
→ Connecting to https://openpostcms.vercel.app/api/health ...
✓ Status: OK (200)
✓ Database: Connected
✓ Auth Service: Connected
✓ Cloudflare R2 Storage: Connected
✓ Webhooks Engine: Operational
✓ REST API v1: Operational
```

---

### 3. `login` — Authenticate & Cache Session Token

Opens your browser to authorize your developer machine with the CMS and saves the live `op_live_...` API token to your local environment.

#### Usage:
```bash
npx openpost-cli login --cms-url https://openpostcms.vercel.app
```

---

### 4. `logout` — Clear Cached Credentials

Deletes cached OpenPost credentials and tokens from your machine.

#### Usage:
```bash
npx openpost-cli logout
```

---

### 5. `version` — Display CLI Version

Prints the currently installed or executed CLI version.

```bash
npx openpost-cli --version
# or
npx openpost-cli -v
# Output: openpost-cli v0.2.3
```

---

### 6. `help` — Show All Flags & Usage

```bash
npx openpost-cli --help
# or
npx openpost-cli -h
```

---

## 🛠️ What Happens After Running `init`?

When `npx openpost-cli init my-blog` finishes, your new blog project will look like this:

```
my-blog/
├── app/
│   ├── blog/              # Public blog feed & article reader
│   │   ├── page.tsx       # /blog list with pagination & category filter
│   │   └── [slug]/page.tsx# Single article page (SSR / ISR)
│   ├── author/[slug]/     # Author archive pages
│   ├── category/[slug]/   # Category archives
│   ├── api/
│   │   ├── revalidate/    # On-demand ISR purge webhook from OpenPost
│   │   └── search/        # Instant search API
│   └── layout.tsx         # Root layout customized with your site name
├── .env.local             # Auto-generated OpenPost credentials
├── package.json           # Next.js 15 + Tailwind CSS
└── README.md
```

### Generated `.env.local`:
```env
OPENPOST_URL="https://openpostcms.vercel.app"
OPENPOST_PROJECT_ID="your-project-uuid"
OPENPOST_TOKEN="op_live_64character_hex_token"
```

### Next Steps to Run Your Blog:
```bash
cd my-blog
npm install
npm run dev
# Open http://localhost:3000 to see your live articles!
```

---

## 🔒 Security Best Practices
- The authorization code `OP-XXXX-XXXX` expires in **10 minutes** and is single-use.
- The exchanged API token (`op_live_...`) is hashed using **SHA-256** in your PostgreSQL database.
- SSRF guards block private and local IP ranges from leaking data.
