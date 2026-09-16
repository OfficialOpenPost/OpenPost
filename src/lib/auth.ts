import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db, withDbRetry } from "@/lib/db";
import {
  Role,
  ProfileStatus,
  Permission,
  normalizeRole,
  normalizeRoleStrict,
  hasPermission,
  hasMinimumRole,
  ROLE_HIERARCHY,
} from "./rbac";

export * from "./rbac";

interface CachedSession {
  user: AuthUser;
  expiresAt: number;
}

// In-memory high-speed cache for authenticated user sessions (15-second TTL)
// Eliminates repetitive external Supabase Auth HTTPS calls and DB queries during dashboard navigation
const userSessionCache = new Map<string, CachedSession>();

export function clearUserCache(userId?: string) {
  if (!userId) {
    userSessionCache.clear();
    return;
  }
  for (const [key, val] of userSessionCache.entries()) {
    if (val.user.id === userId) {
      userSessionCache.delete(key);
    }
  }
}

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
  emailVerified: boolean;
  role: Role;
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
 * Uses in-memory TTL caching + React.cache() to deduplicate repeated calls within and across requests.
 * Returns null if unauthenticated or on invalid session.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    let cacheKey: string | null = null;
    try {
      const cookieStore = await cookies();
      const authTokens = cookieStore
        .getAll()
        .filter((c) => c.name.startsWith("sb-") || c.name.includes("auth"))
        .map((c) => `${c.name}=${c.value.slice(0, 32)}`)
        .join(";");
      if (authTokens) {
        cacheKey = authTokens;
        const cached = userSessionCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.user;
        }
      }
    } catch {
      // Outside request context (e.g. build time / scripts)
    }

    const supabase = await createClient();
    if (!supabase) return null;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return null;
    }

    const emailVerified = Boolean(
      (user as any).email_confirmed_at || (user as any).confirmed_at || user.email_confirmed_at
    );

    // 1. Fetch Profile (loads memberships + project info in a single efficient query)
    const profile = await withDbRetry(() =>
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

    // Always query projects owned by the user to ensure OWNER access across all owned projects
    const ownedProjects: Array<{ id: string; name: string; slug: string }> = await withDbRetry(() =>
      db.project.findMany({
        where: { ownerId: user.id },
        select: { id: true, name: true, slug: true },
      })
    ).catch(() => []);

    // 2. If profile record is missing, safely backfill it with 'pending' status
    let finalProfile = profile;
    if (!finalProfile) {
      const email = user.email.toLowerCase().trim();
      const displayName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.display_name as string) ||
        email.split("@")[0];

      finalProfile = await withDbRetry(() =>
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

    if (!finalProfile) {
      return null;
    }

    // Normalized memberships
    const memberships = (finalProfile.memberships || []).map((m: any) => ({
      projectId: m.projectId,
      role: normalizeRoleStrict(m.role),
      project: m.project,
    }));

    // Include OWNER role from project ownership (ownerId == user.id) as OWNER membership even if not in project_members
    for (const op of ownedProjects as any[]) {
      if (!memberships.find((m) => m.projectId === op.id)) {
        memberships.push({
          projectId: op.id,
          role: "OWNER" as Role,
          project: op,
        });
      } else {
        // Ensure owner has OWNER, not just ADMIN
        const existing = memberships.find((m) => m.projectId === op.id);
        if (existing && existing.role !== "OWNER") {
          existing.role = "OWNER";
        }
      }
    }

    // Derive highest role across memberships using hierarchy
    let highestRole: Role = "CONTRIBUTOR";
    let highestLevel = 0;
    for (const m of memberships) {
      const lvl = ROLE_HIERARCHY[m.role] ?? 0;
      if (lvl > highestLevel) {
        highestLevel = lvl;
        highestRole = m.role;
      }
    }
    if (memberships.length === 0) highestRole = "CONTRIBUTOR";

    const authUser: AuthUser = {
      id: finalProfile.id,
      email: finalProfile.email,
      displayName: finalProfile.displayName,
      status: finalProfile.status as ProfileStatus,
      emailVerified,
      role: highestRole,
      memberships,
    };

    if (cacheKey) {
      if (userSessionCache.size > 200) {
        const now = Date.now();
        for (const [k, v] of userSessionCache.entries()) {
          if (v.expiresAt <= now) userSessionCache.delete(k);
        }
      }
      userSessionCache.set(cacheKey, {
        user: authUser,
        expiresAt: Date.now() + 15000, // 15 seconds fast TTL
      });
    }

    return authUser;
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    return null;
  }
});

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
 * Requires an approved user account. Throws 401 if unauthenticated, 403 if pending/rejected/suspended or unverified.
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

  let membership = user.memberships.find((m) => m.projectId === projectId);

  // If not found in cached memberships, perform a direct DB check
  if (!membership) {
    const directCheck = await withDbRetry(async () => {
      const proj = await db.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, slug: true, ownerId: true },
      });
      if (!proj) return null;
      if (proj.ownerId === user.id) {
        return { projectId: proj.id, role: "OWNER" as Role, project: proj };
      }
      const member = await db.projectMember.findFirst({
        where: { projectId, userId: user.id },
      });
      if (member) {
        return { projectId: proj.id, role: normalizeRoleStrict(member.role), project: proj };
      }
      return null;
    }).catch(() => null);

    if (directCheck) {
      user.memberships.push(directCheck);
      membership = directCheck;
    }
  }

  if (!membership) {
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
 * Requires owner role on project
 */
export async function requireOwner(projectId: string): Promise<{ user: AuthUser; role: Role }> {
  return requireProjectMember(projectId, "OWNER");
}

/**
 * Requires administrator role on the project or globally.
 */
export async function requireAdmin(projectId?: string): Promise<AuthUser> {
  const user = await requireApprovedUser();

  if (projectId) {
    const { user: authedUser } = await requireProjectMember(projectId, "ADMIN");
    // OWNER also satisfies ADMIN
    if (!hasMinimumRole(authedUser.memberships.find((m) => m.projectId === projectId)?.role, "ADMIN")) {
      throw new AuthError("Administrator privileges required.", 403, "FORBIDDEN");
    }
    // Ensure at least ADMIN level (OWNER passes because hierarchy)
    return authedUser;
  }

  const isAdmin = user.memberships.some((m) => hasMinimumRole(m.role, "ADMIN")) || hasMinimumRole(user.role, "ADMIN");
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
