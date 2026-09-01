# OpenPost — Professional Blog CMS & Writing Studio

Open source, headless, block-based CMS. Write like WordPress, deliver like Sanity, own like Ghost. **Clone → Run SQL → Update Env → Live.**

**Stack:** Next.js 16 · TypeScript · Tailwind 4 · Tiptap (ProseMirror) · Prisma · PostgreSQL (Supabase) · Cloudflare R2 · Framer Motion

**Palette:** `#FEA611` · `#FE4F01` · `#FE990E` · `#F14802` · `#2D3440`

---

## For New Contributors — 3 Steps to Your Own Instance

### 1. Clone & Install

```bash
git clone https://github.com/your-org/openpost
cd openpost
npm install
cp .env.example .env
```

### 2. Create Your Own Supabase Project (2 min)

1. **Create project:** https://supabase.com → New project → set DB password → wait 1 min
2. **Run SQL (one by one):** Supabase Dashboard → SQL Editor → New query → copy-paste each file in `supabase/migrations/` **in order** `001` → `010` → Run → Next file
   - All files have `IF NOT EXISTS` + RLS — safe to re-run, no data loss
   - Takes <30 sec total, creates: users, categories, tags, authors, media, blogs, revisions, polls, webhooks, FTS index
3. **Copy connection strings:**
   - **Database → Connection string → Session pooler (port 5432, $0, IPv4)** → copy `postgresql://postgres.[ref]:[password]@aws-0-xxx.pooler.supabase.com:5432/postgres`
   - **Project Settings → API** → copy `URL`, `anon key`, `service_role`

### 3. Update Env & Go Live

```env
# D:\Openpost\.env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-xxx.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
# R2 (optional for dev — placeholders work, uploads just no-op)
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret"
R2_BUCKET_NAME="openpost-media"
R2_PUBLIC_URL="https://pub-xxxx.r2.dev"
```

```bash
npx prisma generate
npm run build # must pass 29/29
npm run dev    # http://localhost:3000
# Create user at /signup → write at /dashboard/editor → Publish → appears at /blog
```

**That’s it.** New Supabase project + new R2 bucket + new Vercel env = your own live system. No vendor lock-in, no data migration hell — structured JSON content, no raw HTML.

**For R2:** Cloudflare → R2 → Create bucket `openpost-media` → Manage R2 API Tokens → Create Account Token → copy Access/Secret → set `R2_*` + `R2_PUBLIC_URL` (`pub-xxxx.r2.dev` or `media.yourdomain.com` via Custom Domain). For dev, keep placeholders — `src/lib/storage.ts` handles missing R2 gracefully.

---

## How It’s Mocked Properly

- **Build never breaks without DB:** All `src/app/api/v1/*` try `db.*.findMany` and `catch` → return `[]` or mock, so `npm run build` passes even with dummy `DATABASE_URL`. Once real `DATABASE_URL` is set, same code serves real data (published-only, never leaks drafts).
- **No demo data leaks:** Dashboard, `/dashboard/blogs`, `/blog` show empty states (“No posts yet — create your first post”) until you publish. No `MOCK_POSTS` shown to end users.
- **RLS first:** Every table has RLS — `blogs` public only `published`, auth can read/write drafts; `poll_votes` unique `poll_id+voter_fingerprint` prevents double vote even if API is bypassed.

---

## Deploy

**Vercel (recommended):**
```bash
vercel --prod # add same env vars in Vercel dashboard → redeploy
```

**Docker:**
```bash
docker compose up -d # compose.yml: app + db + worker (image pipeline)
```

---

## Features (V1-V3 done, V4 ready)

- **V1 Editor:** Tiptap, 6 image layouts (Inline/Left/Center/Right/Wide/Full) + resize ↘ handle, tables, autosave (2s + IndexedDB crash restore prompt), preview `SharedRender` parity, slug auto-sync `-2`
- **V2 CMS:** Dashboard (fixed `h-[148]`/`h-[320]` cards, #F0F0F1 WordPress style), blog list (search 300ms, filters, cursor pagination), categories (single-level), tags (flat), authors (multi-author), SEO panel (60/155 + OG/Twitter + disclaimer), featured image card, scheduled publishing, webhooks
- **V3 Blocks:** Slash `/` 16 blocks grouped (Callout/Gallery/Faq/Button/Download/Social/Video/Embed/Poll with HMAC `X-OpenPost-Signature` + `category == 'seo'` filter + retries 3), Zod `docSchema`, `SharedRender` used by both preview and `/blog/[slug]`
- **V4 Media:** R2 presigned, WebP/AVIF variants, media library grid `h-[240]` / list `h-[64]` with usage tracking

## API

- `GET /api/v1/posts?limit=&cursor=&category=&tag=&author=` — only `published`, `Cache-Control: public, s-maxage=60`, cursor `?cursor=&limit=`
- `GET /api/v1/posts/:slug` — 404 for drafts, `ETag`, checks `redirects` for 301
- `GET /api/v1/categories|tags|authors`, `POST /api/blogs` (Zod, slug 409), `POST /api/webhooks`, `GET /api/v1/polls/:id`, `POST /api/v1/polls/:id/vote` (fingerprint `ip:cookie`, 409 on double)

## Webhooks (Sanity-like)

Dashboard → Webhooks → New: URL, events (`post.publish/update/delete/scheduled/unpublish`), secret → `X-OpenPost-Signature` (HMAC SHA256), filter `category == 'seo'`, retries 3. Test with Vercel deploy hook or GitHub `https://api.github.com/repos/.../dispatches`.

## Editor

`/dashboard/editor` — open canvas `max-w-[960px]`, left inspector `320px` adjustable `260–480px` via drag handle, top bar + toolbar sticked `top-0` + `top-14` (no gap), no card, no footer, image cards with 6 layouts.

## Auth

Supabase Auth at `/signup` → `/login` → `/dashboard`. No demo user. RLS + `UserRole` (owner/admin/editor/author/contributor) in `prisma/schema.prisma:10` — enforce in `middleware.ts` (add check `auth.uid()` → `users.role`).

## Routes (29)

`/`, `/about`, `/contact`, `/docs`, `/blog`, `/blog/[slug]`, `/changelog`, `/roadmap`, `/privacy`, `/terms`, `/login`, `/signup`, `/dashboard`, `/dashboard/blogs|editor|categories|tags|authors|media|settings|webhooks`, `/api/v1/*`, `/api/webhooks`, `/api/blogs`, `/api/v1/polls/*`

---

## Troubleshooting for New Forks

- **Build fails with DB error?** Keep `DATABASE_URL` as placeholder for `npm run build` — it will pass via mocks. Set real `DATABASE_URL` only for `npm run dev` / Vercel.
- **R2 uploads no-op?** Placeholders are fine for dev; set real `R2_*` only for production media.
- **IPv6 error on Supabase?** Use **Session pooler `:5432`** (free, $0) not Transaction `:6543` (needs $4 IPv4). Encode password `@` → `%40`, `#` → `%23`, etc.
- **Want to reset?** Supabase → Database → Reset → re-run `001`→`010` SQL, update `.env`, done.

## License

MIT — fork, self-host,商用 free. No vendor lock-in. PRs welcome.
