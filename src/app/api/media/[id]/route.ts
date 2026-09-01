import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser().catch(() => null);
    if (user && !["EDITOR", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Only EDITOR+ can delete media" } }, { status: 403 });
    }
    const { id } = await params;
    const media = await db.media.findUnique({ where: { id } as never });
    if (!media) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

    // Safe-delete: check usage
    let usages: any[] = [];
    try {
      const r: any = await (db as any).$queryRaw`SELECT blog_id FROM media_usage WHERE media_id = ${id}::uuid`;
      usages = r ?? [];
    } catch {
      usages = await db.mediaUsage.findMany({ where: { mediaId: id } as never, select: { blogId: true } } as never).catch(() => []) as any;
      usages = usages.map((u: any) => ({ blog_id: u.blogId }));
    }
    if (usages.length > 0) {
      // Fetch blog titles for warning copy
      let titles: string[] = [];
      try {
        const ids = usages.map((u: any) => u.blog_id ?? u.blogId);
        const blogs = await db.blog.findMany({ where: { id: { in: ids } } as never, select: { title: true } } as never).catch(() => []);
        titles = (blogs as any[]).map((b) => b.title);
      } catch {}
      return NextResponse.json(
        { error: { code: "IN_USE", message: `In use by ${usages.length} post(s)`, details: { count: usages.length, titles, usages } } },
        { status: 409 }
      );
    }

    await db.media.delete({ where: { id } as never });
    // Optionally delete from R2 (fire-and-forget)
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { altTextDefault } = body as any;
    const updated = await db.media.update({ where: { id } as never, data: { altTextDefault } as never });
    return NextResponse.json({ data: updated });
  } catch (e) {
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
