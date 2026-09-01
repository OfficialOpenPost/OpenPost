// Role-Based Access Control (RBAC) Specification & Permission System

export type Role = "ADMIN" | "EDITOR" | "WRITER";
export type UserRole = Role;
export type ProfileStatus = "pending" | "approved" | "rejected" | "suspended";

export type Permission =
  | "project.read"
  | "project.update"
  | "project.delete"
  | "project.members.manage"
  | "project.manage_members"
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
  | "media.upload"
  | "media.delete"
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
  | "users.approve"
  | "audit.read";

export const ROLE_HIERARCHY: Record<Role, number> = {
  WRITER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

export const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  ADMIN: new Set<Permission>([
    "project.read",
    "project.update",
    "project.delete",
    "project.members.manage",
    "project.manage_members",
    "content.create",
    "content.read",
    "content.update",
    "content.delete",
    "content.publish",
    "post.create",
    "post.read",
    "post.read_all",
    "post.edit",
    "post.update",
    "post.delete",
    "post.publish",
    "media.read",
    "media.create",
    "media.upload",
    "media.delete",
    "media.manage",
    "taxonomy.manage",
    "poll.create",
    "poll.update",
    "poll.delete",
    "poll.vote",
    "webhook.manage",
    "webhooks.manage",
    "integration.create",
    "integration.revoke",
    "tokens.manage",
    "settings.manage",
    "users.manage",
    "users.approve",
    "audit.read",
  ]),
  EDITOR: new Set<Permission>([
    "project.read",
    "content.create",
    "content.read",
    "content.update",
    "content.delete",
    "content.publish",
    "post.create",
    "post.read",
    "post.read_all",
    "post.edit",
    "post.update",
    "post.delete",
    "post.publish",
    "media.read",
    "media.create",
    "media.upload",
    "media.delete",
    "media.manage",
    "taxonomy.manage",
    "poll.create",
    "poll.update",
    "poll.delete",
    "poll.vote",
  ]),
  WRITER: new Set<Permission>([
    "project.read",
    "content.create",
    "content.read",
    "content.update",
    "post.create",
    "post.read",
    "post.read_all",
    "post.edit",
    "post.update",
    "media.read",
    "media.create",
    "media.upload",
    "poll.vote",
  ]),
};

export function normalizeRole(rawRole: string | null | undefined): Role {
  if (!rawRole) return "WRITER";
  const upper = rawRole.toUpperCase();
  if (upper === "ADMIN" || upper === "OWNER") return "ADMIN";
  if (upper === "EDITOR") return "EDITOR";
  if (upper === "WRITER" || upper === "AUTHOR" || upper === "CONTRIBUTOR") return "WRITER";
  return "WRITER";
}

export const normalizeUserRole = normalizeRole;

export function hasPermission(role: Role | string | null | undefined, permission: Permission | string): boolean {
  if (!role) return false;
  const canonicalRole = normalizeRole(role);
  return ROLE_PERMISSIONS[canonicalRole]?.has(permission as Permission) ?? false;
}

export function hasMinimumRole(userRole: Role | string | null | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  const canonical = normalizeRole(userRole);
  return ROLE_HIERARCHY[canonical] >= ROLE_HIERARCHY[requiredRole];
}

export const hasRoleLevel = hasMinimumRole;
