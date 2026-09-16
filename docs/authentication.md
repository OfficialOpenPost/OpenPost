# Authentication & Authorization

OpenPost uses **Supabase Auth** for identity management and a custom **project-scoped RBAC** system for authorization. All auth logic is centralized in `src/lib/auth.ts`.

## Supabase Auth Integration

- **Server client:** `src/lib/supabase/server.ts` — reads cookies from `next/headers`
- **Browser client:** `src/lib/supabase/client.ts`
- **Session transport:** HttpOnly cookies prefixed `sb-*`
- **User model:** Supabase `users` table (external) → mapped to local `profiles` table via shared UUID

## Session Resolution

`getCurrentUser()` (`src/lib/auth.ts:74`) is the core session resolver:

```
Request → cookies() → sb-* tokens → supabase.auth.getUser()
    → profiles (auto-create if missing, status=pending)
    → project_members (via memberships)
    → projects owned (ownerId check → auto-OWNER)
    → derive highest role → AuthUser
    → cache 15s in-memory
```

### AuthUser Interface

```typescript
interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  status: ProfileStatus;      // pending | approved | rejected | suspended
  emailVerified: boolean;
  role: Role;                  // highest role across all memberships
  memberships: {
    projectId: string;
    role: Role;
    project: { id: string; name: string; slug: string };
  }[];
}
```

### Caching

- **In-memory TTL cache** (`userSessionCache` Map) with 15-second TTL
- **React.cache()** deduplicates within a single request
- Cache key derived from auth cookies (first 32 chars of each)
- Auto-evicts expired entries when cache exceeds 200 entries
- `clearUserCache(userId?)` for manual invalidation on role/status changes

## Profile Creation & Status

When a user first authenticates, `getCurrentUser()` auto-creates a `profiles` record:

```typescript
// src/lib/auth.ts:144-166
db.profile.upsert({
  where: { id: user.id },
  create: {
    id: user.id,
    email,
    displayName,
    status: "pending",  // Requires admin approval
  },
  ...
})
```

### Status Workflow

```
pending ──admin approve──→ approved
pending ──admin reject───→ rejected
approved ──admin suspend─→ suspended
suspended ──admin approve→ approved
```

**Guards check status:**
- `requireApprovedUser()` throws 403 for `pending`, `rejected`, `suspended`
- Error codes: `PENDING_APPROVAL`, `ACCOUNT_SUSPENDED`, `ACCOUNT_REJECTED`

## Email Verification

Email verification is required for all users except the first owner (who is auto-approved). The verification flow is:

1. User signs up → Supabase sends a verification email with a link to `${NEXT_PUBLIC_CMS_URL}/auth/callback`
2. User clicks the link → auth callback exchanges the PKCE code for a session
3. Callback creates a `pending` profile in the database
4. User is redirected to `/pending-approval` and waits for admin approval

### Configuration

Set `NEXT_PUBLIC_CMS_URL` to your deployed CMS domain. This is used as the base URL for email verification redirects:

```env
NEXT_PUBLIC_CMS_URL="https://your-cms-domain.vercel.app"
```

### Supabase Setup

In your Supabase Dashboard:

1. **Authentication > URL Configuration**:
   - Set **Site URL** to your `NEXT_PUBLIC_CMS_URL` value
   - Add `${NEXT_PUBLIC_CMS_URL}/auth/callback` to **Redirect URLs**

2. **Authentication > Providers > Email**:
   - Ensure **Confirm email** is **ON** (required for verification flow)

3. **Authentication > Email Templates** (optional):
   - Customize the "Confirm your email" template for branding

## Project Membership

### Database Model

```prisma
model ProjectMember {
  projectId String   @db.Uuid
  userId    String   @db.Uuid
  role      UserRole
  project   Project  @relation(...)
  user      Profile  @relation(...)
  @@id([projectId, userId])
}
```

### Membership Resolution

`requireProjectMember()` (`src/lib/auth.ts:279`) performs:

1. Check `user.memberships` (loaded from `profiles → project_members`)
2. If not found, direct DB lookup (handles race conditions)
3. Also checks `projects.ownerId === user.id` → auto OWNER
4. Returns 404 on failure (not 403 — prevents leaking project existence)

```typescript
// src/lib/auth.ts:317-319
if (!membership) {
  throw new AuthError("Project not found or access denied.", 404, "NOT_FOUND");
}
```

## API Token Authentication

For headless/public API access via `X-OpenPost-Token` header or `Authorization: Bearer`:

```typescript
// src/lib/apiToken.ts:35-91
export async function authenticateIntegration(req: NextRequest) {
  // 1. Extract from Authorization: Bearer op_live_... or X-OpenPost-Token: op_live_...
  // 2. Hash token (SHA-256) → lookup in integrations table
  // 3. Verify not revoked (revokedAt is null)
  // 4. Return project-scoped integration context
}
```

**Token format:** `op_live_<64 hex characters>`

**Project resolution priority** (`resolveProjectContext` in `src/lib/apiToken.ts:100`):
1. Integration token (determines project)
2. Query param `?project=slug-or-id` or `?projectId=...`
3. Header `X-OpenPost-Project`
4. Fallback to single project (only if exactly 1 project exists)

## Auth Guard Functions

| Function | Throws | Purpose |
|---|---|---|
| `requireAuthenticatedUser()` | 401 `UNAUTHORIZED` | User must be logged in |
| `requireApprovedUser()` | 401/403 | Must be approved + verified |
| `requireProjectMember(projectId, minRole?)` | 404/403 | Must be member of project |
| `requirePermission(projectId, permission)` | 403 | Must have specific permission |
| `requireOwner(projectId)` | 403 | Must be OWNER of project |
| `requireAdmin(projectId?)` | 403 | Must be ADMIN+ |

### Usage in API Routes

```typescript
// src/app/api/blogs/route.ts:241 — list posts
const user = await requireApprovedUser();
await requireProjectMember(targetProjectId, "CONTRIBUTOR");

// src/app/api/blogs/route.ts:369 — publish permission
if (status === "published" || status === "scheduled") {
  if (!hasMinimumRole(role, "EDITOR") && !hasPermission(role, "posts.publish_others")) {
    throw new AuthError("You do not have permission to publish.", 403, "FORBIDDEN");
  }
}
```

## Key Security Rules

1. **Never trust client-side permissions.** Always verify via `requireProjectMember()` which queries the database.
2. **Never swallow auth errors.** `.catch(() => {})` on publish/role checks hides security failures.
3. **Project isolation.** Cross-tenant access returns 404, not 403.
4. **Admin cannot promote to OWNER.** Enforced in `src/app/api/settings/users/route.ts`.
5. **Admin cannot demote sole OWNER.** Prevents lockout.
6. **Audit logging.** `createAuditLog()` records all security-relevant actions (role changes, status changes, post operations).
7. **Token hashing.** API tokens are stored as SHA-256 hashes — raw tokens are never persisted.
8. **SSRF protection.** Webhook URLs are validated against localhost, private IPs, and cloud metadata endpoints.
