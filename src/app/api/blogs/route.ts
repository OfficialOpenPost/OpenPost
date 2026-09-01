import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { countWords, readingTime as calcReadingTime } from "@/lib/publish";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  content: z.any(),
  status: z.enum(["draft", "published", "scheduled", "trash"]).optional(),
  projectId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  seo: z.any().optional(),
  updatedAt: z.string().optional(),
  id: z.string().nullable().optional(),
});

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
      await db.mediaUsage.deleteMany({ where: { blogId } as never }).catch(() => {});
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

    const existing = await db.mediaUsage.findMany({ where: { blogId } as never, select: { mediaId: true } } as never).catch(() => [] as any);
    const existingIds = new Set((existing as any[]).map((r) => r.mediaId));
    const newIds = new Set(mediaIds);
    const toDelete = [...existingIds].filter((id) => !newIds.has(id));
    const toAdd = [...newIds].filter((id) => !existingIds.has(id));

    if (toDelete.length) await db.mediaUsage.deleteMany({ where: { blogId, mediaId: { in: toDelete } } as never }).catch(() => {});
    for (const mediaId of toAdd) {
      const exists = await db.media.findUnique({ where: { id: mediaId } as never }).catch(() => null);
      if (exists) await db.mediaUsage.create({ data: { blogId, mediaId } as never }).catch(() => {});
    }
  } catch (e) {
    // Non-blocking
  }
}

async function resolveAuthorUserId(): Promise<string> {
  try {
    const currentUser = await getCurrentUser().catch(() => null);
    if (currentUser?.id) {
      const dbUser = await db.user.findUnique({ where: { id: currentUser.id } }).catch(() => null);
      if (dbUser) return dbUser.id;
    }

    // Fallback to first existing user
    let existingUser = await db.user.findFirst().catch(() => null);
    if (existingUser) return existingUser.id;

    // Create initial admin user if database is fresh
    existingUser = await db.user.create({
      data: {
        email: "admin@openpost.app",
        name: "OpenPost Admin",
        passwordHash: "seed-account",
        role: "ADMIN",
      },
    }).catch(() => null);

    if (existingUser) return existingUser.id;
  } catch (e) {
    console.warn("Could not resolve author user id:", e);
  }

  return "00000000-0000-0000-0000-000000000000";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    }
    let { title, slug, content, status = "draft", projectId, categoryId, scheduledAt, seo, updatedAt, id } = parsed.data as any;

    // Sanitize empty strings
    if (!categoryId || typeof categoryId !== "string" || categoryId.trim() === "") categoryId = null;
    if (!projectId || typeof projectId !== "string" || projectId.trim() === "") projectId = null;
    if (!id || typeof id !== "string" || id.trim() === "" || id === "new-post") id = undefined;

    if (scheduledAt && new Date(scheduledAt) > new Date()) status = "scheduled";
    else if (status === "scheduled" && (!scheduledAt || new Date(scheduledAt) <= new Date())) status = "draft";

    // Verify foreign key references before insert/update
    if (categoryId) {
      const cat = await db.category.findUnique({ where: { id: categoryId } as never }).catch(() => null);
      if (!cat) categoryId = null;
    }

    if (projectId) {
      const proj = await db.project.findUnique({ where: { id: projectId } as never }).catch(() => null);
      if (!proj) projectId = null;
    }

    // 1. If ID provided → update existing post
    if (id) {
      const existing = await db.blog.findUnique({ where: { id } as never }).catch(() => null);
      if (existing) {
        if ((existing as any).slug !== slug && (existing as any).status === "published") {
          await db.redirect.create({ data: { oldSlug: (existing as any).slug, newSlug: slug, blogId: id } as never }).catch(() => {});
        }
        const wc = countWords(JSON.stringify(content));
        const rt = calcReadingTime(wc);
        const updated = await db.blog.update({
          where: { id } as never,
          data: {
            title,
            slug,
            content,
            status: status as never,
            wordCount: wc,
            readingTime: rt,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            seo: seo ?? undefined,
            categoryId: categoryId ?? undefined,
          } as never,
        });

        await db.blogRevision.create({
          data: { blogId: id, content, createdBy: (existing as any).createdBy, label: "Autosave" },
        }).catch(() => {});

        await syncMediaUsage(id, content);
        return NextResponse.json({ data: updated });
      }
    }

    // 2. Auto-suffix duplicate slugs
    let candidateSlug = slug || "untitled";
    let counter = 1;
    let existingWithSlug = await db.blog.findFirst({ where: { slug: candidateSlug } as never }).catch(() => null);

    while (existingWithSlug) {
      counter++;
      candidateSlug = `${slug.replace(/-\d+$/, "")}-${counter}`;
      existingWithSlug = await db.blog.findFirst({ where: { slug: candidateSlug } as never }).catch(() => null);
    }
    slug = candidateSlug;

    // 3. Resolve valid author user ID for foreign key constraint
    const createdBy = await resolveAuthorUserId();

    const wc2 = countWords(JSON.stringify(content));
    const rt2 = calcReadingTime(wc2);

    const blog = await db.blog.create({
      data: {
        title,
        slug,
        content,
        status: status as never,
        wordCount: wc2,
        readingTime: rt2,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: status === "published" ? new Date() : null,
        createdBy,
        seo: seo ?? {},
        projectId: projectId ?? null,
        categoryId: categoryId ?? null,
      } as never,
    });

    // Create initial revision
    await db.blogRevision.create({
      data: { blogId: blog.id, content, createdBy: (blog as any).createdBy, label: "Created" },
    }).catch(() => {});

    await syncMediaUsage(blog.id, content);

    return NextResponse.json({ data: blog }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to save blog:", error);
    return NextResponse.json(
      { error: { code: "SAVE_FAILED", message: String(error?.message ?? error) } },
      { status: 500 }
    );
  }
}
