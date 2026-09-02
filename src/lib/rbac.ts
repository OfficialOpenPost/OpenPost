// RBAC — Canonical 5-role model per PRD §29 + production SaaS prompt
// OWNER(5) > ADMIN(4) > EDITOR(3) > AUTHOR(2) > CONTRIBUTOR(1)
// WRITER is deprecated alias for AUTHOR (backward compat)

export type Role = "OWNER" | "ADMIN" | "EDITOR" | "AUTHOR" | "CONTRIBUTOR";
// Legacy aliases
export type UserRole = Role;

export type ProfileStatus = "pending" | "approved" | "rejected" | "suspended";

export type Permission =
  // project
  | "project.view"
  | "project.update"
  | "project.delete"
  // members
  | "members.view"
  | "members.invite"
  | "members.approve"
  | "members.reject"
  | "members.suspend"
  | "members.update_role"
  | "members.remove"
  // authors — explicit per prompt §4
  | "authors.view"
  | "authors.create"
  | "authors.update"
  | "authors.delete"
  | "authors.link_user"
  // posts — explicit
  | "posts.view"
  | "posts.create"
  | "posts.edit_own"
  | "posts.edit_others"
  | "posts.delete_own"
  | "posts.delete_others"
  | "posts.submit_review"
  | "posts.publish_own"
  | "posts.publish_others"
  | "posts.schedule"
  | "posts.unpublish"
  // media
  | "media.view"
  | "media.upload"
  | "media.delete"
  // settings / audit
  | "settings.view"
  | "settings.update"
  | "audit.view"
  // legacy aliases kept for existing code paths
  | "project.read"
  | "project.manage_members"
  | "project.members.manage"
  | "content.create"
  | "content.read"
  | "content.update"
  | "content.delete"
  | "content.publish"
  | "post.create"
  | "post.read"
  | "post.read_all"
  | "post.edit"
  | "post.update"
  | "post.delete"
  | "post.publish"
  | "media.read"
  | "media.create"
  | "media.manage"
  | "taxonomy.manage"
  | "poll.create"
  | "poll.update"
  | "poll.delete"
  | "poll.vote"
  | "webhook.manage"
  | "webhooks.manage"
  | "integration.create"
  | "integration.revoke"
  | "tokens.manage"
  | "settings.manage"
  | "users.manage"
  | "users.approve";

export const ROLE_HIERARCHY: Record<Role, number> & Record<string, number> = {
  OWNER: 5,
  ADMIN: 4,
  EDITOR: 3,
  AUTHOR: 2,
  CONTRIBUTOR: 1,
  WRITER: 2, // deprecated alias for AUTHOR
} as any;

// normalize any legacy string → canonical role
export function normalizeRole(rawRole: string | null | undefined): Role {
  return normalizeRoleStrict(rawRole);
}

// More precise version that preserves OWNER distinction
export function normalizeRoleStrict(rawRole: string | null | undefined): Role {
  if (!rawRole) return "CONTRIBUTOR";
  const t = rawRole.trim();
  const u = t.toUpperCase();
  if (u === "OWNER") return "OWNER";
  if (u === "ADMIN") return "ADMIN";
  if (u === "EDITOR") return "EDITOR";
  if (u === "AUTHOR") return "AUTHOR";
  if (u === "CONTRIBUTOR") return "CONTRIBUTOR";
  if (u === "WRITER") return "AUTHOR";
  // legacy lower
  if (t === "owner") return "OWNER";
  if (t === "admin") return "ADMIN";
  if (t === "editor") return "EDITOR";
  if (t === "author") return "AUTHOR";
  if (t === "contributor") return "CONTRIBUTOR";
  return "CONTRIBUTOR";
}

export const normalizeUserRole = normalizeRoleStrict;

function roleSet(perms: Permission[]): Set<Permission> {
  return new Set<Permission>(perms);
}

