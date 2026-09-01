# openpost-cli — Connect any frontend to OpenPost CMS

Headless CMS connector for **OpenPost**. One command to link your Next.js (or any) frontend to your self-hosted OpenPost instance — no manual `.env` editing.

**Package:** `openpost-cli` on npm → `npx openpost-cli`  
**Source:** `OfficialOpenPost/OpenPost` → `cli/`

---

## Install & Use

**Zero-install (recommended):**
```bash
npx openpost-cli
# prompts CMS URL → opens browser → paste OP-XXXX code → creates .env.local
```

**Global:**
```bash
npm i -g openpost-cli
openpost-cli
```

**Local to a project:**
```bash
npm i -D openpost-cli
npx openpost-cli
```

---

## What it does

1. Prompts `OpenPost CMS URL` (e.g., `https://cms.typely.in` or `http://localhost:3000`)
2. Health-checks `GET /api/health`
3. Opens `${cmsUrl}/cli/connect` in your browser for authorization
4. You paste the `OP-XXXX-XXXX` connection code shown in the CMS
5. Exchanges code via `POST /api/cli/exchange` → receives `token` + `projectId`
6. Prompts `Project name` (default `my-blog`) → creates `./my-blog` with:
   - `.env.local` → `OPENPOST_URL`, `OPENPOST_PROJECT_ID`, `OPENPOST_TOKEN`
   - `package.json` → `next: 16.3.3` ready

Next:
```bash
cd my-blog && npm install && npm run dev
```

---

## Requirements

- Node.js 18+
- Running OpenPost CMS (`DATABASE_URL` + `R2_*` + `NEXT_PUBLIC_SUPABASE_URL` set, `supabase/migrations` 001→016 run, `npm run build` 38/38)

---

## Programmatic

```ts
// templates/nextjs-blog/lib/openpost/client.ts uses:
OPENPOST_URL=https://cms.typely.in
OPENPOST_PROJECT_ID=uuid
OPENPOST_TOKEN=op_xxx
// then GET ${OPENPOST_URL}/api/v1/posts?limit=10 with header Authorization: Bearer ${OPENPOST_TOKEN}
```

---

## Options

- `--help` → shows usage
- Works on Windows/macOS/Linux, no `python` needed (`py` on Windows)

---

## Troubleshooting

- `CMS health check failed` → CMS not reachable, check `cmsUrl` and that `/api/health` returns 200
- `Exchange failed` → code expired (10 min) or already used → generate new code in CMS → `Dashboard → Settings → Integrations` or `/cli/connect`
- `Directory already exists` → choose different project name

---

## License

MIT — same as OpenPost. PRs welcome at `OfficialOpenPost/OpenPost`.
