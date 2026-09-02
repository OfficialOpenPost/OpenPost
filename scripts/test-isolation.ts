async function test() {
  const base = "http://localhost:3000";
  const removebgToken = "op_live_0ec68edec7cd65c20d357ac48812cad0d9ded3ff176f531a4c41d5772e0010dc";
  const techToken = "op_live_71ce11404f8a4c1cba3d8b9a5c7e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2"; // placeholder, need real
  // Actually fetch tech token from DB
  const { db } = await import("../src/lib/db");
  const techIntegration = await db.integration.findFirst({ where: { projectId: "714e3832-1231-4e57-bc3c-1b9fb0e3dc6b", revokedAt: null }});
  const techTokenReal = techIntegration ? null : null; // we'll just test with projectId param
  console.log("Testing with REMOVEBGNOW token...");
  let res = await fetch(`${base}/api/v1/posts?limit=10`, { headers: { Authorization: `Bearer ${removebgToken}` }});
  let json = await res.json().catch(()=>({}));
  console.log("Removebg token -> status", res.status, "count", json.data?.length, "projectId", json.meta?.projectId, "slugs", json.data?.map((p:any)=>p.slug));

  console.log("\nTesting with TECH projectId via query (no token)...");
  res = await fetch(`${base}/api/v1/posts?limit=10&project=tech-blog`);
  json = await res.json().catch(()=>({}));
  console.log("Tech project query -> status", res.status, "count", json.data?.length, "slugs", json.data?.map((p:any)=>p.slug));

  console.log("\nTesting with REMOVEBGNOW projectId via query...");
  res = await fetch(`${base}/api/v1/posts?limit=10&project=removebgnow`);
  json = await res.json().catch(()=>({}));
  console.log("Removebg query -> status", res.status, "count", json.data?.length, "slugs", json.data?.map((p:any)=>p.slug));

  console.log("\nTesting WITHOUT any project identification (should be empty due to strict isolation)...");
  res = await fetch(`${base}/api/v1/posts?limit=10`);
  json = await res.json().catch(()=>({}));
  console.log("No project -> status", res.status, "count", json.data?.length, "meta", json.meta);

  console.log("\nTesting cross-project: use removebg token but try to fetch tech-blog via header override (should be blocked)...");
  res = await fetch(`${base}/api/v1/posts?limit=10`, { headers: { Authorization: `Bearer ${removebgToken}`, "X-OpenPost-Project": "714e3832-1231-4e57-bc3c-1b9fb0e3dc6b" }});
  json = await res.json().catch(()=>({}));
  console.log("Cross-project header -> status", res.status, "count", json.data?.length, "projectId", json.meta?.projectId, "should be removebgnow projectId");

  await db.$disconnect();
}
test();
