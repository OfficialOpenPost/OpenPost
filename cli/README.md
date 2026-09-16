# openpost-cli v0.2.5 — Connect any frontend to OpenPost CMS

<p align="center"><img src="../public/logo.svg" width="64" height="64" alt="OpenPost Logo" /></p>

Headless CMS connector for **OpenPost**. One command to link your Next.js (or any) frontend to your self-hosted OpenPost instance — no manual `.env` editing.

**Package:** `openpost-cli` on npm → `npx openpost-cli` (single bin `openpost-cli` only, no `create-openpost` alias)  
**Version:** `0.2.5` — see [CHANGELOG]  
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

## Commands

| Command | Description |
|---------|-------------|
| `init [dir]` | Scaffold a new Next.js blog (default command) |
| `dev` | Start local development server |
| `build` | Build production bundle |
| `start` | Start production server |
| `status` | Show project health & config |
| `upgrade` | Update project template & dependencies |
| `reconnect` | Connect to a different CMS instance |
| `doctor` | Run CMS health checks |
| `login` | Authenticate with CMS (alias for init) |
| `logout` | Clear saved token (local) |
| `help` | Show help |
| `version` | Show version |

### `init [dir]` — Scaffold a New Blog

Creates a complete Next.js blog connected to your OpenPost CMS.

```bash
npx openpost-cli init my-blog
# or just:
npx openpost-cli  # defaults to init
```

**What it does:**
1. Prompts for your OpenPost CMS URL (e.g. `https://cms.example.com`)
2. Health-checks `GET /api/health`
3. Opens `${cmsUrl}/cli/connect` in your browser for authorization
4. You paste the `OP-XXXX-XXXX` connection code
5. Exchanges code via `POST /api/cli/exchange` → receives `token` + `projectId`
6. Creates `./my-blog` with Next.js template + `.env.local`
7. Customizes layout, header, footer, and home page with your site config

```bash
cd my-blog && npm install && npm run dev
```

### `dev` — Local Development Server

Starts the Next.js development server with hot reload.

```bash
cd my-blog
npx openpost-cli dev
npx openpost-cli dev --port 3001  # custom port
```

**What it does:**
- Finds your project (looks for `.env.local` up the directory tree)
- Validates connection to your CMS
- Starts `npm run dev` with the configured port

### `build` — Production Build

Builds the Next.js production bundle.

```bash
cd my-blog
npx openpost-cli build
```

**What it does:**
- Validates `.env.local` exists with `OPENPOST_URL`
- Runs `npm install` if `node_modules` is missing
- Runs `npm run build` (Next.js production build)

### `start` — Production Server

Starts the Next.js production server.

```bash
cd my-blog
npx openpost-cli start
npx openpost-cli start --port 8080  # custom port
```

**What it does:**
- Checks if `.next` build exists, runs build if missing
- Starts `npm run start` on the configured port

### `status` — Project Health

Shows project configuration, build status, and CMS connection health.

```bash
cd my-blog
npx openpost-cli status
```

**Output includes:**
- Project root, CMS URL, project ID
- Node.js, npm, and CLI versions
- `node_modules` and `.next` build status
- CMS connection health with service-level checks

### `upgrade` — Update Template & Dependencies

Updates your project to the latest OpenPost template while preserving your configuration.

```bash
cd my-blog
npx openpost-cli upgrade
npx openpost-cli upgrade --template-only  # skip npm install
```

**What it does:**
- Compares your project with the latest template
- Copies updated template files (never overwrites `.env.local`, `node_modules`, `.next`, `.git`)
- Shows dependency changes (new packages, version bumps)
- Runs `npm install` to update dependencies (skip with `--template-only`)

### `reconnect` — Connect to Different CMS

Switches your project to connect to a different OpenPost CMS instance.

```bash
cd my-blog
npx openpost-cli reconnect
npx openpost-cli reconnect --cms-url https://other-cms.com
```

**What it does:**
- Prompts for new CMS URL (or keeps current)
- Opens browser for new authorization code
- Updates `.env.local` with new connection details
- Preserves all other environment variables (site name, tagline, etc.)

### `doctor` — CMS Health Check

Checks connectivity to your OpenPost CMS.

```bash
npx openpost-cli doctor --cms-url https://cms.example.com
```

---

## Options

| Flag | Description |
|------|-------------|
| `--cms-url <url>` | CMS URL (e.g. `https://cms.example.com`) |
| `--code <OP-XXXX>` | Authorization code (skip browser prompt) |
| `--project <name>` | Project directory name (skip prompt) |
| `--port <number>` | Port for `dev`/`start` (default: 3000) |
| `--template-only` | `upgrade`: skip npm install |
| `--skip-health` | Skip CMS health check (not recommended) |
| `--yes`, `-y` | Non-interactive defaults |
| `--help`, `-h` | Show help |
| `--version`, `-v` | Show version |

---

## Examples

```bash
# Create a new blog
npx openpost-cli init my-blog

# Start developing
cd my-blog
npx openpost-cli dev

# Check project health
npx openpost-cli status

# Build for production
npx openpost-cli build

# Start production server
npx openpost-cli start --port 8080

# Upgrade to latest template
npx openpost-cli upgrade

# Switch to a different CMS
npx openpost-cli reconnect --cms-url https://cms.example.com
```

---

## Programmatic

```ts
// templates/nextjs-blog/lib/openpost/client.ts uses:
OPENPOST_URL=https://cms.example.com
OPENPOST_PROJECT_ID=uuid
OPENPOST_TOKEN=op_xxx
// then GET ${OPENPOST_URL}/api/v1/posts?limit=10 with header Authorization: Bearer ${OPENPOST_TOKEN}
```

---

## Requirements

- Node.js 18+ (`openpost-cli v0.2.5` checks `Node >=18`)
- Running OpenPost CMS (`DATABASE_URL` + `R2_*` + `NEXT_PUBLIC_SUPABASE_URL` set, `supabase/migrations` 001→024 run, `npm run build` 67 pages)
- Single bin `openpost-cli` — use `npx openpost-cli`, not `create-openpost`

---

## Troubleshooting

- `CMS health check failed` → CMS not reachable, check `cmsUrl` and that `/api/health` returns 200
- `Exchange failed` → code expired (10 min) or already used → generate new code in CMS → `Dashboard → Settings → Integrations` or `/cli/connect`
- `Directory already exists` → choose different project name
- `No OpenPost project found` → run commands from your blog directory, or run `npx openpost-cli init` first
- `OPENPOST_URL not found` → run `npx openpost-cli reconnect` to reconfigure

---

## Changelog

### v0.2.5
- Added `dev` — local development server command
- Added `build` — production build command
- Added `start` — production server command
- Added `status` — project health & config display
- Added `upgrade` — update template & dependencies
- Added `reconnect` — connect to different CMS instance
- Improved help text with all commands documented
- Added `--port` flag for `dev`/`start`
- Added `--template-only` flag for `upgrade`

### v0.2.4
- Initial public release
- `init`, `doctor`, `login`, `logout` commands
- Browser-based authorization flow
- Template customization with site config

---

## License

MIT — same as OpenPost. PRs welcome at `OfficialOpenPost/OpenPost`.
