import { db } from "../src/lib/db";
import { generateApiToken } from "../src/lib/apiToken";
async function main() {
  const project = await db.project.findFirst({ where: { slug: "removebgnow" } });
  if (!project) {
    console.error("removebgnow project not found");
    process.exit(1);
  }
  console.log("Found project", project.id, project.slug, project.name, "owner", project.ownerId);
  // Check existing not revoked
  const existing = await db.integration.findFirst({ where: { projectId: project.id, revokedAt: null }});
  if (existing) {
    console.log("Existing active token:", existing.tokenPrefix, "id", existing.id);
    console.log("Reusing existing — if you need a new one, revoke old or create new via dashboard");
    // Create a new one anyway for demo
  }
  const { rawToken, tokenHash, tokenPrefix } = generateApiToken();
  const integration = await db.integration.create({
    data: {
      projectId: project.id,
      name: "RemoveBgNow Blog Demo",
      tokenHash,
      tokenPrefix,
      permissions: ["READ_PUBLISHED_POSTS","READ_CATEGORIES","READ_TAGS","READ_AUTHORS","RECEIVE_WEBHOOKS"],
      createdBy: project.ownerId,
    }
  });
  console.log("\n=== NEW TOKEN FOR REMOVEBGNOW ===");
  console.log("Token:", rawToken);
  console.log("Prefix:", tokenPrefix);
  console.log("Project ID:", project.id);
  console.log("Project Slug:", project.slug);
  console.log("\nAdd to C:\\Users\\Alok\\Desktop\\removebgnow-blog\\.env.local:");
  console.log(`OPENPOST_URL=http://localhost:3000`);
  console.log(`OPENPOST_PROJECT_ID=${project.id}`);
  console.log(`OPENPOST_TOKEN=${rawToken}`);
  console.log(`NEXT_PUBLIC_SITE_URL=http://localhost:3001`);
}
main().finally(()=> db.$disconnect());
