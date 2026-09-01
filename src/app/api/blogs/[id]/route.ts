import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { countWords, readingTime as calcReadingTime } from "@/lib/publish";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const blog = await withDbRetry(() =>
      db.blog.findUnique({
        where: { id } as never,
        include: {
          category: true,
          featuredImage: true,
          tags: { include: { tag: true } },
        } as never,
      })
    );
    if (!blog) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ data: blog });
  } catch (e) {
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser().catch(() => null);
    if (user && !["ADMIN", "EDITOR"].includes(user.role)) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Only EDITOR+ can delete" } }, { status: 403 });
    }
    const { id } = await params;
    const existing = await withDbRetry(() => db.blog.findUnique({ where: { id } as never }));
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

    if ((existing as any).status !== "trash") {
      const updated = await withDbRetry(() => db.blog.update({ where: { id } as never, data: { status: "trash" as never } }));
      return NextResponse.json({ data: updated });
    }
    await withDbRetry(() => db.blog.delete({ where: { id } as never }));
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await withDbRetry(() => db.blog.findUnique({ where: { id } as never }));
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Article not found" } }, { status: 404 });

    // Extract only valid database scalar fields
    const {
      title,
      slug,
      content,
      status,
      scheduledAt,
      seo,
      categoryId,
      category,
      featuredImageId,
      featuredImage,
      revisionLabel,
    } = body;

    const dataToUpdate: any = {
      updatedAt: new Date(),
    };

    if (typeof title === "string" && title.trim()) {
      dataToUpdate.title = title.trim();
    }
    if (typeof slug === "string" && slug.trim()) {
      dataToUpdate.slug = slug.trim();
    }
    if (content !== undefined) {
      dataToUpdate.content = content;
      const wc = countWords(JSON.stringify(content));
      dataToUpdate.wordCount = wc;
      dataToUpdate.readingTime = calcReadingTime(wc);
    }
    if (status && ["draft", "published", "scheduled", "archived", "trash"].includes(status)) {
      dataToUpdate.status = status;
      if (status === "published" && !(existing as any).publishedAt) {
        dataToUpdate.publishedAt = new Date();
      }
    }
    if (scheduledAt !== undefined) {
      dataToUpdate.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }
    if (seo !== undefined) {
      dataToUpdate.seo = seo;
    }

    // Resolve categoryId if category object or string was sent
    if (categoryId !== undefined) {
      dataToUpdate.categoryId = categoryId || null;
    } else if (category?.name) {
      const foundCat = await withDbRetry(() => db.category.findFirst({ where: { name: category.name } as never })).catch(() => null);
      if (foundCat) dataToUpdate.categoryId = (foundCat as any).id;
    }

    // Resolve featuredImageId if provided
    if (featuredImageId !== undefined) {
      dataToUpdate.featuredImageId = featuredImageId || null;
    }

    const updated = await withDbRetry(() =>
      db.blog.update({
        where: { id } as never,
        data: dataToUpdate as never,
      })
    );

    // Create revision snapshot
    if (content !== undefined) {
      await withDbRetry(() =>
        db.blogRevision.create({
          data: {
            blogId: id,
            content,
            createdBy: (existing as any).createdBy,
            label: revisionLabel || "Autosave",
          } as never,
        })
      ).catch(() => {});
    }

    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("API PUT /api/blogs/[id] error:", e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
