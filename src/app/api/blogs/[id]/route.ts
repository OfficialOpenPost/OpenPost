import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, requirePermission, hasPermission, hasMinimumRole, createAuditLog, AuthError } from "@/lib/auth";
import { countWords, readingTime as calcReadingTime } from "@/lib/publish";
import { triggerWebhooks } from "@/lib/webhooks";

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

    // Strict access: must be member of project's project, or creator, or OWNER/ADMIN via membership
    if (blog.projectId) {
      await requireProjectMember(blog.projectId, "CONTRIBUTOR");
      // Additional edit/view check: ensure user has posts.view
      const member = user.memberships.find((m) => m.projectId === blog.projectId);
      const role = member?.role;
      if (role && !hasPermission(role, "posts.view") && !hasPermission(role, "post.read")) {
        // still allow viewing own post
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

    // Strict authorization: must be project member
    if (!existing.projectId) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Post has no project assignment." } }, { status: 403 });
    }
    const { role } = await requireProjectMember(existing.projectId);
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
    } = body;

    // If changing to published or scheduled, require permission
    if (status && (status === "published" || status === "scheduled") && existing.status !== status && existing.projectId) {
      await requirePermission(existing.projectId, "post.publish");
    }

    const dataToUpdate: any = {
      updatedAt: new Date(),
    };

    if (typeof title === "string" && title.trim()) {
      dataToUpdate.title = title.trim();
    }

    if (typeof slug === "string" && slug.trim()) {
      const cleanSlug = slug.trim();
      if (cleanSlug !== existing.slug) {
        // Check slug collision
        if (existing.projectId) {
          const dup = await withDbRetry(() =>
            db.blog.findFirst({
              where: { slug: cleanSlug, projectId: existing.projectId, id: { not: id } },
            })
          );
          if (dup) {
            return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Slug already in use." } }, { status: 409 });
          }
        }
        dataToUpdate.slug = cleanSlug;

        // Track 301 redirect if published
        if (existing.status === "published") {
          await withDbRetry(() =>
            db.redirect.create({
              data: {
                blogId: id,
                oldSlug: existing.slug,
                newSlug: cleanSlug,
              },
            })
          ).catch(() => {});
        }
      }
    }

    if (content !== undefined) {
      dataToUpdate.content = content;
      const wc = countWords(typeof content === "string" ? content : JSON.stringify(content));
      dataToUpdate.wordCount = wc;
      dataToUpdate.readingTime = calcReadingTime(wc);
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
          const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
                  slug: catSlug || `category-${Date.now()}`,
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

    const updated = await withDbRetry(() =>
      db.blog.update({
        where: { id },
        data: dataToUpdate,
      })
    );

    // Save revision snapshot if content changed
    if (content !== undefined) {
      await withDbRetry(() =>
        db.blogRevision.create({
          data: {
            blogId: id,
            content,
            createdBy: user.id,
            label: revisionLabel || (status === "published" ? "Published update" : "Autosave"),
          },
        })
      ).catch(() => {});
    }

    // Sync taxonomy relations if passed
    if (Array.isArray(tagIds)) {
      await withDbRetry(() => db.blogTag.deleteMany({ where: { blogId: id } })).catch(() => {});
      for (const tagId of tagIds) {
        await withDbRetry(() => db.blogTag.create({ data: { blogId: id, tagId } })).catch(() => {});
      }
    }

    if (Array.isArray(authorIds)) {
      await withDbRetry(() => db.blogAuthor.deleteMany({ where: { blogId: id } })).catch(() => {});
      let sortOrder = 0;
      for (const authorId of authorIds) {
        await withDbRetry(() =>
          db.blogAuthor.create({ data: { blogId: id, authorId, sortOrder: sortOrder++ } })
        ).catch(() => {});
      }
    }

    // Webhooks on publish
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
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "UPDATE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to update article." } }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireApprovedUser();

    const existing = await withDbRetry(() => db.blog.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Article not found." } }, { status: 404 });
    }

    // Require post.delete permission (EDITOR+)
    if (existing.projectId) {
      await requirePermission(existing.projectId, "post.delete");
    }

    // Soft delete if not already in trash; permanently delete if already in trash
    if (existing.status !== "trash") {
      const updated = await withDbRetry(() =>
        db.blog.update({
          where: { id },
          data: { status: "trash" },
        })
      );

      await createAuditLog({
        actorId: user.id,
        projectId: existing.projectId || undefined,
        action: "post.trashed",
        targetId: id,
        metadata: { title: existing.title },
      });

      return NextResponse.json({ data: updated });
    }

    await withDbRetry(() => db.blog.delete({ where: { id } }));

    await createAuditLog({
      actorId: user.id,
      projectId: existing.projectId || undefined,
      action: "post.deleted_permanent",
      targetId: id,
      metadata: { title: existing.title },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "DELETE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to delete article." } }, { status });
  }
}
