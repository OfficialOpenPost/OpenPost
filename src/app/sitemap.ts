import { MetadataRoute } from "next";
import { db, withDbRetry } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://openpost.app";

  try {
    const posts = await withDbRetry(() =>
      db.blog.findMany({
        where: {
          status: "published",
        },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 1000,
      })
    ).catch(() => []);

    const authors = await withDbRetry(() =>
      db.author.findMany({
        select: {
          slug: true,
          updatedAt: true,
        },
        take: 500,
      })
    ).catch(() => []);

    const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const authorEntries: MetadataRoute.Sitemap = authors.map((author) => ({
      url: `${baseUrl}/authors/${author.slug}`,
      lastModified: author.updatedAt || new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/docs`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      },
      ...postEntries,
      ...authorEntries,
    ];
  } catch {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
    ];
  }
}
