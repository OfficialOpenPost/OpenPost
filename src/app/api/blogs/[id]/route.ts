import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const blog = await db.blog.findUnique({ where: { id } as never });
    if (!blog) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ data: blog });
  } catch (e) {
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser().catch(() => null);
    if (user && !["ADMIN", "EDITOR"].includes(user.role)) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "Only EDITOR+ can delete" } }, { status: 403 });
    }
    const { id } = await params;
    const existing = await db.blog.findUnique({ where: { id } as never });
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    // Soft delete to trash or hard delete? For now move to trash if not already
    if ((existing as any).status !== "trash") {
      const updated = await db.blog.update({ where: { id } as never, data: { status: "trash" as never } });
      return NextResponse.json({ data: updated });
    }
    await db.blog.delete({ where: { id } as never });
    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await db.blog.findUnique({ where: { id } as never });
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
    if (body.updatedAt && (existing as any).updatedAt) {
      const client = new Date(body.updatedAt).getTime();
      const server = new Date((existing as any).updatedAt).getTime();
      if (server - client > 1000) return NextResponse.json({ error: { code: "CONFLICT", message: "Conflict: stale update" } }, { status: 409 });
    }
    const updated = await db.blog.update({ where: { id } as never, data: { ...body, updatedAt: new Date() } as never });
    return NextResponse.json({ data: updated });
  } catch (e) {
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
