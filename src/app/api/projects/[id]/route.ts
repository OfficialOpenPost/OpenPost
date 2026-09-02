import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireProjectMember, requireAdmin, createAuditLog, AuthError } from "@/lib/auth";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(50).optional(),
  description: z.string().max(300).nullable().optional(),
  settings: z.record(z.any()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireProjectMember(id, "CONTRIBUTOR");

    const project = await withDbRetry(() =>
      db.project.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              blogs: true,
              categories: true,
              tags: true,
              media: true,
              authors: true,
              webhooks: true,
              members: true,
            },
          },
        },
      })
    );

    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: project });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "FETCH_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to load project." } },
      { status }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminUser = await requireAdmin(id);

    const body = await req.json().catch(() => ({}));
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const existing = await withDbRetry(() => db.project.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    const { name, slug, description, settings } = parsed.data;
    let cleanSlug = existing.slug;

    if (slug && slug !== existing.slug) {
      cleanSlug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const dup = await withDbRetry(() =>
        db.project.findFirst({
          where: { slug: cleanSlug, id: { not: id } },
        })
      );

      if (dup) {
        return NextResponse.json(
          { error: { code: "SLUG_EXISTS", message: "Project slug identifier is already in use." } },
          { status: 409 }
        );
      }
    }

    const updated = await withDbRetry(() =>
      db.project.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : existing.name,
          slug: cleanSlug,
          description: description !== undefined ? description : existing.description,
          settings: settings !== undefined ? { ...(existing.settings as any), ...settings } : existing.settings,
        },
      })
    );

    await createAuditLog({
      actorId: adminUser.id,
      projectId: id,
      action: "project.updated",
      targetId: id,
      metadata: { name: updated.name, slug: updated.slug },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "UPDATE_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to update project." } },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminUser = await requireAdmin(id);

    const count = await withDbRetry(() => db.project.count());
    if (count <= 1) {
      return NextResponse.json(
        { error: { code: "CANNOT_DELETE_LAST", message: "Cannot delete the only remaining project." } },
        { status: 400 }
      );
    }

    await withDbRetry(() => db.project.delete({ where: { id } }));

    await createAuditLog({
      actorId: adminUser.id,
      action: "project.deleted",
      targetId: id,
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "DELETE_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to delete project." } },
      { status }
    );
  }
}
