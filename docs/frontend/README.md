# Frontend — How to Use OpenPost Docs

This is the **user-facing docs site** at `/docs` (and `/blog`, `/`, etc.). It’s a **Next.js** app that reads from the headless API, not from local markdown.

## For Blog Readers (public)

- `/` — hero with live `GET /api/v1/posts?limit=6` (see `src/app/page.tsx:42`)
- `/blog` — paginated list, `Cache-Control: public, s-maxage=60`, cursor `?cursor=`
- `/blog/[slug]` — `SharedRender` for all 16 blocks, `FAQPage` JSON-LD, `ETag`, 301 via `redirects` table
- `/docs` — this site, markdown in `docs/` → rendered via `src/app/docs/page.tsx`

## For Writers (CMS)

- `/signup` → `/login` → `/dashboard` (requires `profiles.status='approved'`)
- `/dashboard/editor` — Tiptap, slash `/` 16 blocks, autosave 2s + IndexedDB `editor/page.tsx:74` + bottom toast `Auto-saved …` square `rounded-lg`, preview `max-w-[960px]` (was 720)
- `/dashboard/blogs` — search `300ms`, `Trash → Restore` via `POST /api/blogs/[id]/restore`
- `/dashboard/categories|tags|authors` — `POST/PUT/DELETE /api/v1/*` + `debounce 300ms` + safe-delete `409`
- `/dashboard/media` — drag → `convertToWebP` (canvas 0.82) → `POST /api/media/upload` (server `PutObject` to `Openpost-images/`) → `https://media.typely.in/Openpost-images/...`

## For Developers (headless)

**Connect any frontend in 30s with `openpost-cli`:**

```bash
npx openpost-cli
# CMS URL: https://cms.yourdomain.com
# Paste OP-XXXX code from /cli/connect
# Project: my-blog → writes .env.local
cd my-blog && npm install && npm run dev
```

Or manually:
```env
OPENPOST_URL=https://cms.yourdomain.com
OPENPOST_PROJECT_ID=uuid
OPENPOST_TOKEN=op_xxx
```
Then:
```ts
// lib/openpost/client.ts
const res = await fetch(`${process.env.OPENPOST_URL}/api/v1/posts?limit=10`, {
  headers: { Authorization: `Bearer ${process.env.OPENPOST_TOKEN}` }
});
```

See `templates/nextjs-blog/` for a full example, and `cli/README.md` for `npx openpost-cli` details.

## Running Docs Locally

```bash
git clone https://github.com/OfficialOpenPost/OpenPost.git
# run 001→016 SQL in Supabase, set .env, then:
npm run dev # docs at http://localhost:3000/docs
```

Update markdown in `docs/` and it hot-reloads. No build step for docs content.
