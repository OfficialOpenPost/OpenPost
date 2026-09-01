import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  content: z.any(),
  status: z.enum(["draft", "published", "scheduled"]).optional(),
  projectId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  updatedAt: z.string().optional(), // for conflict check
  id: z.string().uuid().optional(), // for update via POST
});

function extractMediaUrls(content: any): string[] {
  const urls: string[] = [];
  const walk = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === "image" && node.attrs?.src) urls.push(node.attrs.src);
    if (node.type === "gallery" && Array.isArray(node.attrs?.images)) node.attrs.images.forEach((im: any) => im.src && urls.push(im.src));
    if (node.type === "videoBlock" && node.attrs?.src) urls.push(node.attrs.src);
    if (node.attrs?.poster) urls.push(node.attrs.poster);
    // recurse
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
    // Find media by URL substring or id — try to match R2 publicUrl or variants
    // For now, try direct lookup by URL in variants or by id
    let mediaIds: string[] = [];
    // Try to find media where variants JSON contains URL or original matches
    // Fallback: extract UUID from URL
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    for (const url of urls) {
      const m = url.match(uuidRegex);
      if (m) mediaIds.push(m[0]);
    }
    // Also query DB for media where url appears in variants or public url
    try {
      const found = await (db as any).$queryRaw`SELECT id FROM media WHERE ${urls.join(",")} ILIKE ANY(ARRAY[variants::text]) LIMIT 20`;
      if (Array.isArray(found)) found.forEach((r: any) => r.id && mediaIds.push(r.id));
    } catch {}
    mediaIds = [...new Set(mediaIds)];
    if (!mediaIds.length) return;
    // Diff: delete old not in new, add new not in old
    const existing = await db.mediaUsage.findMany({ where: { blogId } as never, select: { mediaId: true } } as never).catch(() => [] as any);
    const existingIds = new Set((existing as any[]).map((r) => r.mediaId));
    const newIds = new Set(mediaIds);
    const toDelete = [...existingIds].filter((id) => !newIds.has(id));
    const toAdd = [...newIds].filter((id) => !existingIds.has(id));
    if (toDelete.length) await db.mediaUsage.deleteMany({ where: { blogId, mediaId: { in: toDelete } } as never }).catch(() => {});
    for (const mediaId of toAdd) {
      // Verify media exists before insert
      const exists = await db.media.findUnique({ where: { id: mediaId } as never }).catch(() => null);
      if (exists) await db.mediaUsage.create({ data: { blogId, mediaId } as never }).catch(() => {});
    }
  } catch (e) {
    console.warn("media_usage diff failed", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    }
    const { title, slug, content, status = "draft", projectId, categoryId, updatedAt, id } = parsed.data as any;

    // RBAC — require WRITER+ (allow without DB for build)
    try {
      const user = await getCurrentUser();
      if (user && !["WRITER", "EDITOR", "ADMIN"].includes(user.role)) {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "Insufficient role" } }, { status: 403 });
      }
      // If no user but DB configured, middleware already returned 401 — allow mock for dev
    } catch {}

    // If id provided → update (autosave) with conflict check
    if (id) {
      const existing = await db.blog.findUnique({ where: { id } as never });
      if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Blog not found" } }, { status: 404 });
      // updatedAt conflict check: if client sent stale updatedAt and DB is newer → 409
      if (updatedAt && (existing as any).updatedAt) {
        const clientTime = new Date(updatedAt).getTime();
        const serverTime = new Date((existing as any).updatedAt).getTime();
        if (!isNaN(clientTime) && serverTime - clientTime > 1000) {
          return NextResponse.json({ error: { code: "CONFLICT", message: "Conflict: post was updated elsewhere", details: { serverUpdatedAt: (existing as any).updatedAt } } }, { status: 409 });
        }
      }
      const updated = await db.blog.update({
        where: { id } as never,
        data: { title, slug, content, status: status as never, wordCount: JSON.stringify(content).length, categoryId: categoryId ?? undefined } as never,
      });
      await db.blogRevision.create({ data: { blogId: id, content, createdBy: (existing as any).createdBy, label: "Autosave" } } as never).catch(() => {});
      await syncMediaUsage(id, content);
      return NextResponse.json({ data: updated });
    }

    // Check slug uniqueness per project (if projectId provided)
    const whereClause: any = projectId ? { slug, projectId } : { slug };
    const existing = await db.blog.findFirst({ where: whereClause } as never);
    if (existing) {
      return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Slug already exists", details: { slug } } }, { status: 409 });
    }

    let createdBy = "00000000-0000-0000-0000-000000000000";
    try {
      const user = await getCurrentUser();
      if (user?.id) createdBy = user.id;
    } catch {}
    // Fallback if user not in users table — use service role bypass, but keep placeholder for build without DB
    const blog = await db.blog.create({
      data: {
        title,
        slug,
        content,
        status: status as never,
        wordCount: JSON.stringify(content).length,
        createdBy,
        seo: {},
        projectId: projectId ?? null,
        categoryId: categoryId ?? null,
      } as never,
    });

    // Create initial revision
    await db.blogRevision.create({
      data: { blogId: blog.id, content, createdBy: (blog as any).createdBy, label: "Created" },
    } as never).catch(() => {});

    await syncMediaUsage((blog as any).id, content);

    return NextResponse.json({ data: blog }, { status: 201 });
  } catch (e) {
    // Fallback for when DB not configured (dev without DATABASE_URL)
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Alias to POST with id for compatibility
  return POST(req);
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const cursor = searchParams.get("cursor");
  const status = searchParams.get("status");

  try {
    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;

    const blogs = await db.blog.findMany({
      where: where as never,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, slug: true, status: true, wordCount: true, readingTime: true, updatedAt: true },
    });

    const hasMore = blogs.length > limit;
    const data = hasMore ? blogs.slice(0, -1) : blogs;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ data, meta: { cursor: nextCursor, hasMore } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ data: [], meta: { hasMore: false } });
  }
}
