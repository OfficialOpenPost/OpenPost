import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const blog = await db.blog.findUnique({ where: { id } as never });
    if (!blog) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const prev = (blog as any).status === "trash" ? "draft" : (blog as any).status;
    const target = prev === "trash" ? "draft" : prev;
    const updated = await db.blog.update({ where: { id } as never, data: { status: target as never } });
    return NextResponse.json({ data: updated });
  } catch (e) {
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
