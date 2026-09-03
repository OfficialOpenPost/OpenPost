import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { resolveProjectContext } from "@/lib/apiToken";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://openpost.app";
    const context = await resolveProjectContext(req);

    const where: any = {
      status: "published",
    };
    if (context?.projectId) {
      where.projectId = context.projectId;
    }

    const posts = await withDbRetry(() =>
      db.blog.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          author: {
            select: { name: true },
          },
          category: {
            select: { name: true },
          },
        },
      })
    ).catch(() => []);

    const rssItems = posts
      .map((p) => {
        const title = escapeXml(p.title || "Untitled Post");
        const link = `${baseUrl}/blog/${p.slug}`;
        const pubDate = p.publishedAt
          ? new Date(p.publishedAt).toUTCString()
          : new Date().toUTCString();
        const author = escapeXml(p.author?.name || "Editorial Team");
        const category = escapeXml(p.category?.name || "General");

        return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${author}</author>
      <category>${category}</category>
    </item>`;
      })
      .join("\n");

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OpenPost Publication</title>
    <link>${baseUrl}/blog</link>
    <description>Latest published articles and updates from OpenPost</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("GET /feed.xml error:", err);
    return new NextResponse("Error generating RSS feed", { status: 500 });
  }
}
