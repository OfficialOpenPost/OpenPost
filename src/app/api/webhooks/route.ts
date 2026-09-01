import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/webhooks — list
export async function GET() {
  try {
    const webhooks = await db.webhook.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ data: webhooks });
  } catch {
    // Fallback mock when DB not configured
    return NextResponse.json({ data: [] });
  }
}

// POST /api/webhooks — create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, url, events, secret, filter } = body;
    if (!name || !url || !events?.length) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "name, url, events required" } }, { status: 400 });
    }
    const webhook = await db.webhook.create({
      data: { name, url, events, secret: secret || null, filter: filter || null },
    });
    return NextResponse.json({ data: webhook }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: { code: "CREATE_FAILED", message: String(e) } }, { status: 500 });
  }
}
