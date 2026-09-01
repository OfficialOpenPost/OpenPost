import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const data = await db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });
    return NextResponse.json({ data, meta: { hasMore: false } }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ data: [], meta: { hasMore: false } });
  }
}
