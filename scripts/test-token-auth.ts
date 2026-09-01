import { db, withDbRetry } from "../src/lib/db";
import { generateApiToken } from "../src/lib/apiToken";

async function testTokenAuth() {
  console.log("================================================================");
  console.log("🔑 TESTING OPENPOST API TOKEN AUTHENTICATION SYSTEM");
  console.log("================================================================\n");

  // 1. Find project
  const project = await withDbRetry(() => db.project.findFirst());
  if (!project) {
    throw new Error("No project found in database.");
  }
  console.log(`📍 Found Project: ${project.name} (${project.id})`);

  // 2. Generate a live token
  const { rawToken, tokenHash, tokenPrefix } = generateApiToken();
  console.log(`✨ Generated Test API Token: ${tokenPrefix} (Raw: ${rawToken})`);

  const user = await withDbRetry(() => db.user.findFirst());
  if (!user) throw new Error("No user found in database.");

  // 3. Save integration to database
  const integration = await withDbRetry(() =>
    db.integration.create({
      data: {
        name: "Test Automated Verification Token",
        projectId: project.id,
        tokenHash,
        tokenPrefix,
        permissions: ["post.read", "category.read"],
        createdBy: user.id,
      },
    })
  );
  console.log(`✅ Integration record saved to DB with ID: ${integration.id}`);

  // 4. Test live HTTP request with Bearer token
  const res = await fetch("http://localhost:3000/api/v1/posts?limit=5", {
    headers: {
      Authorization: `Bearer ${rawToken}`,
    },
  });

  const json = await res.json();
  console.log(`📡 API Response Status: [${res.status}]`);
  console.log(`📦 Response Meta:`, JSON.stringify(json.meta));
  console.log(`📝 Posts Retrieved via Token: ${json.data?.length || 0}`);

  if (res.status === 200 && json.meta?.projectId === project.id) {
    console.log("🎉 Token authentication verified 100% operational!");
  } else {
    throw new Error(`Token verification failed with status ${res.status}`);
  }

  // 5. Clean up test token
  await withDbRetry(() => db.integration.delete({ where: { id: integration.id } }));
  console.log("🧹 Cleaned up temporary test integration token from DB.");
}

testTokenAuth().catch((err) => {
  console.error("Token test failed:", err);
  process.exit(1);
});
