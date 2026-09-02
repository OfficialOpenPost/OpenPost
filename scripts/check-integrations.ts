import { db } from "../src/lib/db";
async function main() {
  const projects = await db.project.findMany({ select: { id: true, slug: true, name: true }});
  console.log("Projects", projects);
  const integrations = await db.integration.findMany({ select: { id: true, name: true, projectId: true, tokenPrefix: true, createdAt: true, revokedAt: true }});
  console.log("Integrations", integrations);
  // Check blogs per project
  for (const p of projects) {
    const count = await db.blog.count({ where: { projectId: p.id, status: "published" }});
    console.log(`Blogs published for ${p.slug} (${p.id.slice(0,8)}): ${count}`);
  }
}
main().finally(()=> db.$disconnect());