// explicit permission sets — OWNER has all, ADMIN almost all except OWNER-only delete, CONTRIBUTOR minimal
export const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  OWNER: roleSet([
    "project.view","project.update","project.delete",
    "members.view","members.invite","members.approve","members.reject","members.suspend","members.update_role","members.remove",
    "authors.view","authors.create","authors.update","authors.delete","authors.link_user",
    "posts.view","posts.create","posts.edit_own","posts.edit_others","posts.delete_own","posts.delete_others","posts.submit_review","posts.publish_own","posts.publish_others","posts.schedule","posts.unpublish",
    "media.view","media.upload","media.delete",
    "settings.view","settings.update","audit.view",
    // legacy
    "project.read","project.manage_members","project.members.manage","content.create","content.read","content.update","content.delete","content.publish","post.create","post.read","post.read_all","post.edit","post.update","post.delete","post.publish","media.read","media.create","media.manage","taxonomy.manage","poll.create","poll.update","poll.delete","poll.vote","webhook.manage","webhooks.manage","integration.create","integration.revoke","tokens.manage","settings.manage","users.manage","users.approve",
  ]),
  ADMIN: roleSet([
    "project.view","project.update",
    "members.view","members.invite","members.approve","members.reject","members.suspend","members.update_role","members.remove",
    "authors.view","authors.create","authors.update","authors.delete","authors.link_user",
    "posts.view","posts.create","posts.edit_own","posts.edit_others","posts.delete_own","posts.delete_others","posts.submit_review","posts.publish_own","posts.publish_others","posts.schedule","posts.unpublish",
    "media.view","media.upload","media.delete",
    "settings.view","settings.update","audit.view",
    // legacy
    "project.read","project.manage_members","project.members.manage","content.create","content.read","content.update","content.delete","content.publish","post.create","post.read","post.read_all","post.edit","post.update","post.delete","post.publish","media.read","media.create","media.manage","taxonomy.manage","poll.create","poll.update","poll.delete","poll.vote","webhook.manage","webhooks.manage","integration.create","integration.revoke","tokens.manage","settings.manage","users.manage","users.approve",
  ]),
  EDITOR: roleSet([
    "project.view",
    "members.view",
    "authors.view","authors.create","authors.update","authors.delete","authors.link_user",
    "posts.view","posts.create","posts.edit_own","posts.edit_others","posts.delete_own","posts.delete_others","posts.submit_review","posts.publish_own","posts.publish_others","posts.schedule","posts.unpublish",
    "media.view","media.upload","media.delete",
    "settings.view",
    // legacy
    "project.read","content.create","content.read","content.update","content.delete","content.publish","post.create","post.read","post.read_all","post.edit","post.update","post.delete","post.publish","media.read","media.create","media.manage","taxonomy.manage","poll.create","poll.update","poll.delete","poll.vote",
  ]),
  AUTHOR: roleSet([
    "project.view",
    "members.view",
    "authors.view",
    "posts.view","posts.create","posts.edit_own","posts.delete_own","posts.submit_review","posts.publish_own",
    "media.view","media.upload",
    "settings.view",
    // legacy
    "project.read","content.create","content.read","content.update","post.create","post.read","post.read_all","post.edit","post.update","media.read","media.create","poll.vote",
  ]),
  CONTRIBUTOR: roleSet([
    "project.view",
    "members.view",
    "authors.view",
    "posts.view","posts.create","posts.edit_own","posts.submit_review",
    "media.view","media.upload",
    "poll.vote",
    // legacy minimal
    "project.read","content.create","content.read","post.create","post.read","media.read","media.create",
  ]),
};

// Check permission for a given role
export function hasPermission(role: Role | string | null | undefined, permission: Permission | string): boolean {
  if (!role) return false;
  const canonical = normalizeRoleStrict(role);
  const set = ROLE_PERMISSIONS[canonical];
  if (!set) return false;
  // direct match
  if (set.has(permission as Permission)) return true;
  // legacy alias handling: taxonomy.manage ↔ authors.* + posts schedule etc
  // keep simple: if checking legacy, map via canonical set already includes legacy entries
  return false;
}

export function hasMinimumRole(userRole: Role | string | null | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  const canonical = normalizeRoleStrict(userRole);
  const required = normalizeRoleStrict(requiredRole);
  return (ROLE_HIERARCHY[canonical] ?? 0) >= (ROLE_HIERARCHY[required] ?? 0);
}

export const hasRoleLevel = hasMinimumRole;

// Helper to determine if a role can manage another role (OWNER can manage all, ADMIN can manage EDITOR/AUTHOR/CONTRIBUTOR but not OWNER)
export function canManageRole(actorRole: Role, targetRole: Role, desiredRole?: Role): boolean {
  const actor = normalizeRoleStrict(actorRole);
  const target = normalizeRoleStrict(targetRole);
  const desired = desiredRole ? normalizeRoleStrict(desiredRole) : target;

  if (actor === "OWNER") return true;
  if (actor === "ADMIN") {
    // ADMIN cannot touch OWNER, and cannot promote to OWNER
    if (target === "OWNER" || desired === "OWNER") return false;
    return true;
  }
  // non-admin cannot manage roles
  return false;
}

// For audit: which permission corresponds to publish actions
export const PUBLISH_PERMISSIONS: Permission[] = ["posts.publish_own", "posts.publish_others", "posts.schedule"];
