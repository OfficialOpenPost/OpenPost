import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const due = await db.blog.findMany({ where: { status: "scheduled" as never, scheduledAt: { lte: now } } as never });
    let published = 0;
    for (const b of due as any[]) {
      await db.blog.update({ where: { id: b.id } as never, data: { status: "published" as never, publishedAt: now } as never }).catch(()=>{});
      published++;
    }
    return NextResponse.json({ data: { checked: (due as any[]).length, published } });
  } catch (e) {
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}

export async function POST() { return GET(); }
