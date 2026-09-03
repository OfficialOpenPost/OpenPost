import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireProjectMember, requireAdmin, requireOwner, createAuditLog, AuthError } from "@/lib/auth";
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
    const { user: ownerUser } = await requireOwner(id);

    const project = await withDbRetry(() => db.project.findUnique({ where: { id } }));
    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    // Cascade delete all project-related entities in proper dependency order
    await withDbRetry(async () => {
      // 1. Clean up blogs and their dependent relations
      const blogs = await db.blog.findMany({
        where: { projectId: id },
        select: { id: true },
      });
      const blogIds = blogs.map((b) => b.id);

      if (blogIds.length > 0) {
        await db.blogRevision.deleteMany({ where: { blogId: { in: blogIds } } }).catch(() => {});
        await db.blogAuthor.deleteMany({ where: { blogId: { in: blogIds } } }).catch(() => {});
        await db.blogTag.deleteMany({ where: { blogId: { in: blogIds } } }).catch(() => {});
        await db.mediaUsage.deleteMany({ where: { blogId: { in: blogIds } } }).catch(() => {});
        await db.redirect.deleteMany({ where: { blogId: { in: blogIds } } }).catch(() => {});
        await db.blog.deleteMany({ where: { id: { in: blogIds } } }).catch(() => {});
      }

      // 2. Clean up polls
      await db.poll.deleteMany({ where: { projectId: id } }).catch(() => {});

      // 3. Clean up categories, tags, authors, media
      await db.category.deleteMany({ where: { projectId: id } }).catch(() => {});
      await db.tag.deleteMany({ where: { projectId: id } }).catch(() => {});
      await db.author.deleteMany({ where: { projectId: id } }).catch(() => {});
      await db.media.deleteMany({ where: { projectId: id } }).catch(() => {});

      // 4. Clean up webhooks and deliveries
      const webhooks = await db.webhook.findMany({
        where: { projectId: id },
        select: { id: true },
      });
      const webhookIds = webhooks.map((w) => w.id);
      if (webhookIds.length > 0) {
        await db.webhookDelivery.deleteMany({ where: { webhookId: { in: webhookIds } } }).catch(() => {});
        await db.webhook.deleteMany({ where: { id: { in: webhookIds } } }).catch(() => {});
      }

      // 5. Clean up invites, codes, tokens, audit logs, memberships
      await db.invite.deleteMany({ where: { projectId: id } }).catch(() => {});
      await db.connectionCode.deleteMany({ where: { projectId: id } }).catch(() => {});
      await db.cliAuthCode.deleteMany({ where: { projectId: id } }).catch(() => {});
      await db.integration.deleteMany({ where: { projectId: id } }).catch(() => {});
      await db.auditLog.deleteMany({ where: { projectId: id } }).catch(() => {});
      await db.projectMember.deleteMany({ where: { projectId: id } }).catch(() => {});

      // 6. Delete project record
      await db.project.delete({ where: { id } });
    });

    await createAuditLog({
      actorId: ownerUser.id,
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
