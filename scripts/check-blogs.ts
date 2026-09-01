import { db, withDbRetry } from "../src/lib/db";

async function main() {
  const blogs = await withDbRetry(() =>
    db.blog.findMany({
      include: {
        category: true,
        author: true,
        project: true,
        featuredImage: true,
      },
    })
  );

  console.log(`Found ${blogs.length} blogs in database:`);
  for (const b of blogs) {
    console.log({
      id: b.id,
      title: b.title,
      slug: b.slug,
      status: b.status,
      publishedAt: b.publishedAt,
      projectId: b.projectId,
      createdBy: b.createdBy,
      category: b.category?.name,
      contentType: typeof b.content,
      contentIsDoc: typeof b.content === "object" && b.content !== null ? (b.content as any).type : "not-doc",
    });
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
