# Contributing to OpenPost

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Supabase account | Free tier works |
| Cloudflare R2 account | Free tier works |
| Git | Any recent version |

## Setup

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/openpost.git
cd openpost
```

### 2. Install Dependencies

```bash
npm ci
```

This also runs `prisma generate` via the `postinstall` script.

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials. See [environment.md](./environment.md) for the full reference.

Minimum required:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=openpost-media
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

```bash
npx prisma generate
npx prisma db push
```

Or with migrations:

```bash
npx prisma migrate dev
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Bootstrap Admin User

Sign up via the web UI, then run:

```bash
npm run cms:bootstrap -- --email your@email.com --password YourPass123
```

Or approve the user via the dashboard if another admin exists.

## Code Conventions

### TypeScript

- Strict mode enabled (`tsconfig.json`)
- Use `interface` for object shapes, `type` for unions/intersections
- Avoid `any` — use `unknown` and type-narrow
- Prefer `as const` for literal types

### File Naming

- **Components:** PascalCase (`SharedRender.tsx`, `ProjectSwitcher.tsx`)
- **Utilities:** camelCase (`auth.ts`, `rbac.ts`, `storage.ts`)
- **Routes:** Next.js App Router conventions (`route.ts` for API, `page.tsx` for pages)
- **Tests:** `*.test.ts` or `*.test.tsx` co-located or in `tests/`

### Code Style

- Tailwind CSS for all styling (no CSS modules, no styled-components)
- No comments in code unless explicitly requested
- Reuse existing utilities from `src/lib/` (don't reinvent)
- Follow existing patterns in neighboring files

### Imports

```typescript
// Use path aliases
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { FloatingImageNode } from "@/components/editor/floating/FloatingImageNode";
```

### API Routes

- Always validate with Zod
- Always check auth with `requireApprovedUser()` or `requireProjectMember()`
- Always scope queries with `WHERE projectId`
- Return consistent error format: `{ error: { code, message } }`
- Return consistent success format: `{ data: ... }`

### RBAC

- Never trust client-side role/permission claims
- Use `requireProjectMember(projectId)` as the source of truth
- Use `hasPermission(role, "permission.name")` for granular checks
- Use `hasMinimumRole(role, "EDITOR")` for hierarchy checks

## Pull Request Process

### 1. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

Follow the conventions above. Keep changes focused.

### 3. Run Checks

```bash
npm run typecheck    # Must pass (0 errors)
npm run test         # Must pass (all tests green)
npm run build        # Must succeed
npm run lint         # No errors
```

### 4. Commit

Write clear, concise commit messages:

```
feat: add bulk media delete endpoint
fix: prevent slug collision race condition
refactor: extract webhook delivery to separate module
```

### 5. Push & Create PR

```bash
git push origin feature/my-feature
```

Create a PR with:
- Clear description of changes
- Screenshots for UI changes
- Test results if applicable

### 6. Review

PRs require review before merge. Address feedback promptly.

## Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/rbac.test.ts
```

**Test suites:**
- `tests/rbac.test.ts` — Role hierarchy, permissions, canManageRole (8 tests)
- `tests/api-token.test.ts` — Token generation, hashing, validation (3 tests)
- `tests/storage-security.test.ts` — Magic bytes validation (7 tests)
- `tests/ssrf-webhook.test.ts` — SSRF protection, URL validation (6 tests)
- `tests/slug.test.ts` — Slug generation, uniqueness (3 tests)
- `tests/webhook-signing.test.ts` — HMAC signing, signature verification (3 tests)

## Building

```bash
# Full production build
npm run build

# Build CLI separately
cd cli && npm run build
```

## Testing CLI

```bash
# Build CLI
cd cli && npm run build

# Show help
node dist/index.js --help

# Show version
node dist/index.js --version

# Health check
node dist/index.js doctor --cms-url http://localhost:3000

# Initialize new blog (interactive)
node dist/index.js init my-blog
```

## Project Structure Reference

```
src/
├── app/api/              # API route handlers
├── app/(dashboard)/      # Dashboard pages
├── components/editor/    # Tiptap editor
├── components/render/    # Content renderer
├── lib/                  # Shared utilities
│   ├── auth.ts          # Authentication
│   ├── rbac.ts          # Permissions
│   ├── db.ts            # Database
│   ├── storage.ts       # R2 storage
│   └── webhooks.ts      # Webhook delivery
└── lib/supabase/        # Supabase clients
```

## Getting Help

- Check existing issues on GitHub
- Read the docs in `docs/`
- Review the `AGENTS.md` file for AI coding agent guidelines
