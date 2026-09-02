import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { z } from "zod";
import { requireApprovedUser, requireProjectMember, requirePermission, hasPermission, hasMinimumRole, AuthError, createAuditLog } from "@/lib/auth";
import { countWords, readingTime as calcReadingTime } from "@/lib/publish";
import { triggerWebhooks } from "@/lib/webhooks";

const createSchema = z.object({
  title: z.string().optional().default("Untitled Article"),
  slug: z.string().optional().default("untitled"),
  content: z.any().optional().default({}),
  status: z.enum(["draft", "published", "scheduled", "archived", "trash"]).optional().default("draft"),
  projectId: z.string().uuid("Project ID must be a valid UUID").nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  category: z.any().optional(),
  featuredImageId: z.string().uuid().nullable().optional(),
  featuredImage: z.any().optional(),
  authorIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  tags: z.any().optional(),
  scheduledAt: z.string().nullable().optional(),
  seo: z.any().optional(),
  id: z.string().uuid().nullable().optional(),
  revisionLabel: z.string().nullable().optional(),
}).passthrough();

function extractMediaUrls(content: any): string[] {
  const urls: string[] = [];
  const walk = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node.type === "image" && node.attrs?.src) urls.push(node.attrs.src);
    if (node.type === "gallery" && Array.isArray(node.attrs?.images)) {
      node.attrs.images.forEach((im: any) => im.src && urls.push(im.src));
    }
    if (node.type === "videoBlock" && node.attrs?.src) urls.push(node.attrs.src);
    if (node.attrs?.poster) urls.push(node.attrs.poster);
    if (node.content) walk(node.content);
    if (node.attrs?.items) walk(node.attrs.items);
  };
  walk(content?.content ?? content);
  return [...new Set(urls)];
}

