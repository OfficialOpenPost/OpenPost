import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import {
  requireAdmin,
  createAuditLog,
  normalizeRole,
  Role,
  ProfileStatus,
  AuthError,
} from "@/lib/auth";
import { z } from "zod";

const updateUserSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
  status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
  role: z.enum(["ADMIN", "EDITOR", "WRITER"]).optional(),
  projectId: z.string().uuid().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["ADMIN", "EDITOR", "WRITER"]).default("WRITER"),
  projectId: z.string().uuid("Valid project ID required"),
  name: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const [profiles, invites] = await Promise.all([
      withDbRetry(() =>
        db.profile.findMany({
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            email: true,
            displayName: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            memberships: {
              where: projectId ? { projectId } : undefined,
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
            ...(projectId ? { projectId } : {}),
          },
          orderBy: { createdAt: "desc" },
        })
      ),
    ]);

    const formattedUsers = profiles.map((p) => {
      // Find role for project if scoped, or highest role
      let activeRole: Role = "WRITER";
      for (const m of p.memberships) {
        const nr = normalizeRole(m.role);
        if (nr === "ADMIN") activeRole = "ADMIN";
        else if (nr === "EDITOR" && activeRole !== "ADMIN") activeRole = "EDITOR";
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
          role: normalizeRole(m.role),
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
    const body = await req.json().catch(() => ({}));
    const parsed = inviteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const { email, role, projectId, name } = parsed.data;
    const cleanEmail = email.trim().toLowerCase();

    // Verify admin permission on project
    const adminUser = await requireAdmin(projectId);

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

    const { id, status, role, projectId } = parsed.data;
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
      updatedProfile = await withDbRetry(() =>
        db.profile.update({
          where: { id },
          data: { status },
        })
      );

      await createAuditLog({
        actorId: adminUser.id,
        projectId: projectId || null,
        action: `user.status_${status}`,
        targetId: id,
        metadata: { previousStatus: targetProfile.status, newStatus: status, email: targetProfile.email },
      });
    }

    // 2. Update Role in Project if provided
    if (role && projectId) {
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
    const projectId = searchParams.get("projectId");

    if (!id) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "User ID is required." } },
        { status: 400 }
      );
    }

    const adminUser = await requireAdmin(projectId || undefined);

    // Prevent deleting oneself
    if (adminUser.id === id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You cannot remove your own account." } },
        { status: 403 }
      );
    }

    if (projectId) {
      await withDbRetry(() =>
        db.projectMember.deleteMany({
          where: { projectId, userId: id },
        })
      );

      await createAuditLog({
        actorId: adminUser.id,
        projectId,
        action: "project.member_removed",
        targetId: id,
      });
    } else {
      // Remove all memberships and mark suspended/rejected
      await withDbRetry(() =>
        db.$transaction([
          db.projectMember.deleteMany({ where: { userId: id } }),
          db.profile.update({ where: { id }, data: { status: "rejected" } }),
        ])
      );

      await createAuditLog({
        actorId: adminUser.id,
        action: "user.removed",
        targetId: id,
      });
    }

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
