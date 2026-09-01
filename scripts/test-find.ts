import { db, withDbRetry } from "../src/lib/db";

async function main() {
  try {
    const blog = await withDbRetry(() =>
      db.blog.findUnique({
        where: { id: "8df57565-925b-4b7a-a030-54f6a166841e" },
        include: {
          category: true,
          featuredImage: true,
          tags: { include: { tag: true } },
          authors: { include: { author: true }, orderBy: { sortOrder: "asc" } },
          project: { select: { id: true, name: true, slug: true } },
        },
      })
    );
    console.log("SUCCESS! Blog found:", blog ? blog.title : "null");
  } catch (err: any) {
    console.error("DB FindUnique Error:", err.message);
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