async function syncMediaUsage(blogId: string, content: any) {
  try {
    const urls = extractMediaUrls(content);
    if (!urls.length) {
      await withDbRetry(() => db.mediaUsage.deleteMany({ where: { blogId } })).catch(() => {});
      return;
    }

    let mediaIds: string[] = [];
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    for (const url of urls) {
      const m = url.match(uuidRegex);
      if (m) mediaIds.push(m[0]);
    }

    mediaIds = [...new Set(mediaIds)];
    if (!mediaIds.length) return;

    const existing = await withDbRetry(() =>
      db.mediaUsage.findMany({ where: { blogId }, select: { mediaId: true } })
    ).catch(() => [] as any);
    const existingIds = new Set((existing as any[]).map((r) => r.mediaId));
    const newIds = new Set(mediaIds);
    const toDelete = [...existingIds].filter((id) => !newIds.has(id));
    const toAdd = [...newIds].filter((id) => !existingIds.has(id));

    if (toDelete.length) {
      await withDbRetry(() =>
        db.mediaUsage.deleteMany({ where: { blogId, mediaId: { in: toDelete } } })
      ).catch(() => {});
    }
    for (const mediaId of toAdd) {
      const exists = await withDbRetry(() => db.media.findUnique({ where: { id: mediaId } })).catch(() => null);
      if (exists) {
        await withDbRetry(() => db.mediaUsage.create({ data: { blogId, mediaId } })).catch(() => {});
      }
    }
  } catch (e) {
    // Non-blocking
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId") || req.headers.get("x-openpost-project");

    if (!projectId) {
      // Find projects user belongs to — strict project scoping, no legacy null leak
      const memberships = await withDbRetry(() =>
        db.projectMember.findMany({
          where: { userId: user.id },
          select: { projectId: true },
        })
      );
      const projectIds = memberships.map((m) => m.projectId);
      if (projectIds.length === 0) {
        return NextResponse.json({ data: [] });
      }

      const blogs = await withDbRetry(() =>
        db.blog.findMany({
          where: {
            projectId: { in: projectIds },
            ...(status && status !== "all" ? { status: status as any } : {}),
          },
          take: Math.min(100, Math.max(1, limit)),
          orderBy: { updatedAt: "desc" },
          include: {
            category: { select: { id: true, name: true, slug: true } },
            author: { select: { name: true, email: true } },
            featuredImage: { select: { id: true, variants: true } },
            project: { select: { id: true, name: true, slug: true } },
          },
        })
      );

      return NextResponse.json({ data: blogs });
    }

    // Explicit project requested — verify membership (CONTRIBUTOR minimum to view)
    await requireProjectMember(projectId, "CONTRIBUTOR");

    const blogs = await withDbRetry(() =>
      db.blog.findMany({
        where: {
          projectId,
          ...(status && status !== "all" ? { status: status as any } : {}),
        },
        take: Math.min(100, Math.max(1, limit)),
        orderBy: { updatedAt: "desc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { name: true, email: true } },
          featuredImage: { select: { id: true, variants: true } },
          project: { select: { id: true, name: true, slug: true } },
        },
      })
    );

    return NextResponse.json({ data: blogs });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "FETCH_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to fetch articles." } },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message ?? "Invalid post data" } },
        { status: 400 }
      );
    }

    let {
      title,
      slug,
      content,
      status = "draft",
      projectId,
      category,
      categoryId,
      featuredImage,
      featuredImageId,
      authorIds,
      tags,
      tagIds,
      scheduledAt,
      seo,
      id,
      revisionLabel,
    } = parsed.data;

    // Resolve target project ID
    let targetProjectId = projectId || (req.headers.get("x-openpost-project") as string) || null;
    if (!targetProjectId) {
      const member = await withDbRetry(() =>
        db.projectMember.findFirst({
          where: { userId: user.id },
          select: { projectId: true },
        })
      );
      targetProjectId = member?.projectId || null;
    }
    if (!targetProjectId) {
      const firstProj = await withDbRetry(() =>
        db.project.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } })
      );
      targetProjectId = firstProj?.id || null;
    }

    // Verify project membership — fail closed, never trust client-supplied projectId
    if (!targetProjectId) {
      return NextResponse.json({ error: { code: "PROJECT_REQUIRED", message: "Project assignment required." } }, { status: 400 });
    }
    // Ensure user is member of target project (any role can create draft, publish gated later)
    await requireProjectMember(targetProjectId, "CONTRIBUTOR");

    // If attempting to publish or schedule, require publish permission — DO NOT swallow errors
    if (status === "published" || status === "scheduled") {
      const { role } = await requireProjectMember(targetProjectId);
      // EDITOR+ required to publish/schedule; AUTHOR/CONTRIBUTOR blocked
      if (!hasMinimumRole(role, "EDITOR") && !hasPermission(role, "posts.publish_others") && !hasPermission(role, "posts.publish_own")) {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "You do not have permission to publish this post." } }, { status: 403 });
      }
      // Enforce central permission (will throw 403 if not allowed)
      if (!hasPermission(role, "posts.publish_others") && !hasPermission(role, "posts.publish_own") && !hasPermission(role, "post.publish")) {
        throw new AuthError("You do not have permission to publish this post.", 403, "FORBIDDEN");
      }
    }

    if (scheduledAt && new Date(scheduledAt) > new Date()) {
      status = "scheduled";
    } else if (status === "scheduled" && (!scheduledAt || new Date(scheduledAt) <= new Date())) {
      status = "draft";
    }

    const wc = countWords(typeof content === "string" ? content : JSON.stringify(content));
    const rt = calcReadingTime(wc);

    // Resolve Category if passed as object/name
    let resolvedCategoryId = categoryId || null;
    if (!resolvedCategoryId && category) {
      const catName = typeof category === "string" ? category.trim() : category.name?.trim();
      if (catName) {
        const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const existingCat = await withDbRetry(() =>
          db.category.findFirst({
            where: {
              slug: catSlug,
              ...(targetProjectId ? { projectId: targetProjectId } : {}),
            },
          })
        );
        if (existingCat) {
          resolvedCategoryId = existingCat.id;
        } else if (targetProjectId) {
          const createdCat = await withDbRetry(() =>
            db.category.create({
              data: {
                name: catName,
                slug: catSlug || `category-${Date.now()}`,
                projectId: targetProjectId,
              },
            })
          ).catch(() => null);
          if (createdCat) resolvedCategoryId = createdCat.id;
        }
      }
    }

    // Resolve Featured Image if passed as object/url
    let resolvedFeaturedImageId = featuredImageId || null;
    if (!resolvedFeaturedImageId && featuredImage) {
      const imgUrl = typeof featuredImage === "string" ? featuredImage : featuredImage.url;
      if (imgUrl) {
        const existingMedia = await withDbRetry(() =>
          db.media.findFirst({
            where: {
              OR: [
                { variants: { path: ["publicUrl"], equals: imgUrl } },
                { variants: { path: ["webp", "url"], equals: imgUrl } },
              ],
            },
          })
        ).catch(() => null);
        if (existingMedia) {
          resolvedFeaturedImageId = existingMedia.id;
        }
      }
    }

    // 1. UPDATE EXISTING ARTICLE
    if (id) {
      const existing = await withDbRetry(() =>
        db.blog.findUnique({
          where: { id },
          include: { project: true },
        })
      );

      if (!existing) {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "Post not found" } }, { status: 404 });
      }

      // Strict project membership + edit permission check — fail closed, no swallow
      if (!existing.projectId) {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "Post has no project assignment." } }, { status: 403 });
      }
      const { role: editorRole } = await requireProjectMember(existing.projectId);
      // CONTRIBUTOR/AUTHOR can only edit own posts; EDITOR+ can edit others
      const canEditOthers = hasPermission(editorRole, "posts.edit_others") || hasMinimumRole(editorRole, "EDITOR");
      if (!canEditOthers && existing.createdBy !== user.id) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "You can only modify your own posts." } },
          { status: 403 }
        );
      }
      // Check edit own permission
      if (!hasPermission(editorRole, "posts.edit_own") && !hasPermission(editorRole, "posts.edit_others") && !hasPermission(editorRole, "post.edit")) {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "You do not have permission to edit posts." } }, { status: 403 });
      }
      // If changing status to published/scheduled via update, enforce publish permission
      if ((status === "published" || status === "scheduled") && existing.status !== status) {
        if (!hasMinimumRole(editorRole, "EDITOR")) {
          return NextResponse.json({ error: { code: "FORBIDDEN", message: "You do not have permission to publish this post." } }, { status: 403 });
        }
      }

      // Track 301 redirect if slug changed and was published
      if (existing.slug !== slug && existing.status === "published") {
        await withDbRetry(() =>
          db.redirect.create({
            data: {
              blogId: id!,
              oldSlug: existing.slug,
              newSlug: slug,
            },
          })
        ).catch(() => {});
      }

      const publishedAt = status === "published" ? existing.publishedAt || new Date() : null;

      const updated = await withDbRetry(() =>
        db.blog.update({
          where: { id },
          data: {
            title,
            slug,
            content,
            status: status as any,
            wordCount: wc,
            readingTime: rt,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            publishedAt,
            seo: seo ?? existing.seo,
            categoryId: resolvedCategoryId,
            featuredImageId: resolvedFeaturedImageId,
          },
        })
      );

      // Save revision
      await withDbRetry(() =>
        db.blogRevision.create({
          data: {
            blogId: id!,
            content,
            createdBy: user.id,
            label: revisionLabel || (status === "published" ? "Published update" : "Autosave"),
          },
        })
      ).catch(() => {});

      // Sync taxonomy relations if provided — handle both tagIds (UUIDs) and tags (name objects) like Sanity
      // Resolve tags with names to IDs (find or create per project)
      let resolvedTagIds = Array.isArray(tagIds) ? [...tagIds] : [];
      if (Array.isArray(tags) && tags.length > 0) {
        for (const t of tags as any[]) {
          const tName = typeof t === "string" ? t.trim() : (t?.name || t?.label || "").trim();
          if (!tName) continue;
          const tSlug = tName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          let tag = await withDbRetry(() =>
            db.tag.findFirst({ where: { slug: tSlug, projectId: existing.projectId || targetProjectId } })
          ).catch(() => null);
          if (!tag && (existing.projectId || targetProjectId)) {
            tag = await withDbRetry(() =>
              db.tag.create({ data: { name: tName, slug: tSlug || `tag-${Date.now()}`, projectId: existing.projectId || targetProjectId } })
            ).catch(() => null);
          }
          if (tag) resolvedTagIds.push(tag.id);
        }
        resolvedTagIds = [...new Set(resolvedTagIds)];
      }
      if (resolvedTagIds.length > 0 || Array.isArray(tagIds) || Array.isArray(tags)) {
        await withDbRetry(() => db.blogTag.deleteMany({ where: { blogId: id! } })).catch(() => {});
        for (const tagId of resolvedTagIds) {
          await withDbRetry(() => db.blogTag.create({ data: { blogId: id!, tagId } })).catch(() => {});
        }
      }

      if (Array.isArray(authorIds)) {
        await withDbRetry(() => db.blogAuthor.deleteMany({ where: { blogId: id! } })).catch(() => {});
        let sortOrder = 0;
        for (const authorId of authorIds) {
          await withDbRetry(() =>
            db.blogAuthor.create({ data: { blogId: id!, authorId, sortOrder: sortOrder++ } })
          ).catch(() => {});
        }
      }

      await syncMediaUsage(id, content);

      // Trigger Webhooks on publish
      if (status === "published" && updated.projectId) {
        triggerWebhooks({
          projectId: updated.projectId,
          event: "post.published",
          payload: { id: updated.id, title: updated.title, slug: updated.slug, publishedAt: updated.publishedAt },
        }).catch(() => {});
      }

      await createAuditLog({
        actorId: user.id,
        projectId: updated.projectId || undefined,
        action: "post.updated",
        targetId: updated.id,
        metadata: { title: updated.title, status: updated.status },
      });

      return NextResponse.json({ data: updated });
    }

    // 2. CREATE NEW ARTICLE
    // Ensure slug uniqueness — DB currently has global unique on slug (not per-project)
    // Use global check to avoid P2002 race; will be migrated to per-project in future
    let candidateSlug = slug || "untitled";
    const baseSlug = candidateSlug.replace(/-\d+$/, "");
    let counter = 1;
    let existingWithSlug = await withDbRetry(() =>
      db.blog.findFirst({ where: { slug: candidateSlug } })
    );

    while (existingWithSlug) {
      counter++;
      candidateSlug = `${baseSlug}-${counter}`;
      existingWithSlug = await withDbRetry(() =>
        db.blog.findFirst({ where: { slug: candidateSlug } })
      );
      if (counter > 100) {
        candidateSlug = `${baseSlug}-${Date.now().toString(36)}`;
        break;
      }
    }
    slug = candidateSlug;

    const publishedAt = status === "published" ? new Date() : null;

    let blog: any;
    try {
      blog = await withDbRetry(() =>
        db.blog.create({
          data: {
            title,
            slug,
            content,
            status: status as any,
            wordCount: wc,
            readingTime: rt,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            publishedAt,
            createdBy: user.id,
            seo: seo ?? {},
            projectId: targetProjectId,
            categoryId: resolvedCategoryId,
            featuredImageId: resolvedFeaturedImageId,
          },
        })
      );
    } catch (err: any) {
      // Handle race condition where concurrent request created same slug
      if (err?.code === "P2002" && err?.meta?.target?.includes("slug")) {
        const retrySlug = `${baseSlug}-${counter + 1}-${Date.now().toString(36).slice(-4)}`;
        try {
          blog = await withDbRetry(() =>
            db.blog.create({
              data: {
                title,
                slug: retrySlug,
                content,
                status: status as any,
                wordCount: wc,
                readingTime: rt,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                publishedAt,
                createdBy: user.id,
                seo: seo ?? {},
                projectId: targetProjectId,
                categoryId: resolvedCategoryId,
                featuredImageId: resolvedFeaturedImageId,
              },
            })
          );
          slug = retrySlug;
        } catch {
          return NextResponse.json(
            { error: { code: "SLUG_EXISTS", message: "Slug already exists. Please try a different title." } },
            { status: 409 }
          );
        }
      } else {
        throw err;
      }
    }

    // Create initial revision
    await withDbRetry(() =>
      db.blogRevision.create({
        data: {
          blogId: blog.id,
          content,
          createdBy: user.id,
          label: revisionLabel || (status === "published" ? "Published initial" : "Created"),
        },
      })
    ).catch(() => {});

    // Sync tags & authors — handle both tagIds and tags with names (Sanity-like)
    {
      let resolvedTagIds: string[] = Array.isArray(tagIds) ? [...tagIds] : [];
      if (Array.isArray(tags) && (tags as any[]).length > 0) {
        for (const t of tags as any[]) {
          const tName = typeof t === "string" ? t.trim() : (t?.name || t?.label || "").trim();
          if (!tName) continue;
          const tSlug = tName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          let tag = await withDbRetry(() => db.tag.findFirst({ where: { slug: tSlug, projectId: targetProjectId } })).catch(() => null);
          if (!tag) {
            tag = await withDbRetry(() => db.tag.create({ data: { name: tName, slug: tSlug || `tag-${Date.now()}`, projectId: targetProjectId } })).catch(() => null);
          }
          if (tag) resolvedTagIds.push(tag.id);
        }
        resolvedTagIds = [...new Set(resolvedTagIds)];
      }
      for (const tagId of resolvedTagIds) {
        await withDbRetry(() => db.blogTag.create({ data: { blogId: blog.id, tagId } })).catch(() => {});
      }
    }

    if (Array.isArray(authorIds)) {
      let sortOrder = 0;
      for (const authorId of authorIds) {
        await withDbRetry(() =>
          db.blogAuthor.create({ data: { blogId: blog.id, authorId, sortOrder: sortOrder++ } })
        ).catch(() => {});
      }
    }

    await syncMediaUsage(blog.id, content);

    // Trigger Webhooks on publish
    if (status === "published" && blog.projectId) {
      triggerWebhooks({
        projectId: blog.projectId,
        event: "post.published",
        payload: { id: blog.id, title: blog.title, slug: blog.slug, publishedAt: blog.publishedAt },
      }).catch(() => {});
    }

    await createAuditLog({
      actorId: user.id,
      projectId: blog.projectId || undefined,
      action: "post.created",
      targetId: blog.id,
      metadata: { title: blog.title, status: blog.status },
    });

    return NextResponse.json({ data: blog }, { status: 201 });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "SAVE_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to save article." } },
      { status }
    );
  }
}
