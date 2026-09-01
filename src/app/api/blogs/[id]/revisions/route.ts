import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const revs = await db.blogRevision.findMany({ where: { blogId: id } as never, orderBy: { createdAt: "desc" }, take: 50 } as never);
    return NextResponse.json({ data: revs });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
