import { NextResponse } from "next/server";
import { getPosts } from "@/lib/openpost";

export async function GET() {
  const baseUrl = process.env.SITE_URL || "http://localhost:3000";
  const { posts } = await getPosts({ limit: 50 });

  const rssItems = posts
    .map((post) => {
      const link = `${baseUrl}/blog/${post.slug}`;
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(post.publishedAt || Date.now()).toUTCString()}</pubDate>
      <description><![CDATA[${post.seo?.description || post.title}]]></description>
      ${post.category ? `<category>${post.category.name}</category>` : ""}
    </item>`;
    })
    .join("");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OpenPost Blog</title>
    <link>${baseUrl}</link>
    <description>Latest insights and articles powered by OpenPost CMS</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
