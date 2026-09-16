import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { z } from "zod";
import { requireApprovedUser, requireProjectMember, requirePermission, hasPermission, hasMinimumRole, AuthError, createAuditLog } from "@/lib/auth";
import { countWords, readingTime as calcReadingTime } from "@/lib/publish";
import { queryCache } from "@/lib/cache";
import { triggerWebhooks } from "@/lib/webhooks";
import { slugify } from "@/lib/slug";

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
  editorDocument: z.any().optional(),
  renderedHtml: z.string().optional(),
  contentVersion: z.number().optional(),
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

    const [existing, validMedia] = await Promise.all([
      withDbRetry(() => db.mediaUsage.findMany({ where: { blogId }, select: { mediaId: true } })).catch(() => [] as any),
      withDbRetry(() => db.media.findMany({ where: { id: { in: mediaIds } }, select: { id: true } })).catch(() => [] as any),
    ]);

    const existingIds = new Set((existing as any[]).map((r) => r.mediaId));
    const validIds = new Set((validMedia as any[]).map((m) => m.id));
    const newIds = mediaIds.filter((id) => validIds.has(id) && !existingIds.has(id));
    const toDelete = [...existingIds].filter((id) => !validIds.has(id));

    if (toDelete.length) {
      await withDbRetry(() =>
        db.mediaUsage.deleteMany({ where: { blogId, mediaId: { in: toDelete } } })
      ).catch(() => {});
    }
    if (newIds.length) {
      await withDbRetry(() =>
        db.mediaUsage.createMany({
          data: newIds.map((mediaId) => ({ blogId, mediaId })),
          skipDuplicates: true,
        })
      ).catch(() => {});
    }
  } catch (e) {
    // Non-blocking
  }
}

function extractPollBlocks(content: any): any[] {
  const polls: any[] = [];
  const walk = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if ((node.type === "poll" || node.type === "pollBlock") && node.attrs) {
      polls.push(node.attrs);
    }
    if (node.content) walk(node.content);
    if (node.attrs?.items) walk(node.attrs.items);
  };
  walk(content?.content ?? content);
  return polls;
}

