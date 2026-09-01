import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const [blogs, categories, tags, authors, settings, media] = await Promise.all([
      db.blog.findMany({
        include: {
          category: true,
          tags: { include: { tag: true } },
          authors: { include: { author: true } },
        },
      }).catch(() => []),
      db.category.findMany().catch(() => []),
      db.tag.findMany().catch(() => []),
      db.author.findMany().catch(() => []),
      db.setting.findMany().catch(() => []),
      db.media.findMany({ select: { id: true, originalFilename: true, mimeType: true, variants: true } }).catch(() => []),
    ]);

    const backupData = {
      meta: {
        generator: "OpenPost CMS Export Engine",
        version: "1.4.0",
        exportedAt: new Date().toISOString(),
        totalBlogs: blogs.length,
        totalCategories: categories.length,
        totalTags: tags.length,
        totalAuthors: authors.length,
      },
      settings,
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
    return NextResponse.json(
      { error: { code: "EXPORT_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}
