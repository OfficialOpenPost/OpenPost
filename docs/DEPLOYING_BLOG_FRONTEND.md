# Deploying Your OpenPost Blog Frontend (Netlify & Vercel Guide)

This guide explains how your decoupled **Next.js Blog Frontend** and **OpenPost CMS** communicate when deployed to production platforms such as **Netlify** or **Vercel**.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   OpenPost Studio                      │
│            (Deployed on Vercel / VPS / Railway)        │
│               https://cms.yourdomain.com               │
│                                                        │
│  - SQLite / PostgreSQL Database                        │
│  - Supabase Auth + Media Storage (R2/S3)               │
│  - Headless REST API: /api/v1/posts, /categories, etc. │
│  - Webhooks Publisher                                  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           │ Secure API Calls (Bearer Token + Project ID)
                           ▼
┌────────────────────────────────────────────────────────┐
│                  Blog Frontend                         │
│              (Deployed on Netlify / Vercel)            │
│               https://yourblog.vercel.app              │
│                                                        │
│  - Next.js 15 App Router                               │
│  - Incremental Static Regeneration (ISR: 60s)          │
│  - Instant On-Demand Webhook Revalidation              │
│  - Global Edge CDN Cached Delivery                     │
└────────────────────────────────────────────────────────┘
```

---

## 1. Will OpenPost Serve Blogs to Netlify / Vercel?

**Yes! Absolutely.**

- The Blog Website fetches articles from the OpenPost REST API (`GET /api/v1/posts`) at build time and in the background using **Incremental Static Regeneration (ISR)** (`revalidate: 60`).
- Because pages are rendered statically on the edge, your blog loads instantaneously with **zero database lag** for your visitors.
- When new articles are published in OpenPost CMS, the blog automatically pulls the latest content without needing a manual rebuild.

---

## 2. Setting Up in Production (Step-by-Step)

### Step 1: Deploy OpenPost CMS
Deploy OpenPost CMS to your preferred platform (e.g. Vercel, Railway, Render, or a VPS).
Let's assume your CMS is live at: `https://cms.yourdomain.com`.

### Step 2: Obtain your API Token & Project ID
1. Log in to your OpenPost Studio (`https://cms.yourdomain.com`).
2. Go to **Settings → API Tokens** (or use `npx openpost-cli login`).
3. Generate a live API Token (starts with `op_live_...`).
4. Copy your **Project ID** from Settings.

### Step 3: Deploy Blog to Netlify or Vercel

#### On Vercel:
1. Push your blog repository to GitHub/GitLab.
2. In Vercel, click **Add New Project** and import the repository.
3. In **Environment Variables**, add:

| Variable Name | Value | Description |
|---|---|---|
| `OPENPOST_URL` | `https://cms.yourdomain.com` | The public URL of your deployed OpenPost CMS |
| `OPENPOST_PROJECT_ID` | `your-project-uuid` | Your OpenPost project ID |
| `OPENPOST_TOKEN` | `op_live_...` | API Token generated in CMS Studio |
| `SITE_URL` | `https://yourblog.vercel.app` | The public URL of your blog |
| `SITE_NAME` | `My Tech Publication` | (Optional) Custom publication name |
| `SITE_TAGLINE` | `Engineering, design, and code` | (Optional) Header tagline |

4. Click **Deploy**.

#### On Netlify:
1. In Netlify, click **Add new site → Import an existing project**.
2. Select your repository.
3. In **Site configuration → Environment variables**, add the same variables (`OPENPOST_URL`, `OPENPOST_PROJECT_ID`, `OPENPOST_TOKEN`, `SITE_URL`).
4. Click **Deploy Site**.

---

## 3. Instant On-Demand Publishing (Webhooks)

By default, Next.js re-fetches content every 60 seconds (`revalidate: 60`). If you want new articles to appear **instantly** the second you click "Publish":

1. In OpenPost Studio, navigate to **Dashboard → Webhooks**.
2. Click **Create Webhook**.
3. Set URL to your Netlify / Vercel revalidation endpoint or build hook (e.g., `https://yourblog.vercel.app/api/revalidate`).
4. Select events: `post.published`, `post.updated`, `post.deleted`.
5. Now, every publish or update automatically purges the CDN cache immediately!

---

## 4. Troubleshooting Common Questions

### Q: Why does my blog show "Article Not Found" on Netlify/Vercel?
**A:** Ensure `OPENPOST_URL` is set to your **public HTTPS CMS URL** (e.g. `https://cms.yourdomain.com`), not `http://localhost:3000`. `localhost` does not exist on Netlify/Vercel servers.

### Q: Does OpenPost support custom domain names for both CMS and Blog?
**A:** Yes! For example:
- CMS: `https://studio.mydomain.com`
- Blog: `https://mydomain.com` (or `https://blog.mydomain.com`)

### Q: What if my CMS goes temporarily offline?
**A:** Thanks to Next.js ISR and Edge Caching, your blog frontend will continue serving cached static versions of all published articles with **zero downtime**!
