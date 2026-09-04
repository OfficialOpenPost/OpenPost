import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, requirePermission, requireAdmin, hasPermission, hasMinimumRole, createAuditLog, AuthError } from "@/lib/auth";
import { countWords, readingTime as calcReadingTime } from "@/lib/publish";
import { triggerWebhooks } from "@/lib/webhooks";
import { slugify } from "@/lib/slug";

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApprovedUser();

    const blog = await withDbRetry(() =>
      db.blog.findUnique({
        where: { id },
        include: {
          category: true,
          featuredImage: {
            select: {
              id: true,
              originalFilename: true,
              mimeType: true,
              width: true,
              height: true,
              variants: true,
              altTextDefault: true,
            },
          },
          tags: { include: { tag: true } },
          authors: { include: { author: true } },
          project: { select: { id: true, name: true, slug: true } },
        },
      })
    );

    if (!blog) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Article not found." } }, { status: 404 });
    }

    // Strict access: use already-loaded user memberships (no extra auth call)
    if (blog.projectId) {
      const member = user.memberships.find((m) => m.projectId === blog.projectId);
      if (!member) {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied." } }, { status: 403 });
      }
      const role = member.role;
      if (!hasPermission(role, "posts.view") && !hasPermission(role, "post.read")) {
        if (blog.createdBy !== user.id) {
          return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied." } }, { status: 403 });
        }
      }
    } else {
      // No project assignment — only creator or OWNER/ADMIN globally can view
      const isCreator = blog.createdBy === user.id;
      const isPrivileged = hasMinimumRole(user.role, "ADMIN");
      if (!isCreator && !isPrivileged) {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "Article not found." } }, { status: 404 });
      }
    }

    return NextResponse.json({ data: blog });
  } catch (error: any) {
    console.error("GET /api/blogs/[id] error:", error);
    const status = error?.statusCode || (error instanceof AuthError ? error.statusCode : 500);
    const code = error?.code || "FETCH_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to load article." } }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApprovedUser();

    const existing = await withDbRetry(() => db.blog.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Article not found." } }, { status: 404 });
    }

    // Strict authorization: use already-loaded user memberships (no extra auth call)
    if (!existing.projectId) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Post has no project assignment." } }, { status: 403 });
    }
    const editMembership = user.memberships.find((m) => m.projectId === existing.projectId);
    if (!editMembership) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied." } }, { status: 403 });
    }
    const role = editMembership.role;
    const canEditOthers = hasPermission(role, "posts.edit_others") || hasMinimumRole(role, "EDITOR");
    if (!canEditOthers && existing.createdBy !== user.id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You can only modify your own posts." } },
        { status: 403 }
      );
    }
    if (!hasPermission(role, "posts.edit_own") && !hasPermission(role, "posts.edit_others") && !hasPermission(role, "post.edit")) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "You do not have permission to edit posts." } }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      title,
      slug,
      content,
      status,
      scheduledAt,
      seo,
      categoryId,
      featuredImageId,
      authorIds,
      tagIds,
      revisionLabel,
      editorDocument,
      renderedHtml,
      contentVersion,
    } = body;

    // If changing to published or scheduled, require permission (use already-loaded role)
    if (status && (status === "published" || status === "scheduled") && existing.status !== status && existing.projectId) {
      if (!hasPermission(role, "posts.publish_others") && !hasPermission(role, "posts.publish_own") && !hasPermission(role, "post.publish")) {
        throw new AuthError("You do not have permission to publish this post.", 403, "FORBIDDEN");
      }
    }

    const dataToUpdate: any = {
      updatedAt: new Date(),
    };

    if (typeof title === "string" && title.trim()) {
      dataToUpdate.title = title.trim();
    }

    if (typeof slug === "string" && slug.trim()) {
      const cleanSlug = slugify(slug.trim()) || "untitled";
      if (cleanSlug !== existing.slug) {
        // Find any existing collision within the SAME project only
        const existingSlugs = await withDbRetry(() =>
          db.blog.findMany({
            where: {
              OR: [
                { slug: cleanSlug },
                { slug: { startsWith: `${cleanSlug}-` } },
              ],
              id: { not: id },
              ...(existing.projectId ? { projectId: existing.projectId } : {}),
            },
            select: { slug: true },
          })
        );
        const existingSet = new Set(existingSlugs.map((s) => s.slug));
        let candidateSlug = cleanSlug;
        if (existingSet.has(candidateSlug)) {
          let counter = 2;
          while (existingSet.has(`${cleanSlug}-${counter}`)) {
            counter++;
          }
          candidateSlug = `${cleanSlug}-${counter}`;
        }
        dataToUpdate.slug = candidateSlug;

        // Track 301 redirect if published
        if (existing.status === "published") {
          await withDbRetry(() =>
            db.redirect.create({
              data: {
                blogId: id,
                oldSlug: existing.slug,
                newSlug: candidateSlug,
              },
            })
          ).catch((err) => {
            console.warn("Redirect create notice:", err);
          });
        }
      }
    }

    if (content !== undefined) {
      dataToUpdate.content = content;
      const wc = countWords(typeof content === "string" ? content : JSON.stringify(content));
      dataToUpdate.wordCount = wc;
      dataToUpdate.readingTime = calcReadingTime(wc);
    }

    if (editorDocument !== undefined) {
      dataToUpdate.editorDocument = editorDocument;
    }
    if (renderedHtml !== undefined) {
      dataToUpdate.renderedHtml = renderedHtml;
    }
    if (contentVersion !== undefined) {
      dataToUpdate.contentVersion = contentVersion;
    }

    if (status && ["draft", "published", "scheduled", "archived", "trash"].includes(status)) {
      dataToUpdate.status = status;
      if (status === "published" && !existing.publishedAt) {
        dataToUpdate.publishedAt = new Date();
      }
    }

    if (scheduledAt !== undefined) {
      dataToUpdate.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }

    if (seo !== undefined) {
      dataToUpdate.seo = seo;
    }

    let resolvedCategoryId = categoryId;
    if (resolvedCategoryId === undefined && body.category !== undefined) {
      if (body.category === null) {
        resolvedCategoryId = null;
      } else {
        const catName = typeof body.category === "string" ? body.category.trim() : body.category.name?.trim();
        if (catName) {
          const catSlug = slugify(catName) || `category-${Date.now()}`;
          const existingCat = await withDbRetry(() =>
            db.category.findFirst({
              where: {
                slug: catSlug,
                ...(existing.projectId ? { projectId: existing.projectId } : {}),
              },
            })
          );
          if (existingCat) {
            resolvedCategoryId = existingCat.id;
          } else if (existing.projectId) {
            const createdCat = await withDbRetry(() =>
              db.category.create({
                data: {
                  name: catName,
                  slug: catSlug,
                  projectId: existing.projectId,
                },
              })
            ).catch(() => null);
            if (createdCat) resolvedCategoryId = createdCat.id;
          }
        }
      }
    }

    let resolvedFeaturedImageId = featuredImageId;
    if (resolvedFeaturedImageId === undefined && body.featuredImage !== undefined) {
      if (body.featuredImage === null) {
        resolvedFeaturedImageId = null;
      } else {
        const imgUrl = typeof body.featuredImage === "string" ? body.featuredImage : body.featuredImage.url;
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
          if (existingMedia) resolvedFeaturedImageId = existingMedia.id;
        }
      }
    }

    if (resolvedCategoryId !== undefined) {
      dataToUpdate.categoryId = resolvedCategoryId;
    }

    if (resolvedFeaturedImageId !== undefined) {
      dataToUpdate.featuredImageId = resolvedFeaturedImageId;
    }

    let updated: any;
    try {
      updated = await withDbRetry(() =>
        db.blog.update({
          where: { id },
          data: dataToUpdate,
        })
      );
    } catch (err: any) {
      if (err?.code === "P2002" || String(err?.message || "").includes("Unique constraint failed")) {
        // Auto-recover: generate guaranteed unique fallback slug and complete update
        const fallbackSlug = `${dataToUpdate.slug || existing.slug}-${Date.now().toString().slice(-4)}`;
        dataToUpdate.slug = fallbackSlug;
        updated = await withDbRetry(() =>
          db.blog.update({
            where: { id },
            data: dataToUpdate,
          })
        );
      } else {
        throw err;
      }
    }

    // Save revision snapshot if content changed
    if (content !== undefined) {
      await withDbRetry(() =>
        db.blogRevision.create({
          data: {
            blogId: id,
            content,
            editorDocument: editorDocument || undefined,
            renderedHtml: renderedHtml || undefined,
            contentVersion: contentVersion || undefined,
            createdBy: user.id,
            label: revisionLabel || (status === "published" ? "Published update" : "Autosave"),
          },
        })
      ).catch(() => {});
    }

    // Sync taxonomy relations — batch operations
    if (Array.isArray(tagIds)) {
      await withDbRetry(() => db.blogTag.deleteMany({ where: { blogId: id } })).catch(() => {});
      if (tagIds.length > 0) {
        await withDbRetry(() =>
          db.blogTag.createMany({
            data: tagIds.map((tagId: string) => ({ blogId: id, tagId })),
            skipDuplicates: true,
          })
        ).catch(() => {});
      }
    }

    if (Array.isArray(authorIds)) {
      await withDbRetry(() => db.blogAuthor.deleteMany({ where: { blogId: id } })).catch(() => {});
      if (authorIds.length > 0) {
        await withDbRetry(() =>
          db.blogAuthor.createMany({
            data: authorIds.map((authorId: string, i: number) => ({ blogId: id, authorId, sortOrder: i })),
            skipDuplicates: true,
          })
        ).catch(() => {});
      }
    }

    if (content !== undefined) {
      await syncPolls(id, content, existing.projectId, status || existing.status);
    }

    // Webhooks on publish
    if (status === "published" && updated.projectId) {
      triggerWebhooks({
        projectId: updated.projectId,
        event: "post.published",
        payload: { id: updated.id, title: updated.title, slug: updated.slug, publishedAt: updated.publishedAt },
      }).catch(() => {});
    }

    // Webhook on any update
    if (updated.projectId) {
      triggerWebhooks({
        projectId: updated.projectId,
        event: "post.updated",
        payload: { id: updated.id, title: updated.title, slug: updated.slug, status: updated.status },
      }).catch(() => {});
    }

    // Webhook on schedule
    if (status === "scheduled" && updated.projectId) {
      triggerWebhooks({
        projectId: updated.projectId,
        event: "post.scheduled",
        payload: { id: updated.id, title: updated.title, slug: updated.slug, scheduledAt: updated.scheduledAt },
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
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "UPDATE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to update article." } }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApprovedUser();

    const existing = await withDbRetry(() => db.blog.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Article not found." } }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const isPermanent = searchParams.get("permanent") === "true";
    const body = await req.json().catch(() => ({}));
    const reason = (body?.reason || searchParams.get("reason") || "").trim();

    // 1. PERMANENT DELETION (Only ADMIN or OWNER can purge articles)
    if (existing.status === "trash" || isPermanent || body?.permanent === true) {
      if (existing.projectId) {
        await requireAdmin(existing.projectId);
      } else {
        await requireAdmin();
      }

      await withDbRetry(async () => {
        await db.blogRevision.deleteMany({ where: { blogId: id } }).catch(() => {});
        await db.blogAuthor.deleteMany({ where: { blogId: id } }).catch(() => {});
        await db.blogTag.deleteMany({ where: { blogId: id } }).catch(() => {});
        await db.mediaUsage.deleteMany({ where: { blogId: id } }).catch(() => {});
        await db.redirect.deleteMany({ where: { blogId: id } }).catch(() => {});
        await db.blog.delete({ where: { id } });
      });

      await createAuditLog({
        actorId: user.id,
        projectId: existing.projectId || undefined,
        action: "post.deleted_permanent",
        targetId: id,
        metadata: {
          title: existing.title,
          permanent: true,
          previousTrashReason: (existing.seo as any)?.trashReason,
        },
      });

      return NextResponse.json({ data: { success: true, id }, message: "Article permanently deleted." });
    }

    // 2. SOFT DELETION (Move to Trash with user reason)
    // Check permission: author can delete own with posts.delete_own; otherwise posts.delete_others (EDITOR+)
    if (existing.projectId) {
      const isOwn = existing.createdBy === user.id;
      const requiredPerm = isOwn ? "posts.delete_own" : "posts.delete_others";
      const { role } = await requireProjectMember(existing.projectId);
      if (!hasPermission(role, requiredPerm) && !hasPermission(role, "post.delete")) {
        throw new AuthError("Insufficient permissions to delete this article.", 403, "FORBIDDEN");
      }
    }

    const currentSeo = typeof existing.seo === "object" && existing.seo !== null ? (existing.seo as any) : {};
    const updatedSeo = {
      ...currentSeo,
      trashReason: reason || "No reason specified",
      trashedBy: user.displayName || user.email,
      trashedAt: new Date().toISOString(),
    };

    const updated = await withDbRetry(() =>
      db.blog.update({
        where: { id },
        data: {
          status: "trash",
          seo: updatedSeo,
        },
      })
    );

    if (existing.projectId) {
      triggerWebhooks({
        projectId: existing.projectId,
        event: "post.deleted",
        payload: {
          id: existing.id,
          title: existing.title,
          slug: existing.slug,
          trashReason: reason || undefined,
        },
      }).catch(() => {});
    }

    await createAuditLog({
      actorId: user.id,
      projectId: existing.projectId || undefined,
      action: "post.trashed",
      targetId: id,
      metadata: {
        title: existing.title,
        reason: reason || "No reason specified",
      },
    });

    return NextResponse.json({
      data: updated,
      message: "Article moved to trash.",
    });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "DELETE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to delete article." } }, { status });
  }
}
