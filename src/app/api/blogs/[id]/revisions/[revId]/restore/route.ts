import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; revId: string }> }) {
  try {
    const { id, revId } = await params;
    const rev = await db.blogRevision.findUnique({ where: { id: revId } as never });
    if (!rev || (rev as any).blogId !== id) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    const updated = await db.blog.update({ where: { id } as never, data: { content: (rev as any).content, wordCount: JSON.stringify((rev as any).content).length } as never });
    await db.blogRevision.create({ data: { blogId: id, content: (rev as any).content, createdBy: (rev as any).createdBy, label: "Restore" } as never }).catch(()=>{});
    return NextResponse.json({ data: updated });
  } catch (e) {
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
