import { db } from "../src/lib/db";

async function main() {
  const projectId = "39e1e4e6-8425-4713-ac15-789cf7e8dca6";
  const project = await db.project.findUnique({ where: { id: projectId }});
  if (!project) {
    console.error("Project not found");
    process.exit(1);
  }
  console.log("Seeding for", project.name, project.slug);

  // Find owner user
  const ownerId = project.ownerId;
  // Create or find category
  let cat = await db.category.findFirst({ where: { slug: "tutorials", projectId }});
  if (!cat) {
    cat = await db.category.create({ data: { name: "Tutorials", slug: "tutorials", description: "Step-by-step background removal guides", projectId }});
    console.log("Created category", cat.name);
  }
  let cat2 = await db.category.findFirst({ where: { slug: "updates", projectId }});
  if (!cat2) {
    cat2 = await db.category.create({ data: { name: "Updates", slug: "updates", description: "Product updates", projectId }});
    console.log("Created category", cat2.name);
  }

  // Create author
  let author = await db.author.findFirst({ where: { slug: "removebgnow-team", projectId }});
  if (!author) {
    author = await db.author.create({ data: { name: "RemoveBgNow Team", slug: "removebgnow-team", bio: "AI background removal experts", projectId, linkedUserId: ownerId }});
    console.log("Created author", author.name);
  }

  // Create tags
  let tag = await db.tag.findFirst({ where: { slug: "ai", projectId }});
  if (!tag) {
    tag = await db.tag.create({ data: { name: "AI", slug: "ai", projectId }});
  }

  const postsToCreate = [
    {
      title: "How to Remove Background in 2 Seconds with AI",
      slug: "how-to-remove-background-in-2-seconds",
      excerpt: "Learn how RemoveBgNow uses AI segmentation to cut out backgrounds perfectly, even for hair and transparent objects.",
      categoryId: cat.id,
    },
    {
      title: "E-commerce Product Photos That Convert",
      slug: "ecommerce-product-photos-that-convert",
      excerpt: "White backgrounds, consistent lighting, and batch processing tips for online stores.",
      categoryId: cat.id,
    },
    {
      title: "RemoveBgNow 2.0 — What's New?",
      slug: "removebgnow-2-0-whats-new",
      excerpt: "HD export, batch API, and Figma plugin — all new in 2.0.",
      categoryId: cat2.id,
    },
  ];

  for (const p of postsToCreate) {
    const exists = await db.blog.findFirst({ where: { slug: p.slug, projectId }});
    if (exists) {
      console.log("Post exists, skipping", p.slug);
      continue;
    }
    const blog = await db.blog.create({
      data: {
        title: p.title,
        slug: p.slug,
        content: {
          type: "doc",
          content: [
            { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: p.title }] },
            { type: "paragraph", content: [{ type: "text", text: p.excerpt }] },
            { type: "paragraph", content: [{ type: "text", text: "This is a demo post for RemoveBgNow Blog. Edit this content in OpenPost Dashboard → Articles & Posts." }] },
          ]
        },
        status: "published",
        publishedAt: new Date(),
        wordCount: 120,
        readingTime: 2,
        seo: { description: p.excerpt, title: p.title } as any,
        projectId,
        categoryId: p.categoryId,
        createdBy: ownerId,
      }
    });
    // Link author
    await db.blogAuthor.create({ data: { blogId: blog.id, authorId: author.id, sortOrder: 0 }});
    // Link tag
    await db.blogTag.create({ data: { blogId: blog.id, tagId: tag.id }});
    console.log("Created post", blog.title, blog.slug);
  }

  console.log("Done. Checking counts...");
  const count = await db.blog.count({ where: { projectId, status: "published" }});
  console.log("Published for removebgnow:", count);
  const techCount = await db.blog.count({ where: { projectId: "714e3832-1231-4e57-bc3c-1b9fb0e3dc6b", status: "published" }});
  console.log("Published for tech-blog:", techCount);
}

main().finally(()=> db.$disconnect());
