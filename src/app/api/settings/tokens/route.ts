import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireAdmin, createAuditLog, AuthError, hasMinimumRole } from "@/lib/auth";
import { generateApiToken } from "@/lib/apiToken";
import { z } from "zod";

const createTokenSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  projectId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const { searchParams } = new URL(req.url);
    const projectIdParam = searchParams.get("projectId");

    // SECURITY: token metadata is project-scoped. We only ever return tokens for
    // projects where the caller is ADMIN/OWNER — and an explicit ?projectId must
    // pass the same check. The previous implementation fell through to an
    // *unfiltered* query whenever the membership list was empty (e.g. OWNER-only
    // users, whose role was missing from the filter), leaking every tenant's
    // token records including `tokenHash`.
    const managedProjectIds = user.memberships
      .filter((m) => hasMinimumRole(m.role, "ADMIN"))
      .map((m) => m.projectId);

    let whereClause: any = { revokedAt: null };

    if (projectIdParam) {
      await requireAdmin(projectIdParam);
      whereClause.projectId = projectIdParam;
    } else {
      // Never allow an unscoped listing — empty access means empty result set.
      if (managedProjectIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
      whereClause.projectId = { in: managedProjectIds };
    }

    const integrations = await withDbRetry(() =>
      db.integration.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        // SECURITY: `tokenHash` is a server-side credential lookup value and must
        // never leave the server (it enables offline brute-force / pass-the-hash).
        select: {
          id: true,
          name: true,
          projectId: true,
          tokenPrefix: true,
          permissions: true,
          createdBy: true,
          createdAt: true,
          lastUsedAt: true,
          revokedAt: true,
          project: {
            select: { id: true, name: true, slug: true },
          },
        },
      })
    );

    return NextResponse.json({ data: integrations });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "TOKENS_FETCH_FAILED";
    return NextResponse.json(
      { error: { code, message: status < 500 ? error.message : "Failed to fetch tokens." } },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const body = await req.json().catch(() => ({}));
    const parsed = createTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const { name, projectId: explicitProjectId, permissions } = parsed.data;

    let targetProjectId = explicitProjectId;

    // Auto-resolve project if not explicitly provided
    if (!targetProjectId) {
      const adminMembership = user.memberships.find((m) => m.role === "ADMIN");
      if (adminMembership) {
        targetProjectId = adminMembership.projectId;
      } else if (user.memberships.length > 0) {
        targetProjectId = user.memberships[0].projectId;
      } else {
        // Find existing project owned by user or create default
        const existingProject = await withDbRetry(() =>
          db.project.findFirst({ where: { ownerId: user.id } })
        );

        if (existingProject) {
          targetProjectId = existingProject.id;
          // Ensure membership
          await withDbRetry(() =>
            db.projectMember.upsert({
              where: { projectId_userId: { projectId: existingProject.id, userId: user.id } },
              create: { projectId: existingProject.id, userId: user.id, role: "ADMIN" },
              update: { role: "ADMIN" },
            })
          ).catch(() => {});
        } else {
          const newProject = await withDbRetry(() =>
            db.project.create({
              data: {
                name: "Main Publication",
                slug: "main-publication",
                ownerId: user.id,
                members: {
                  create: {
                    userId: user.id,
                    role: "ADMIN",
                  },
                },
              },
            })
          );
          targetProjectId = newProject.id;
        }
      }
    }

    // Verify user is approved and ADMIN on the resolved project
    const adminUser = await requireAdmin(targetProjectId);

    // Verify project exists
    const project = await withDbRetry(() =>
      db.project.findUnique({ where: { id: targetProjectId } })
    );

    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Target project not found." } },
        { status: 404 }
      );
    }

    // Generate secure token (op_live_...)
    const { rawToken, tokenHash, tokenPrefix } = generateApiToken();

    const allowedPermissions =
      Array.isArray(permissions) && permissions.length > 0
        ? permissions
        : ["READ_PUBLISHED_POSTS", "READ_CATEGORIES", "READ_TAGS", "READ_AUTHORS", "RECEIVE_WEBHOOKS"];

    const created = await withDbRetry(() =>
      db.integration.create({
        data: {
          name: name.trim(),
          projectId: targetProjectId,
          tokenHash,
          tokenPrefix,
          permissions: allowedPermissions,
          createdBy: adminUser.id,
        },
        include: {
          project: {
            select: { id: true, name: true, slug: true },
          },
        },
      })
    );

    await createAuditLog({
      actorId: adminUser.id,
      projectId: targetProjectId,
      action: "integration.token_created",
      targetId: created.id,
      metadata: { name: created.name, tokenPrefix, permissions: allowedPermissions },
    });

    // Return the raw token ONLY once upon creation
    return NextResponse.json(
      {
        data: {
          id: created.id,
          name: created.name,
          projectId: created.projectId,
          projectName: project.name,
          tokenPrefix: created.tokenPrefix,
          rawToken,
          permissions: created.permissions,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "TOKEN_CREATE_FAILED";
    return NextResponse.json(
      { error: { code, message: status < 500 ? error.message : "Failed to create API token." } },
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
        { error: { code: "VALIDATION_ERROR", message: "Token ID required." } },
        { status: 400 }
      );
    }

    const integration = await withDbRetry(() =>
      db.integration.findUnique({ where: { id } })
    );

    // SECURITY: a caller-chosen ?projectId must never be used to authorize a
    // resource it doesn't own — otherwise an admin of Project A could revoke
    // Project B's live tokens. Mismatched/foreign ids are reported as 404 so we
    // don't confirm the existence of other tenants' tokens.
    if (!integration || (projectId && projectId !== integration.projectId)) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Integration token not found." } },
        { status: 404 }
      );
    }

    const adminUser = await requireAdmin(integration.projectId);

    // Revoke token by setting revokedAt timestamp
    await withDbRetry(() =>
      db.integration.update({
        where: { id },
        data: { revokedAt: new Date() },
      })
    );

    await createAuditLog({
      actorId: adminUser.id,
      projectId: integration.projectId,
      action: "integration.token_revoked",
      targetId: id,
      metadata: { tokenPrefix: integration.tokenPrefix },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "TOKEN_DELETE_FAILED";
    return NextResponse.json(
      { error: { code, message: status < 500 ? error.message : "Failed to revoke token." } },
      { status }
    );
  }
}
