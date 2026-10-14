import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { z } from "zod";
import { requireApprovedUser, requireProjectMember, requirePermission, hasPermission, hasMinimumRole, AuthError, createAuditLog } from "@/lib/auth";
import { countContentWords, readingTime as calcReadingTime } from "@/lib/publish";
import { queryCache } from "@/lib/cache";
import { triggerWebhooks } from "@/lib/webhooks";
import { slugify } from "@/lib/slug";
import { sanitizeHtml } from "@/lib/sanitize";

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

/**
 * Resolve the media IDs referenced by a set of content URLs.
 *
 * A media `publicUrl` embeds the storage key (`openpost-media/<projectId>/<ts>-<uuid>.<ext>`)
 * whose UUID is NOT the `media.id` (the DB assigns media.id independently). The old
 * implementation extracted the first UUID out of each URL and matched it against media.id,
 * which always failed (the first UUID is the projectId) — so usage was never recorded.
 *
 * Instead we match the full URL (and its storage key) against each media row's
 * `variants.publicUrl` / `variants.webp.url`. Works for absolute R2 URLs and for the
 * relative `/<key>` form produced by the metadata (POST /api/media) flow.
 */
async function resolveMediaIdsFromUrls(urls: string[], projectId?: string | null): Promise<string[]> {
  if (!urls.length) return [];

  // Only http(s) and relative-key URLs can correspond to stored media.
  const candidates = urls.filter((u) => typeof u === "string" && (u.startsWith("http") || u.startsWith("/")));
  if (!candidates.length) return [];

  // Pull the storage key out of each URL (the `openpost-media/...` tail).
  const keys = candidates
    .map((u) => {
      const idx = u.indexOf("openpost-media/");
      return idx >= 0 ? u.slice(idx).split(/[?#]/)[0] : null;
    })
    .filter((k): k is string => Boolean(k));

  // Query media for this project and match by URL or key in memory (bounded by project media).
  const where: any = projectId ? { projectId } : {};
  let rows: any[] = [];
  try {
    rows = await withDbRetry(() =>
      db.media.findMany({
        where,
        select: { id: true, variants: true },
      })
    );
  } catch {
    return [];
  }

  const matched = new Set<string>();
  for (const m of rows as any[]) {
    const v = (m.variants ?? {}) as any;
    const mediaUrls = [v.publicUrl, v.webp?.url].filter((x: any): x is string => typeof x === "string" && !!x);
    const mediaKey = typeof v.key === "string" ? v.key : null;
    for (const c of candidates) {
      if (mediaUrls.includes(c)) { matched.add(m.id); break; }
      // Key containment: URL contains the media's storage key.
      if (mediaKey && c.includes(mediaKey)) { matched.add(m.id); break; }
    }
  }
  return [...matched];
}

async function syncMediaUsage(blogId: string, content: any, projectId?: string | null) {
  try {
    const urls = extractMediaUrls(content);

    const referencedIds = await resolveMediaIdsFromUrls(urls, projectId);

    const existing = await withDbRetry(() =>
      db.mediaUsage.findMany({ where: { blogId }, select: { mediaId: true } })
    ).catch(() => [] as any);

    const existingIds = new Set((existing as any[]).map((r) => r.mediaId));
    const referencedSet = new Set(referencedIds);

    const newIds = referencedIds.filter((id) => !existingIds.has(id));
    const toDelete = [...existingIds].filter((id) => !referencedSet.has(id));

    if (!newIds.length && !toDelete.length) return;

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

/**
 * SECURITY: relation ids supplied by the client are re-checked against the
 * caller's project. Without this, Project A could attach Project B's tags,
 * authors (name/bio/e-mail/social links are returned by the public v1 API) to
 * its own posts — a cross-tenant read + write primitive.
 */
async function filterIdsForProject(
  model: "tag" | "author",
  ids: string[],
  projectId: string | null
): Promise<string[]> {
  if (!ids.length || !projectId) return [];
  const rows = await withDbRetry(() =>
    model === "tag"
      ? db.tag.findMany({ where: { id: { in: ids }, projectId }, select: { id: true } })
      : db.author.findMany({ where: { id: { in: ids }, projectId }, select: { id: true } })
  ).catch(() => [] as { id: string }[]);
  const allowed = new Set(rows.map((r) => r.id));
  return ids.filter((id) => allowed.has(id));
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
        // SECURITY: only adopt a poll that already belongs to THIS blog or to the
        // caller's project. The previous `findUnique({ id })` let anyone embed
        // another tenant's poll UUID (harvestable from the public v1 API) and
        // re-parent + rewrite + destroy it.
        existingPoll = await withDbRetry(() =>
          db.poll.findFirst({
            where: {
              id: p.pollId,
              OR: [{ blogId }, ...(projectId ? [{ projectId }] : [])],
            },
            include: { options: true },
          })
        ).catch(() => null);

        if (!existingPoll) {
          const foreign = await withDbRetry(() =>
            db.poll.findUnique({ where: { id: p.pollId }, select: { id: true } })
          ).catch(() => null);
          // A poll with that id exists but belongs to someone else → ignore it.
          if (foreign) continue;
        }
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
      { error: { code, message: status < 500 ? error.message : "Failed to fetch articles." } },
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
      renderedHtml: renderedHtmlRaw,
      contentVersion,
    } = parsed.data;

    // SECURITY: `renderedHtml` is client-produced markup stored verbatim — run it
    // through the allow-list sanitiser so it can never become a stored-XSS sink.
    const renderedHtml = renderedHtmlRaw !== undefined ? sanitizeHtml(renderedHtmlRaw) : undefined;

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
    // Non-null narrowing that survives closure callbacks.
    const projectScope: string = targetProjectId;

    // Resolve the FINAL status BEFORE authorising. Previously `scheduledAt` was
    // applied after the publish gate, so a CONTRIBUTOR (who has no publish
    // permission) could send status:"draft" + a future date, land in `scheduled`,
    // and be auto-published by the cron with no further authorisation.
    const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (parsedScheduledAt && Number.isNaN(parsedScheduledAt.getTime())) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "scheduledAt must be a valid ISO-8601 date." } },
        { status: 400 }
      );
    }

    if (parsedScheduledAt && parsedScheduledAt.getTime() > Date.now()) {
      status = "scheduled";
    } else if (status === "scheduled" && (!parsedScheduledAt || parsedScheduledAt.getTime() <= Date.now())) {
      status = "draft";
    }

    // If attempting to publish or schedule, require publish permission
    if (status === "published" || status === "scheduled") {
      const canPublish =
        hasMinimumRole(role, "EDITOR") ||
        hasPermission(role, "posts.publish_others") ||
        hasPermission(role, "posts.publish_own") ||
        hasPermission(role, "post.publish");
      if (!canPublish) {
        throw new AuthError("You do not have permission to publish or schedule this post.", 403, "FORBIDDEN");
      }
    }

    const wc = countContentWords(content);
    const rt = calcReadingTime(wc);

    // Resolve Category if passed as object/name
    let resolvedCategoryId = categoryId || null;
    // SECURITY: a directly-supplied relation id must belong to THIS project —
    // otherwise Project A can attach (and thereby read back through the public
    // v1 API) Project B's category.
    if (resolvedCategoryId) {
      const categoryIdToCheck: string = resolvedCategoryId;
      const ownedCategory = await withDbRetry(() =>
        db.category.findFirst({
          where: { id: categoryIdToCheck, projectId: projectScope },
          select: { id: true },
        })
      ).catch(() => null);
      if (!ownedCategory) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Category not found in this project." } },
          { status: 404 }
        );
      }
    }
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
    if (resolvedFeaturedImageId) {
      // SECURITY: media ids are tenant-scoped — never adopt another project's asset.
      const mediaIdToCheck: string = resolvedFeaturedImageId;
      const ownedMedia = await withDbRetry(() =>
        db.media.findFirst({
          where: { id: mediaIdToCheck, projectId: projectScope },
          select: { id: true },
        })
      ).catch(() => null);
      if (!ownedMedia) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Featured image not found in this project." } },
          { status: 404 }
        );
      }
    }
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
              // Tenant scope: never attach another project's media as cover
              ...(targetProjectId ? { projectId: targetProjectId } : {}),
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
      // If changing status to published/scheduled via update, enforce publish permission.
      // NOTE: `status` was already normalised above (a future `scheduledAt` flips it
      // to `scheduled`), so this gate cannot be sidestepped.
      if ((status === "published" || status === "scheduled") && existing.status !== status) {
        const canPublish =
          hasMinimumRole(editorRole, "EDITOR") ||
          hasPermission(editorRole, "posts.publish_others") ||
          hasPermission(editorRole, "posts.publish_own") ||
          hasPermission(editorRole, "post.publish");
        if (!canPublish) {
          return NextResponse.json(
            { error: { code: "FORBIDDEN", message: "You do not have permission to publish or schedule this post." } },
            { status: 403 }
          );
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

      // Save revision (throttled — see PUT /api/blogs/[id])
      const lastRev = await withDbRetry(() =>
        db.blogRevision.findFirst({
          where: { blogId: id! },
          orderBy: { createdAt: "desc" },
          select: { content: true, createdAt: true },
        })
      ).catch(() => null);
      const contentChanged =
        !lastRev || JSON.stringify(lastRev.content ?? null) !== JSON.stringify(content ?? null);
      const ageOk = !lastRev || Date.now() - new Date(lastRev.createdAt).getTime() >= 2 * 60 * 1000;
      if (contentChanged && (Boolean(revisionLabel) || ageOk)) {
        await withDbRetry(() =>
          db.blogRevision.create({
            data: {
              blogId: id!,
              content,
              editorDocument: editorDocument || undefined,
              renderedHtml: renderedHtml || undefined,
              contentVersion: contentVersion || undefined,
              createdBy: user.id,
              wordCount: wc,
              readingTime: rt,
              label: revisionLabel || (status === "published" ? "Published update" : "Autosave"),
            },
          })
        ).catch(() => {});
      }

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
      resolvedTagIds = await filterIdsForProject(
        "tag",
        resolvedTagIds,
        existing.projectId || targetProjectId
      );

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
        // SECURITY: only link bylines owned by this post's project.
        const safeAuthorIds = await filterIdsForProject(
          "author",
          authorIds,
          existing.projectId || targetProjectId
        );
        if (safeAuthorIds.length > 0) {
          await withDbRetry(() =>
            db.blogAuthor.createMany({
              data: safeAuthorIds.map((authorId, i) => ({ blogId: id!, authorId, sortOrder: i })),
              skipDuplicates: true,
            })
          ).catch(() => {});
        }
      }

      await syncMediaUsage(id, content, existing.projectId || targetProjectId);
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

      // Batch link tags (tenant-scoped — foreign ids are dropped)
      resolvedTagIds = await filterIdsForProject("tag", resolvedTagIds, targetProjectId);
      if (resolvedTagIds.length > 0) {
        await withDbRetry(() =>
          db.blogTag.createMany({
            data: resolvedTagIds.map((tagId) => ({ blogId: blog.id, tagId })),
            skipDuplicates: true,
          })
        ).catch(() => {});
      }
    }

    // Batch link authors (tenant-scoped — foreign ids are dropped)
    if (Array.isArray(authorIds) && authorIds.length > 0) {
      const safeAuthorIds = await filterIdsForProject("author", authorIds, targetProjectId);
      if (safeAuthorIds.length > 0) {
        await withDbRetry(() =>
          db.blogAuthor.createMany({
            data: safeAuthorIds.map((authorId, i) => ({ blogId: blog.id, authorId, sortOrder: i })),
            skipDuplicates: true,
          })
        ).catch(() => {});
      }
    }

    await syncMediaUsage(blog.id, content, blog.projectId || targetProjectId);
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
      { error: { code, message: status < 500 ? error.message : "Failed to save article." } },
      { status }
    );
  }
}
