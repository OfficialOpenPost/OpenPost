import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import {
  requireAdmin,
  requireProjectMember,
  requirePermission,
  createAuditLog,
  normalizeRole,
  normalizeRoleStrict,
  hasMinimumRole,
  hasPermission,
  canManageRole,
  Role,
  ProfileStatus,
  AuthError,
} from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

const updateUserSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
  status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "AUTHOR", "CONTRIBUTOR", "WRITER"]).optional(),
  projectId: z.string().uuid("Valid project ID required"),
});

const inviteUserSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "AUTHOR", "CONTRIBUTOR", "WRITER"]).default("CONTRIBUTOR"),
  projectId: z.string().uuid("Valid project ID required"),
  name: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "projectId is required." } },
        { status: 400 }
      );
    }

    const adminUser = await requireAdmin(projectId);

    const [profiles, invitesRaw, pendingWithoutMembership] = await Promise.all([
      withDbRetry(() =>
        db.profile.findMany({
          where: {
            memberships: { some: { projectId } },
          },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            email: true,
            displayName: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            memberships: {
              where: { projectId },
              include: {
                project: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        })
      ),
      withDbRetry(() =>
        db.invite.findMany({
          where: {
            usedAt: null,
            projectId,
          },
          orderBy: { createdAt: "desc" },
        })
      ),
      // Also fetch pending users who signed up but have no project membership yet
      withDbRetry(() =>
        db.profile.findMany({
          where: {
            status: "pending",
            memberships: { none: { projectId } },
          },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            email: true,
            displayName: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            memberships: {
              include: {
                project: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        })
      ),
    ]);
    // Sanitize invites — never expose raw token, mask it
    const invites = (invitesRaw as any[]).map((inv) => ({
      ...inv,
      token: undefined,
      tokenPreview: inv.token ? `${String(inv.token).slice(0, 8)}…` : null,
      tokenMasked: true,
    }));

    // Merge pending users without memberships into the list
    const allProfiles = [...profiles];
    for (const pu of pendingWithoutMembership) {
      if (!allProfiles.find((p) => p.id === pu.id)) {
        allProfiles.push(pu as any);
      }
    }

    const formattedUsers = allProfiles.map((p) => {
      // Find role for project if scoped, or highest role via hierarchy
      let activeRole: Role = "CONTRIBUTOR";
      let maxLvl = 0;
      for (const m of p.memberships) {
        const nr = normalizeRoleStrict(m.role);
        const lvl = ({ OWNER: 5, ADMIN: 4, EDITOR: 3, AUTHOR: 2, CONTRIBUTOR: 1 } as any)[nr] || 0;
        if (lvl > maxLvl) {
          maxLvl = lvl;
          activeRole = nr;
        }
      }

      return {
        id: p.id,
        name: p.displayName || p.email.split("@")[0],
        email: p.email,
        status: p.status,
        role: activeRole,
        memberships: p.memberships.map((m) => ({
          projectId: m.projectId,
          projectName: m.project.name,
          projectSlug: m.project.slug,
          role: normalizeRoleStrict(m.role),
        })),
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      data: {
        users: formattedUsers,
        invites,
        currentUser: {
          id: adminUser.id,
          role: adminUser.role,
        },
      },
    });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "USERS_FETCH_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to fetch users." } },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 invites per minute per IP
    const ip = getClientIp(req as unknown as Request);
    const rl = rateLimit(`invite:${ip}`, { windowMs: 60_000, max: 10 });
    if (!rl.allowed) {
      return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many invitations. Try again later." } }, { status: 429, headers: { "Retry-After": Math.ceil((rl.resetAt - Date.now()) / 1000).toString() } });
    }
    const body = await req.json().catch(() => ({}));
    const parsed = inviteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    let { email, role: rawRole, projectId, name } = parsed.data as any;
    const role = normalizeRoleStrict(rawRole) as any;
    const cleanEmail = email.trim().toLowerCase();

    // Verify admin permission on project — prevent privilege escalation to OWNER
    const adminUser = await requireAdmin(projectId);
    {
      const actorRole = adminUser.memberships.find((m) => m.projectId === projectId)?.role || adminUser.role;
      if (role === "OWNER" && normalizeRoleStrict(actorRole as string) !== "OWNER") {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "Only the project owner can invite an OWNER." } }, { status: 403 });
      }
      // ADMIN cannot invite OWNER, EDITOR+ cannot invite ADMIN etc — enforce via canManageRole
      if (!canManageRole(normalizeRoleStrict(actorRole as string) as any, "CONTRIBUTOR" as any, role as any) && actorRole !== "OWNER") {
        // For invites, treat target as desired role
        if (normalizeRoleStrict(actorRole as string) !== "OWNER" && role === "OWNER") {
          return NextResponse.json({ error: { code: "FORBIDDEN", message: "Insufficient permission to invite this role." } }, { status: 403 });
        }
      }
    }

    // 1. Check if user already has profile
    let profile = await withDbRetry(() =>
      db.profile.findUnique({ where: { email: cleanEmail } })
    ).catch(() => null);

    if (profile) {
      // Add or update project membership
      const membership = await withDbRetry(() =>
        db.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId,
              userId: profile!.id,
            },
          },
          update: { role },
          create: {
            projectId,
            userId: profile!.id,
            role,
          },
        })
      );

      await createAuditLog({
        actorId: adminUser.id,
        projectId,
        action: "project.member_added",
        targetId: profile.id,
        metadata: { email: cleanEmail, role },
      });

      return NextResponse.json({ data: { user: profile, membership } }, { status: 201 });
    }

    // 2. Otherwise create project invitation
    const invite = await withDbRetry(() =>
      db.invite.create({
        data: {
          email: cleanEmail,
          projectId,
          role,
          createdBy: adminUser.id,
        },
      })
    );

    await createAuditLog({
      actorId: adminUser.id,
      projectId,
      action: "project.invite_created",
      targetId: invite.id,
      metadata: { email: cleanEmail, role },
    });

    return NextResponse.json({ data: { invite } }, { status: 201 });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "INVITE_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to invite user." } },
      { status }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message ?? "Invalid parameters" } },
        { status: 400 }
      );
    }

    let { id, status, role: rawRole, projectId } = parsed.data as any;
    const role = rawRole ? normalizeRoleStrict(rawRole) : undefined;
    const adminUser = await requireAdmin(projectId);

    // SECURITY: Prevent user from modifying own status or role (no self-approval or self-promotion)
    if (adminUser.id === id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You cannot modify your own administrative status or role." } },
        { status: 403 }
      );
    }

    const targetProfile = await withDbRetry(() =>
      db.profile.findUnique({ where: { id } })
    );

    if (!targetProfile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User profile not found." } },
        { status: 404 }
      );
    }

    // 1. Update Profile Status if provided (e.g. pending -> approved, approved -> suspended)
    let updatedProfile = targetProfile;
    if (status && status !== targetProfile.status) {
      // Check if target user has a membership in this project
      let targetMembership = await withDbRetry(() =>
        db.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: id } },
        })
      ).catch(() => null);

      // If approving a pending user without membership, create one with default role
      if (status === "approved" && !targetMembership) {
        const defaultRole = role || "CONTRIBUTOR";
        targetMembership = await withDbRetry(() =>
          db.projectMember.upsert({
            where: { projectId_userId: { projectId, userId: id } },
            update: { role: defaultRole },
            create: { projectId, userId: id, role: defaultRole },
          })
        );
      }

      if (!targetMembership && status !== "approved") {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "User is not a member of this project." } },
          { status: 404 }
        );
      }

      updatedProfile = await withDbRetry(() =>
        db.profile.update({
          where: { id },
          data: { status },
        })
      );

      await createAuditLog({
        actorId: adminUser.id,
        projectId,
        action: `user.status_${status}`,
        targetId: id,
        metadata: { previousStatus: targetProfile.status, newStatus: status, email: targetProfile.email },
      });
    }

    // 2. Update Role in Project if provided — enforce hierarchy and owner protection
    if (role && projectId) {
      // Verify target membership project scoping and role management permission
      const actorMembership = adminUser.memberships.find((m) => m.projectId === projectId);
      const actorRole = actorMembership ? normalizeRoleStrict(actorMembership.role) : normalizeRoleStrict(adminUser.role as string);

      // Fetch target current role for canManage check
      const targetMember = await withDbRetry(() =>
        db.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: id } } })
      ).catch(() => null);
      const targetCurrentRole = targetMember ? normalizeRoleStrict((targetMember as any).role) : "CONTRIBUTOR" as Role;

      if (!canManageRole(actorRole as any, targetCurrentRole as any, role as any)) {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "Insufficient permission to assign this role. Only OWNER can manage OWNER." } }, { status: 403 });
      }
      // Prevent demoting/removing last OWNER
      if (targetCurrentRole === "OWNER" && role !== "OWNER") {
        const ownerCount = await withDbRetry(() => db.projectMember.count({ where: { projectId, role: "OWNER" as any } })).catch(() => 1);
        if (ownerCount <= 1) {
          // Check if project ownerId is same as target
          const proj = await withDbRetry(() => db.project.findUnique({ where: { id: projectId } })).catch(() => null);
          if (proj && (proj as any).ownerId === id) {
            return NextResponse.json({ error: { code: "FORBIDDEN", message: "Cannot demote the sole project owner. Transfer ownership first." } }, { status: 403 });
          }
        }
      }
      // Prevent ADMIN from creating OWNER
      if (role === "OWNER" && actorRole !== "OWNER") {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "Only OWNER can assign OWNER role." } }, { status: 403 });
      }

      await withDbRetry(() =>
        db.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId,
              userId: id,
            },
          },
          update: { role },
          create: {
            projectId,
            userId: id,
            role,
          },
        })
      );

      // Also keep legacy users table in sync if row exists
      await withDbRetry(() =>
        db.user.update({
          where: { id },
          data: { role },
        })
      ).catch(() => {});

      await createAuditLog({
        actorId: adminUser.id,
        projectId,
        action: "user.role_changed",
        targetId: id,
        metadata: { newRole: role, email: targetProfile.email },
      });
    }

    return NextResponse.json({
      data: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        status: updatedProfile.status,
        role: role || undefined,
      },
    });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "USER_UPDATE_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to update user." } },
      { status }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const inviteId = searchParams.get("inviteId");
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "projectId is required." } },
        { status: 400 }
      );
    }

    if (inviteId) {
      const adminUser = await requireAdmin(projectId);
      await withDbRetry(() =>
        db.invite.deleteMany({
          where: { id: inviteId, projectId },
        })
      );

      await createAuditLog({
        actorId: adminUser.id,
        projectId,
        action: "project.invite_revoked",
        targetId: inviteId,
      });

      return NextResponse.json({ data: { success: true, revoked: true } });
    }

    if (!id) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "User ID or Invite ID is required." } },
        { status: 400 }
      );
    }

    const adminUser = await requireAdmin(projectId);

    // Prevent deleting oneself
    if (adminUser.id === id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You cannot remove your own account." } },
        { status: 403 }
      );
    }

    // Get target user info before deletion for audit
    const targetProfile = await withDbRetry(() =>
      db.profile.findUnique({ where: { id }, select: { email: true, displayName: true } })
    ).catch(() => null);

    // Remove from project membership
    await withDbRetry(() =>
      db.projectMember.deleteMany({
        where: { projectId, userId: id },
      })
    );

    // Check if user has any other project memberships
    const otherMemberships = await withDbRetry(() =>
      db.projectMember.count({ where: { userId: id } })
    ).catch(() => 0);

    // If no other memberships, perform full cleanup and permanent deletion
    if (otherMemberships === 0) {
      // 1. Reassign project ownership — transfer owned projects to deleting admin
      const ownedProjects = await withDbRetry(() =>
        db.project.findMany({ where: { ownerId: id }, select: { id: true } })
      ).catch(() => []);

      for (const project of ownedProjects) {
        await withDbRetry(() =>
          db.project.update({
            where: { id: project.id },
            data: { ownerId: adminUser.id },
          })
        );
      }

      // 2. Delete content created by this user (RESTRICT FKs block profile deletion)
      // Delete blog revisions first (child of blogs)
      await withDbRetry(() =>
        db.blogRevision.deleteMany({ where: { createdBy: id } })
      ).catch(() => {});

      // Delete blogs created by this user
      await withDbRetry(() =>
        db.blog.deleteMany({ where: { createdBy: id } })
      ).catch(() => {});

      // 3. Nullify media uploadedBy (RESTRICT FK blocks deletion)
      await withDbRetry(() =>
        db.$executeRaw`UPDATE media SET uploaded_by = ${adminUser.id} WHERE uploaded_by = ${id}`
      ).catch(() => {});

      // 4. Delete invites created by this user
      await withDbRetry(() =>
        db.invite.deleteMany({ where: { createdBy: id } })
      ).catch(() => {});

      // 5. Delete integrations, connection codes, CLI auth codes created by this user
      await withDbRetry(() =>
        db.integration.deleteMany({ where: { createdBy: id } })
      ).catch(() => {});
      await withDbRetry(() =>
        db.connectionCode.deleteMany({ where: { createdBy: id } })
      ).catch(() => {});
      await withDbRetry(() =>
        db.cliAuthCode.deleteMany({ where: { createdBy: id } })
      ).catch(() => {});

      // 6. Delete from users table (legacy)
      await withDbRetry(() =>
        db.user.delete({ where: { id } })
      ).catch(() => {});

      // 7. Delete profile
      await withDbRetry(() =>
        db.profile.delete({ where: { id } })
      ).catch(() => {});

      // 8. Delete from Supabase Auth
      const supabase = await createClient();
      if (supabase) {
        await supabase.auth.admin.deleteUser(id).catch((err: any) => {
          console.warn("Failed to delete Supabase auth user:", err?.message);
        });
      }
    }

    await createAuditLog({
      actorId: adminUser.id,
      projectId,
      action: "project.member_removed",
      targetId: id,
      metadata: { email: targetProfile?.email, name: targetProfile?.displayName, permanentDeletion: otherMemberships === 0 },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "USER_DELETE_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to remove user." } },
      { status }
    );
  }
}
