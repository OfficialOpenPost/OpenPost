import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, createAuditLog, AuthError } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/rbac";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(50),
  description: z.string().max(300).optional(),
  domain: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const user = await requireApprovedUser();

    // Query projects where user has membership or is owner
    const projects = await withDbRetry(() =>
      db.project.findMany({
        where: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
        orderBy: { createdAt: "asc" },
        include: {
          _count: {
            select: {
              blogs: true,
              categories: true,
              media: true,
              authors: true,
              webhooks: true,
            },
          },
        },
      })
    );

    return NextResponse.json({ data: projects });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "PROJECT_FETCH_FAILED";
    return NextResponse.json(
      { error: { code, message: status < 500 ? error.message : "Failed to load projects." } },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApprovedUser();

    // Only OWNER and ADMIN can create new projects (except first project)
    const hasProjects = user.memberships.length > 0;
    if (hasProjects) {
      const isHighPrivileged = user.memberships.some(
        (m) => hasMinimumRole(m.role, "ADMIN")
      );
      if (!isHighPrivileged) {
        throw new AuthError(
          "Only owners and administrators can create new projects.",
          403,
          "FORBIDDEN"
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const { name, slug, description, domain, settings } = parsed.data;

    // Sanitize slug
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!cleanSlug) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid project slug identifier." } },
        { status: 400 }
      );
    }

    // Check slug uniqueness — auto-append -2, -3 etc. if taken.
    // Bounded: an unbounded `while(true)` probing one row per iteration is a
    // cheap DoS lever (each probe is a round-trip). One prefix query instead.
    const candidates = await withDbRetry(() =>
      db.project.findMany({
        where: {
          OR: [
            { slug: cleanSlug },
            { slug: { startsWith: `${cleanSlug}-` } },
          ],
        },
        select: { slug: true },
      })
    ).catch(() => [] as { slug: string }[]);

    const taken = new Set((candidates || []).map((p: { slug: string }) => p.slug));
    let finalSlug = cleanSlug;
    if (taken.has(finalSlug)) {
      let counter = 2;
      // Hard cap prevents an infinite probe loop.
      while (taken.has(`${cleanSlug}-${counter}`) && counter < 1000) counter++;
      finalSlug = `${cleanSlug}-${counter}`;
    }

    // Create Project and add creator as ADMIN ProjectMember atomically
    const project = await withDbRetry(() =>
      db.$transaction(async (tx) => {
        const newProject = await tx.project.create({
          data: {
            name: name.trim(),
            slug: finalSlug,
            description: description?.trim() || null,
            ownerId: user.id,
            settings: {
              domain: domain || null,
              siteTitle: name.trim(),
              primaryColor: "#FEA611",
              ...(settings || {}),
            },
          },
          include: {
            _count: {
              select: {
                blogs: true,
                categories: true,
                media: true,
                authors: true,
                webhooks: true,
              },
            },
          },
        });

        // Add creator as ADMIN in project_members
        await tx.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: newProject.id,
              userId: user.id,
            },
          },
          update: { role: "ADMIN" },
          create: {
            projectId: newProject.id,
            userId: user.id,
            role: "ADMIN",
          },
        });

        return newProject;
      })
    );

    await createAuditLog({
      actorId: user.id,
      projectId: project.id,
      action: "project.created",
      targetId: project.id,
      metadata: { name: project.name, slug: project.slug },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "PROJECT_CREATE_FAILED";
    return NextResponse.json(
      { error: { code, message: status < 500 ? error.message : "Failed to create project." } },
      { status }
    );
  }
}
