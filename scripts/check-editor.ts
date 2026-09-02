import { db } from "../src/lib/db";
async function main() {
  const profiles = await db.profile.findMany({ take: 2, include: { memberships: true } });
  console.log("Profiles with memberships:");
  for (const p of profiles) {
    console.log(p.email, p.status, p.memberships.map(m => `${m.projectId}:${m.role}`));
  }
  const projs = await db.project.findMany({ take: 2, include: { members: true } });
  console.log("\nProjects:");
  for (const pr of projs) {
    console.log(pr.name, pr.id, pr.slug, "members:", pr.members.map(m => `${m.userId}:${m.role}`));
  }
  const blogs = await db.blog.findMany({ take: 3, orderBy: { updatedAt: "desc" } });
  console.log("\nBlogs:", blogs.map(b => ({ title: b.title, slug: b.slug, status: b.status, projectId: b.projectId, id: b.id.slice(0,8) })));
  const cats = await db.category.findMany({ take: 5 });
  console.log("\nCategories:", cats.map(c => ({ name: c.name, slug: c.slug, projectId: c.projectId })));
}
main().finally(() => db.$disconnect());
