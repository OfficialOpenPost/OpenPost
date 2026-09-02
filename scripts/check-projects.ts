import { db } from "../src/lib/db";
async function main() {
  try {
    const projects = await db.project.findMany({ select: { id: true, slug: true, name: true, createdAt: true }, orderBy: { createdAt: "asc" } });
    console.log("Projects:", JSON.stringify(projects, null, 2));
    const blogs = await db.blog.findMany({ select: { id: true, title: true, projectId: true, status: true, slug: true }, take: 10 });
    console.log("Blogs sample:", JSON.stringify(blogs, null, 2));
    const countByProject: Record<string, number> = {};
    for (const b of blogs) countByProject[b.projectId || "null"] = (countByProject[b.projectId || "null"] || 0) + 1;
    console.log("Count by project:", countByProject);
  } catch (e) {
    console.error(e);
  } finally {
    await db.$disconnect();
  }
}
main();
