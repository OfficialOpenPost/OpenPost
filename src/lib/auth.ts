import { createClient } from "@/lib/supabase/server";
import { db, withDbRetry } from "@/lib/db";
import {
  Role,
  ProfileStatus,
  Permission,
  normalizeRole,
  hasPermission,
  hasMinimumRole,
} from "./rbac";

export * from "./rbac";

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 403, code = "FORBIDDEN") {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  status: ProfileStatus;
  role: Role; // Default or global mapped role
  memberships: {
    projectId: string;
    role: Role;
    project: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
}

/**
 * Resolves current authenticated session from Supabase, loading Profile status and project memberships.
 * Returns null if unauthenticated or on invalid session.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    if (!supabase) return null;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return null;
    }

    // 1. Fetch Profile and project memberships from database
    let profile = await withDbRetry(() =>
      db.profile.findUnique({
        where: { id: user.id },
        include: {
          memberships: {
            include: {
              project: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      })
    ).catch(() => null);

    // 2. If profile record is missing, safely backfill it with 'pending' status
    if (!profile) {
      const email = user.email.toLowerCase().trim();
      const displayName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.display_name as string) ||
        email.split("@")[0];

      profile = await withDbRetry(() =>
        db.profile.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            email,
            displayName,
            status: "pending",
          },
          update: {
            email,
          },
          include: {
            memberships: {
              include: {
                project: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        })
      ).catch(() => null);
    }

    if (!profile) {
      return null;
    }

    // Normalized memberships
    const memberships = (profile.memberships || []).map((m: any) => ({
      projectId: m.projectId,
      role: normalizeRole(m.role),
      project: m.project,
    }));

    // Derive highest role across memberships (or WRITER default)
    let highestRole: Role = "WRITER";
    for (const m of memberships) {
      if (m.role === "ADMIN") {
        highestRole = "ADMIN";
        break;
      } else if (m.role === "EDITOR") {
        highestRole = "EDITOR";
      }
    }

    return {
      id: profile.id,
      email: profile.email,
      displayName: profile.displayName,
      status: profile.status as ProfileStatus,
      role: highestRole,
      memberships,
    };
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    return null;
  }
}

/**
 * Requires an authenticated user session. Throws 401 if unauthenticated.
 */
export async function requireAuthenticatedUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Authentication required.", 401, "UNAUTHORIZED");
  }
  return user;
}

/**
 * Requires an approved user account. Throws 401 if unauthenticated, 403 if pending/rejected/suspended.
 */
export async function requireApprovedUser(): Promise<AuthUser> {
  const user = await requireAuthenticatedUser();
  if (user.status !== "approved") {
    if (user.status === "pending") {
      throw new AuthError("Your account is pending administrator approval.", 403, "PENDING_APPROVAL");
    }
    if (user.status === "suspended") {
      throw new AuthError("Your account has been suspended.", 403, "ACCOUNT_SUSPENDED");
    }
    if (user.status === "rejected") {
      throw new AuthError("Your account request was rejected.", 403, "ACCOUNT_REJECTED");
    }
    throw new AuthError("Account not authorized.", 403, "FORBIDDEN");
  }
  return user;
}

/**
 * Requires user to be an approved member of the given project, optionally verifying a minimum role.
 * Returns 404 (or 403) on failure to avoid leaking project existence across tenants.
 */
export async function requireProjectMember(
  projectId: string,
  minimumRole?: Role
): Promise<{ user: AuthUser; role: Role }> {
  if (!projectId || typeof projectId !== "string") {
    throw new AuthError("Valid project identifier required.", 400, "INVALID_PROJECT");
  }

  const user = await requireApprovedUser();

  const membership = user.memberships.find((m) => m.projectId === projectId);
  if (!membership) {
    // Return 404 to prevent resource existence enumeration (IDOR / BOLA)
    throw new AuthError("Project not found or access denied.", 404, "NOT_FOUND");
  }

  if (minimumRole && !hasMinimumRole(membership.role, minimumRole)) {
    throw new AuthError(
      `Insufficient permissions: ${minimumRole} role required on project.`,
      403,
      "FORBIDDEN"
    );
  }

  return { user, role: membership.role };
}

/**
 * Requires a specific role on the given project.
 */
export async function requireProjectRole(
  projectId: string,
  role: Role
): Promise<{ user: AuthUser; role: Role }> {
  return requireProjectMember(projectId, role);
}

/**
 * Requires a specific granular permission on the given project.
 */
export async function requirePermission(
  projectId: string,
  permission: Permission
): Promise<{ user: AuthUser; role: Role }> {
  const { user, role } = await requireProjectMember(projectId);
  if (!hasPermission(role, permission)) {
    throw new AuthError(
      `Permission denied: missing '${permission}' on project.`,
      403,
      "FORBIDDEN"
    );
  }
  return { user, role };
}

/**
 * Requires administrator role on the project or globally.
 */
export async function requireAdmin(projectId?: string): Promise<AuthUser> {
  const user = await requireApprovedUser();

  if (projectId) {
    const { user: authedUser } = await requireProjectRole(projectId, "ADMIN");
    return authedUser;
  }

  // If no projectId specified, check if user is ADMIN on any project
  const isAdmin = user.memberships.some((m) => m.role === "ADMIN") || user.role === "ADMIN";
  if (!isAdmin) {
    throw new AuthError("Administrator privileges required.", 403, "FORBIDDEN");
  }

  return user;
}

/**
 * Central safe audit logger for security and admin actions.
 */
export async function createAuditLog({
  actorId,
  projectId,
  action,
  targetId,
  metadata,
}: {
  actorId?: string | null;
  projectId?: string | null;
  action: string;
  targetId?: string | null;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    // Sanitize metadata to never record raw passwords, tokens or secrets
    const sanitizedMeta = { ...(metadata || {}) };
    delete sanitizedMeta.password;
    delete sanitizedMeta.rawToken;
    delete sanitizedMeta.token;
    delete sanitizedMeta.secret;

    await withDbRetry(() =>
      db.auditLog.create({
        data: {
          actorId: actorId || null,
          projectId: projectId || null,
          action,
          targetId: targetId ? String(targetId) : null,
          metadata: sanitizedMeta,
        },
      })
    ).catch(() => {});
  } catch (err) {
    console.warn("Failed to record audit log:", err);
  }
}
