# RBAC Permissions Matrix

OpenPost implements a **5-tier role-based access control** system defined in `src/lib/rbac.ts`.

## Role Hierarchy

```
OWNER (5) > ADMIN (4) > EDITOR (3) > AUTHOR (2) > CONTRIBUTOR (1)
```

```
┌─────────────────────────────────────────────────────────────────┐
│  OWNER   ████████████████████████████████████████████████  (5)  │
│  ADMIN   ██████████████████████████████████████████        (4)  │
│  EDITOR  ████████████████████████████████                  (3)  │
│  AUTHOR  ██████████████████████                            (2)  │
│  CONTRIB ████████████                                      (1)  │
└─────────────────────────────────────────────────────────────────┘
```

`WRITER` is a deprecated alias → normalized to `AUTHOR` via `normalizeRoleStrict()`.

## Permissions

### Canonical Permissions (60+)

| Permission | OWNER | ADMIN | EDITOR | AUTHOR | CONTRIBUTOR |
|---|:---:|:---:|:---:|:---:|:---:|
| **Project** | | | | | |
| `project.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `project.update` | ✓ | ✓ | | | |
| `project.delete` | ✓ | | | | |
| **Members** | | | | | |
| `members.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `members.invite` | ✓ | ✓ | | | |
| `members.approve` | ✓ | ✓ | | | |
| `members.reject` | ✓ | ✓ | | | |
| `members.suspend` | ✓ | ✓ | | | |
| `members.update_role` | ✓ | ✓ | | | |
| `members.remove` | ✓ | ✓ | | | |
| **Authors** | | | | | |
| `authors.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `authors.create` | ✓ | ✓ | ✓ | | |
| `authors.update` | ✓ | ✓ | ✓ | | |
| `authors.delete` | ✓ | ✓ | ✓ | | |
| `authors.link_user` | ✓ | ✓ | ✓ | | |
| **Posts** | | | | | |
| `posts.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `posts.create` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `posts.edit_own` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `posts.edit_others` | ✓ | ✓ | ✓ | | |
| `posts.delete_own` | ✓ | ✓ | ✓ | ✓ | |
| `posts.delete_others` | ✓ | ✓ | ✓ | | |
| `posts.submit_review` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `posts.publish_own` | ✓ | ✓ | ✓ | ✓ | |
| `posts.publish_others` | ✓ | ✓ | ✓ | | |
| `posts.schedule` | ✓ | ✓ | ✓ | | |
| `posts.unpublish` | ✓ | ✓ | ✓ | | |
| **Media** | | | | | |
| `media.view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `media.upload` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `media.delete` | ✓ | ✓ | ✓ | | |
| **Settings / Audit** | | | | | |
| `settings.view` | ✓ | ✓ | ✓ | ✓ | |
| `settings.update` | ✓ | ✓ | | | |
| `audit.view` | ✓ | ✓ | | | |

### Role Capabilities Summary

| Role | Can Do | Cannot Do |
|---|---|---|
| **OWNER** | Everything. Delete project. Manage all roles. | — |
| **ADMIN** | All CRUD. Invite/remove members. Manage settings. | Delete project. Promote to OWNER. Demote sole OWNER. |
| **EDITOR** | Edit any post. Publish/unpublish. Schedule. Manage media. | Manage members. Update project settings. Delete project. |
| **AUTHOR** | Create posts. Edit/delete own posts. Publish own. Upload media. | Edit others' posts. Publish others' posts. Manage members. |
| **CONTRIBUTOR** | Create drafts. Edit own drafts. Submit for review. Upload media. | Publish. Delete. Edit others' posts. Schedule. |

## Key Enforcement Rules

### 1. Server-Side Verification

```typescript
// Never trust client-side role — always verify from DB
const { user, role } = await requireProjectMember(projectId);
```

### 2. Project Isolation

Every query must include `WHERE projectId`:

```typescript
// src/app/api/blogs/route.ts:256
await requireProjectMember(targetProjectId, "CONTRIBUTOR");
```

### 3. Owner Protection

```typescript
// src/lib/rbac.ts:200-213
export function canManageRole(actorRole, targetRole, desiredRole?) {
  if (actor === "OWNER") return true;
  if (actor === "ADMIN") {
    if (target === "OWNER" || desired === "OWNER") return false;  // Cannot touch OWNER
    return true;
  }
  return false;  // Non-admin cannot manage roles
}
```

### 4. Edit Permission Matrix

```
CONTRIBUTOR: edit_own only → must be createdBy === user.id
AUTHOR:      edit_own only → must be createdBy === user.id
EDITOR:      edit_own + edit_others → can edit any post in project
ADMIN:       edit_own + edit_others → can edit any post in project
OWNER:       edit_own + edit_others → can edit any post in project
```

### 5. Publish Permission Matrix

```
CONTRIBUTOR: submit_review only (cannot publish)
AUTHOR:      publish_own (own posts only, if has permission)
EDITOR:      publish_own + publish_others + schedule
ADMIN:       publish_own + publish_others + schedule
OWNER:       publish_own + publish_others + schedule
```

## Helper Functions

### `hasPermission(role, permission)`

```typescript
// src/lib/rbac.ts:178
hasPermission("EDITOR", "posts.edit_others");  // true
hasPermission("AUTHOR", "posts.edit_others");  // false
```

### `hasMinimumRole(userRole, requiredRole)`

```typescript
// src/lib/rbac.ts:190
hasMinimumRole("OWNER", "EDITOR");  // true (5 >= 3)
hasMinimumRole("AUTHOR", "EDITOR"); // false (2 < 3)
```

### `normalizeRoleStrict(rawRole)`

Converts any string variant to canonical role:

```typescript
normalizeRoleStrict("writer");   // "AUTHOR"
normalizeRoleStrict("ADMIN");    // "ADMIN"
normalizeRoleStrict("owner");    // "OWNER"
normalizeRoleStrict(null);       // "CONTRIBUTOR"
```

### `canManageRole(actorRole, targetRole, desiredRole?)`

Determines if one role can modify another:

```typescript
canManageRole("ADMIN", "EDITOR");           // true
canManageRole("ADMIN", "OWNER");            // false
canManageRole("ADMIN", "EDITOR", "OWNER");  // false (cannot promote to OWNER)
```

## Role Transition Rules

| Actor | Target Current | Can Change To |
|---|---|---|
| OWNER | any | any (including OWNER transfer) |
| ADMIN | EDITOR/AUTHOR/CONTRIBUTOR | any of those |
| ADMIN | OWNER | ✗ Cannot touch OWNER |
| EDITOR | — | ✗ Cannot manage roles |
| AUTHOR | — | ✗ Cannot manage roles |
| CONTRIBUTOR | — | ✗ Cannot manage roles |
