import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, AuthError, createAuditLog } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "projectId query parameter is required." } },
        { status: 400 }
      );
    }

    const adminUser = await requireAdmin(projectId);

    const ip = getClientIp(req as unknown as Request);
    const rl = rateLimit(`export:${ip}`, { windowMs: 60_000, max: 5 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many export requests. Try again later." } },
        { status: 429, headers: { "Retry-After": Math.ceil((rl.resetAt - Date.now()) / 1000).toString() } }
      );
    }

    const [blogs, categories, tags, authors, media] = await Promise.all([
      db.blog.findMany({
        where: { projectId },
        include: {
          category: true,
          tags: { include: { tag: true } },
          authors: { include: { author: true } },
        },
      }).catch(() => []),
      db.category.findMany({ where: { projectId } }).catch(() => []),
      db.tag.findMany({ where: { projectId } }).catch(() => []),
      db.author.findMany({ where: { projectId } }).catch(() => []),
      db.media.findMany({
        where: { projectId },
        select: { id: true, originalFilename: true, mimeType: true, variants: true },
      }).catch(() => []),
    ]);

    await createAuditLog({
      actorId: adminUser.id,
      projectId,
      action: "settings.exported",
    });

    const backupData = {
      meta: {
        generator: "OpenPost CMS Export Engine",
        version: "1.4.0",
        exportedAt: new Date().toISOString(),
        projectId,
        totalBlogs: blogs.length,
        totalCategories: categories.length,
        totalTags: tags.length,
        totalAuthors: authors.length,
      },
      authors,
      categories,
      tags,
      blogs,
      media,
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="openpost-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "EXPORT_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Export failed." } },
      { status }
    );
  }
}