async function syncPolls(blogId: string, content: any, projectId: string | null, blogStatus: string) {
  try {
    const pollAttrsList = extractPollBlocks(content);
    const targetStatus = (blogStatus === "published" || blogStatus === "scheduled") ? "open" : "draft";

    if (!pollAttrsList.length) {
      // Clean up any existing polls for this blog if all were deleted
      await withDbRetry(() => db.poll.deleteMany({ where: { blogId } })).catch(() => {});
      return;
    }

    const activePollIds: string[] = [];

    for (const p of pollAttrsList) {
      const question = (p.question || "What do you think?").trim();
      const rawOptions = Array.isArray(p.options) ? p.options : ["Option A", "Option B"];
      const cleanOptions = rawOptions
        .map((opt: any, idx: number) => {
          const label = typeof opt === "string" ? opt.trim() : (opt?.label || `Option ${idx + 1}`).trim();
          return { label, sortOrder: idx };
        })
        .filter((opt: { label: string; sortOrder: number }) => opt.label.length > 0);

      const pollType = p.type === "multiple" ? "multiple" : "single";
      const showResults = ["always", "after_vote", "after_close"].includes(p.showResults) ? p.showResults : "always";
      const allowAnonymous = p.allowAnonymous !== false;
      const closesAt = p.closesAt ? new Date(p.closesAt) : null;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const hasUuid = typeof p.pollId === "string" && uuidRegex.test(p.pollId);

      let existingPoll: any = null;
      if (hasUuid) {
        existingPoll = await withDbRetry(() =>
          db.poll.findUnique({
            where: { id: p.pollId },
            include: { options: true },
          })
        ).catch(() => null);
      }

      if (existingPoll) {
        activePollIds.push(existingPoll.id);
        await withDbRetry(() =>
          db.poll.update({
            where: { id: existingPoll.id },
            data: {
              blogId,
              projectId: projectId || existingPoll.projectId,
              question,
              type: pollType as any,
              showResults: showResults as any,
              allowAnonymous,
              closesAt,
              status: targetStatus as any,
            },
          })
        ).catch(() => {});

        if (cleanOptions.length >= 2) {
          const existingLabels = new Set(existingPoll.options.map((o: any) => o.label));
          const optionsChanged =
            existingPoll.options.length !== cleanOptions.length ||
            cleanOptions.some((o: { label: string; sortOrder: number }) => !existingLabels.has(o.label));

          if (optionsChanged) {
            await withDbRetry(async () => {
              await db.pollOption.deleteMany({ where: { pollId: existingPoll.id } });
              await db.pollOption.createMany({
                data: cleanOptions.map((o: { label: string; sortOrder: number }) => ({
                  pollId: existingPoll.id,
                  label: o.label,
                  sortOrder: o.sortOrder,
                })),
              });
            }).catch(() => {});
          }
        }
      } else {
        const createdPoll = await withDbRetry(() =>
          db.poll.create({
            data: {
              ...(hasUuid ? { id: p.pollId } : {}),
              blogId,
              projectId,
              question,
              type: pollType as any,
              showResults: showResults as any,
              allowAnonymous,
              closesAt,
              status: targetStatus as any,
              options: {
                create: cleanOptions.map((o: { label: string; sortOrder: number }) => ({
                  label: o.label,
                  sortOrder: o.sortOrder,
                })),
              },
            },
          })
        ).catch(() => null);

        if (createdPoll) {
          p.pollId = createdPoll.id;
          activePollIds.push(createdPoll.id);
        }
      }
    }

    if (activePollIds.length > 0) {
      await withDbRetry(() =>
        db.poll.deleteMany({
          where: {
            blogId,
            id: { notIn: activePollIds },
          },
        })
      ).catch(() => {});
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
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId") || req.headers.get("x-openpost-project");

    let targetProjectId = projectId;
    if (!targetProjectId) {
      targetProjectId = user.memberships[0]?.projectId;
      if (!targetProjectId) {
        return NextResponse.json({ data: [] });
      }
    }

    // Strict project scoping — verify membership for targetProjectId
    await requireProjectMember(targetProjectId, "CONTRIBUTOR");

    const blogListSelect = {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      publishedAt: true,
      scheduledAt: true,
      wordCount: true,
      readingTime: true,
      projectId: true,
      categoryId: true,
      featuredImageId: true,
      createdBy: true,
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { name: true, email: true } },
      featuredImage: { select: { id: true, variants: true } },
    };

    const cacheKey = `blogs:${targetProjectId}:${status || "all"}:${limit}:${offset}`;

    const [blogs, total] = await Promise.all([
      withDbRetry(() =>
        db.blog.findMany({
          where: {
            projectId: targetProjectId,
            ...(status && status !== "all" ? { status: status as any } : {}),
          },
          skip: offset,
          take: Math.min(100, Math.max(1, limit)),
          orderBy: { updatedAt: "desc" },
          select: blogListSelect,
        })
      ),
      withDbRetry(() =>
        db.blog.count({
          where: {
            projectId: targetProjectId,
            ...(status && status !== "all" ? { status: status as any } : {}),
          },
        })
      ),
    ]);

    return NextResponse.json({ data: blogs, total, hasMore: offset + limit < total });
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
      editorDocument,
      renderedHtml,
      contentVersion,
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

    // Check membership from already-loaded user memberships (avoids extra auth call)
    const membership = user.memberships.find((m) => m.projectId === targetProjectId);
    if (!membership) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found or access denied." } }, { status: 404 });
    }
    const role = membership.role;

    // If attempting to publish or schedule, require publish permission
    if (status === "published" || status === "scheduled") {
      if (!hasMinimumRole(role, "EDITOR") && !hasPermission(role, "posts.publish_others") && !hasPermission(role, "posts.publish_own")) {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "You do not have permission to publish this post." } }, { status: 403 });
      }
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

      // Strict project membership + edit permission check — use already-loaded memberships
      if (!existing.projectId) {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "Post has no project assignment." } }, { status: 403 });
      }
      const editMembership = user.memberships.find((m) => m.projectId === existing.projectId);
      if (!editMembership) {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found or access denied." } }, { status: 404 });
      }
      const editorRole = editMembership.role;
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

      let candidateSlug = existing.slug;
      if (typeof slug === "string" && slug.trim()) {
        const cleanSlug = slugify(slug.trim()) || "untitled";
        if (cleanSlug !== existing.slug) {
          const existingSlugs = await withDbRetry(() =>
            db.blog.findMany({
              where: {
                slug: { startsWith: cleanSlug },
                id: { not: id },
                ...(existing.projectId ? { projectId: existing.projectId } : {}),
              },
              select: { slug: true },
            })
          );
          const existingSet = new Set(existingSlugs.map((s) => s.slug));
          candidateSlug = cleanSlug;
          if (existingSet.has(candidateSlug)) {
            let counter = 2;
            while (existingSet.has(`${cleanSlug}-${counter}`)) {
              counter++;
            }
            candidateSlug = `${cleanSlug}-${counter}`;
          }

          // Track 301 redirect if slug changed and was published
          if (existing.status === "published") {
            await withDbRetry(() =>
              db.redirect.create({
                data: {
                  blogId: id!,
                  oldSlug: existing.slug,
                  newSlug: candidateSlug,
                },
              })
            ).catch(() => {});
          }
        }
      }

      const publishedAt = status === "published" ? existing.publishedAt || new Date() : null;

      let updated: any;
      try {
        updated = await withDbRetry(() =>
          db.blog.update({
            where: { id },
            data: {
              title,
              slug: candidateSlug,
              content,
              status: status as any,
              wordCount: wc,
              readingTime: rt,
              scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
              publishedAt,
              seo: seo ?? existing.seo,
              categoryId: resolvedCategoryId,
              featuredImageId: resolvedFeaturedImageId,
              ...(editorDocument !== undefined ? { editorDocument } : {}),
              ...(renderedHtml !== undefined ? { renderedHtml } : {}),
              ...(contentVersion !== undefined ? { contentVersion } : {}),
            },
          })
        );
      } catch (err: any) {
        if (err?.code === "P2002" || String(err?.message || "").includes("Unique constraint failed")) {
          return NextResponse.json(
            { error: { code: "SLUG_EXISTS", message: "Slug already in use. Please choose a different title/slug." } },
            { status: 409 }
          );
        }
        throw err;
      }

      // Save revision
      await withDbRetry(() =>
        db.blogRevision.create({
          data: {
            blogId: id!,
            content,
            editorDocument: editorDocument || undefined,
            renderedHtml: renderedHtml || undefined,
            contentVersion: contentVersion || undefined,
            createdBy: user.id,
            label: revisionLabel || (status === "published" ? "Published update" : "Autosave"),
          },
        })
      ).catch(() => {});

      // Sync taxonomy relations — batch operations for speed
      let resolvedTagIds = Array.isArray(tagIds) ? [...tagIds] : [];
      if (Array.isArray(tags) && tags.length > 0) {
        const tagSlugs = (tags as any[])
          .map((t) => {
            const tName = typeof t === "string" ? t.trim() : (t?.name || t?.label || "").trim();
            return tName ? { name: tName, slug: tName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") } : null;
          })
          .filter(Boolean) as { name: string; slug: string }[];

        if (tagSlugs.length > 0) {
          const existingTags = await withDbRetry(() =>
            db.tag.findMany({
              where: { slug: { in: tagSlugs.map((t) => t.slug) }, projectId: existing.projectId || targetProjectId },
              select: { id: true, slug: true },
            })
          ).catch(() => []);

          const existingMap = new Map(existingTags.map((t) => [t.slug, t.id]));
          const newTags = tagSlugs.filter((t) => !existingMap.has(t.slug));

          if (newTags.length > 0) {
            await withDbRetry(() =>
              db.tag.createMany({
                data: newTags.map((t) => ({ name: t.name, slug: t.slug, projectId: existing.projectId || targetProjectId })),
                skipDuplicates: true,
              })
            ).catch(() => {});

            const createdTags = await withDbRetry(() =>
              db.tag.findMany({
                where: { slug: { in: newTags.map((t) => t.slug) }, projectId: existing.projectId || targetProjectId },
                select: { id: true, slug: true },
              })
            ).catch(() => []);
            createdTags.forEach((t) => existingMap.set(t.slug, t.id));
          }

          existingMap.forEach((id) => resolvedTagIds.push(id));
          resolvedTagIds = [...new Set(resolvedTagIds)];
        }
      }
      if (resolvedTagIds.length > 0 || Array.isArray(tagIds) || Array.isArray(tags)) {
        await withDbRetry(() => db.blogTag.deleteMany({ where: { blogId: id! } })).catch(() => {});
        if (resolvedTagIds.length > 0) {
          await withDbRetry(() =>
            db.blogTag.createMany({
              data: resolvedTagIds.map((tagId) => ({ blogId: id!, tagId })),
              skipDuplicates: true,
            })
          ).catch(() => {});
        }
      }

      if (Array.isArray(authorIds)) {
        await withDbRetry(() => db.blogAuthor.deleteMany({ where: { blogId: id! } })).catch(() => {});
        if (authorIds.length > 0) {
          await withDbRetry(() =>
            db.blogAuthor.createMany({
              data: authorIds.map((authorId, i) => ({ blogId: id!, authorId, sortOrder: i })),
              skipDuplicates: true,
            })
          ).catch(() => {});
        }
      }

      await syncMediaUsage(id, content);
      await syncPolls(id, content, existing.projectId || targetProjectId, status);

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

      queryCache.invalidate("blogs:");
      queryCache.invalidate("dashboard:");

      return NextResponse.json({ data: updated });
    }

    // 2. CREATE NEW ARTICLE
    // Ensure slug uniqueness within the same project (different projects can share slugs)
    let candidateSlug = slug || "untitled";
    const baseSlug = candidateSlug.replace(/-\d+$/, "");

    // Batch check: find all existing slugs with this prefix WITHIN the same project
    const existingSlugs = await withDbRetry(() =>
      db.blog.findMany({
        where: {
          slug: { startsWith: baseSlug },
          projectId: targetProjectId,
        },
        select: { slug: true },
      })
    );
    const existingSet = new Set(existingSlugs.map((s) => s.slug));

    if (existingSet.has(candidateSlug)) {
      let counter = 2;
      while (existingSet.has(`${baseSlug}-${counter}`)) {
        counter++;
      }
      candidateSlug = `${baseSlug}-${counter}`;
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
            ...(editorDocument !== undefined ? { editorDocument } : {}),
            ...(renderedHtml !== undefined ? { renderedHtml } : {}),
            ...(contentVersion !== undefined ? { contentVersion } : {}),
          },
        })
      );
    } catch (err: any) {
      // Handle race condition where concurrent request created same slug
      if (err?.code === "P2002" && err?.meta?.target?.includes("slug")) {
        const retrySlug = `${baseSlug}-${Date.now().toString(36).slice(-6)}`;
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
                ...(editorDocument !== undefined ? { editorDocument } : {}),
                ...(renderedHtml !== undefined ? { renderedHtml } : {}),
                ...(contentVersion !== undefined ? { contentVersion } : {}),
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
          editorDocument: editorDocument || undefined,
          renderedHtml: renderedHtml || undefined,
          contentVersion: contentVersion || undefined,
          createdBy: user.id,
          label: revisionLabel || (status === "published" ? "Published initial" : "Created"),
        },
      })
    ).catch(() => {});

    // Sync tags & authors — batch operations for speed
    {
      let resolvedTagIds: string[] = Array.isArray(tagIds) ? [...tagIds] : [];
      if (Array.isArray(tags) && (tags as any[]).length > 0) {
        // Batch find existing tags
        const tagSlugs = (tags as any[])
          .map((t) => {
            const tName = typeof t === "string" ? t.trim() : (t?.name || t?.label || "").trim();
            return tName ? { name: tName, slug: tName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") } : null;
          })
          .filter(Boolean) as { name: string; slug: string }[];

        if (tagSlugs.length > 0) {
          const existingTags = await withDbRetry(() =>
            db.tag.findMany({
              where: { slug: { in: tagSlugs.map((t) => t.slug) }, projectId: targetProjectId },
              select: { id: true, slug: true },
            })
          ).catch(() => []);

          const existingMap = new Map(existingTags.map((t) => [t.slug, t.id]));
          const newTags = tagSlugs.filter((t) => !existingMap.has(t.slug));

          // Batch create missing tags
          if (newTags.length > 0) {
            const created = await withDbRetry(() =>
              db.tag.createMany({
                data: newTags.map((t) => ({ name: t.name, slug: t.slug, projectId: targetProjectId })),
                skipDuplicates: true,
              })
            ).catch(() => ({ count: 0 }));

            // Fetch created tags to get IDs
            if (created.count > 0) {
              const createdTags = await withDbRetry(() =>
                db.tag.findMany({
                  where: { slug: { in: newTags.map((t) => t.slug) }, projectId: targetProjectId },
                  select: { id: true, slug: true },
                })
              ).catch(() => []);
              createdTags.forEach((t) => existingMap.set(t.slug, t.id));
            }
          }

          existingMap.forEach((id) => resolvedTagIds.push(id));
          resolvedTagIds = [...new Set(resolvedTagIds)];
        }
      }

      // Batch link tags
      if (resolvedTagIds.length > 0) {
        await withDbRetry(() =>
          db.blogTag.createMany({
            data: resolvedTagIds.map((tagId) => ({ blogId: blog.id, tagId })),
            skipDuplicates: true,
          })
        ).catch(() => {});
      }
    }

    // Batch link authors
    if (Array.isArray(authorIds) && authorIds.length > 0) {
      await withDbRetry(() =>
        db.blogAuthor.createMany({
          data: authorIds.map((authorId, i) => ({ blogId: blog.id, authorId, sortOrder: i })),
          skipDuplicates: true,
        })
      ).catch(() => {});
    }

    await syncMediaUsage(blog.id, content);
    await syncPolls(blog.id, content, blog.projectId || targetProjectId, status);

    // Trigger Webhooks on publish
    if (status === "published" && blog.projectId) {
      triggerWebhooks({
        projectId: blog.projectId,
        event: "post.published",
        payload: { id: blog.id, title: blog.title, slug: blog.slug, publishedAt: blog.publishedAt },
      }).catch(() => {});
    }

    // Trigger Webhook on any new post
    if (blog.projectId) {
      triggerWebhooks({
        projectId: blog.projectId,
        event: "post.created",
        payload: { id: blog.id, title: blog.title, slug: blog.slug, status: blog.status },
      }).catch(() => {});
    }

    await createAuditLog({
      actorId: user.id,
      projectId: blog.projectId || undefined,
      action: "post.created",
      targetId: blog.id,
      metadata: { title: blog.title, status: blog.status },
    });

    queryCache.invalidate("blogs:");
    queryCache.invalidate("dashboard:");

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
