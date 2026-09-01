import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  content: z.any(),
  status: z.enum(["draft", "published", "scheduled"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    }
    const { title, slug, content, status = "draft" } = parsed.data;

    // Check slug uniqueness per project (if projectId provided)
    const existing = await db.blog.findFirst({ where: { slug } as never });
    if (existing) {
      return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Slug already exists", details: { slug } } }, { status: 409 });
    }

    const blog = await db.blog.create({
      data: {
        title,
        slug,
        content,
        status: status as never,
        wordCount: JSON.stringify(content).length,
        createdBy: "00000000-0000-0000-0000-000000000000", // TODO: from auth
        seo: {},
      },
    });

    // Create initial revision
    await db.blogRevision.create({
      data: { blogId: blog.id, content, createdBy: blog.createdBy, label: "Created" },
    });

    return NextResponse.json({ data: blog }, { status: 201 });
  } catch (e) {
    // Fallback for when DB not configured (dev without DATABASE_URL)
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
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
