import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireProjectMember, requireAdmin, createAuditLog, AuthError } from "@/lib/auth";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(50).optional(),
  description: z.string().max(300).nullable().optional(),
  settings: z.record(z.any()).optional(),
  // Site config fields
  siteName: z.string().max(100).nullable().optional(),
  siteTagline: z.string().max(200).nullable().optional(),
  siteDescription: z.string().max(500).nullable().optional(),
  siteLogoUrl: z.string().max(500).nullable().optional(),
  siteFaviconUrl: z.string().max(500).nullable().optional(),
  sitePrimaryColor: z.string().max(7).nullable().optional(),
  siteUrl: z.string().max(500).nullable().optional(),
  siteLanguage: z.string().max(10).nullable().optional(),
  siteTimezone: z.string().max(50).nullable().optional(),
  socialTwitter: z.string().max(500).nullable().optional(),
  socialGithub: z.string().max(500).nullable().optional(),
  socialLinkedin: z.string().max(500).nullable().optional(),
  socialYoutube: z.string().max(500).nullable().optional(),
  socialInstagram: z.string().max(500).nullable().optional(),
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

    const {
      name, slug, description, settings,
      siteName, siteTagline, siteDescription, siteLogoUrl, siteFaviconUrl,
      sitePrimaryColor, siteUrl, siteLanguage, siteTimezone,
      socialTwitter, socialGithub, socialLinkedin, socialYoutube, socialInstagram,
    } = parsed.data;
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
          // Site config fields
          ...(siteName !== undefined && { siteName }),
          ...(siteTagline !== undefined && { siteTagline }),
          ...(siteDescription !== undefined && { siteDescription }),
          ...(siteLogoUrl !== undefined && { siteLogoUrl }),
          ...(siteFaviconUrl !== undefined && { siteFaviconUrl }),
          ...(sitePrimaryColor !== undefined && { sitePrimaryColor }),
          ...(siteUrl !== undefined && { siteUrl }),
          ...(siteLanguage !== undefined && { siteLanguage }),
          ...(siteTimezone !== undefined && { siteTimezone }),
          ...(socialTwitter !== undefined && { socialTwitter }),
          ...(socialGithub !== undefined && { socialGithub }),
          ...(socialLinkedin !== undefined && { socialLinkedin }),
          ...(socialYoutube !== undefined && { socialYoutube }),
          ...(socialInstagram !== undefined && { socialInstagram }),
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

    const project = await withDbRetry(() => db.project.findUnique({ where: { id } }));
    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    // Check if project has real content
    const counts = await withDbRetry(() =>
      Promise.all([
        db.blog.count({ where: { projectId: id } }),
        db.media.count({ where: { projectId: id } }),
      ])
    );
    const blogCount = counts[0];
    const mediaCount = counts[1];

    if (blogCount > 0 || mediaCount > 0) {
      return NextResponse.json(
        {
          error: {
            code: "PROJECT_HAS_CONTENT",
            message: `Cannot delete project with existing content (${blogCount} posts, ${mediaCount} media). Delete all content first or transfer ownership.`,
          },
        },
        { status: 400 }
      );
    }

    // Delete project — cascades handle all related records
    await withDbRetry(() => db.project.delete({ where: { id } }));

    await createAuditLog({
      actorId: adminUser.id,
      action: "project.deleted",
      targetId: id,
      metadata: { name: project.name, slug: project.slug },
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
