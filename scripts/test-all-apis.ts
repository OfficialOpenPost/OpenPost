async function testAllApis() {
  console.log("================================================================");
  console.log("🌐 OPENPOST COMPREHENSIVE API SYSTEM AUDIT & TEST");
  console.log("================================================================\n");

  const baseUrl = "http://localhost:3000";

  const publicEndpoints = [
    { name: "Health Check", method: "GET", url: "/api/health", expected: [200] },
    { name: "Public Posts Stream", method: "GET", url: "/api/v1/posts?limit=5", expected: [200] },
    { name: "Public Post by Slug", method: "GET", url: "/api/v1/posts/what-are-the-most-recent-online-background-remover-tools-compare", expected: [200, 404] },
    { name: "Public Categories List", method: "GET", url: "/api/v1/categories", expected: [200] },
    { name: "Public Tags List", method: "GET", url: "/api/v1/tags", expected: [200] },
    { name: "Public Authors List", method: "GET", url: "/api/v1/authors", expected: [200] },
    { name: "Cron Scheduled Publish", method: "GET", url: "/api/cron/publish", expected: [200, 401] },
    { name: "CLI Exchange Auth", method: "POST", url: "/api/cli/exchange", body: { code: "invalid_test_code" }, expected: [400, 404, 401] },
    { name: "Protected Blogs List (Unauthed Guard)", method: "GET", url: "/api/blogs", expected: [200, 401, 403] },
    { name: "Protected Projects List (Unauthed Guard)", method: "GET", url: "/api/projects", expected: [200, 401, 403] },
    { name: "Protected Media List (Unauthed Guard)", method: "GET", url: "/api/media", expected: [200, 401, 403] },
    { name: "Protected Webhooks (Unauthed Guard)", method: "GET", url: "/api/webhooks", expected: [200, 401, 403] },
    { name: "Protected Settings (Unauthed Guard)", method: "GET", url: "/api/settings", expected: [200, 401, 403] },
    { name: "Protected Tokens (Unauthed Guard)", method: "GET", url: "/api/settings/tokens", expected: [200, 401, 403] },
  ];

  let passed = 0;
  let failed = 0;

  for (const ep of publicEndpoints) {
    try {
      const options: RequestInit = {
        method: ep.method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "OpenPost-ApiTester/1.0",
        },
      };
      if (ep.body) {
        options.body = JSON.stringify(ep.body);
      }

      const res = await fetch(`${baseUrl}${ep.url}`, options);
      const json = await res.json().catch(() => null);

      if (ep.expected.includes(res.status)) {
        console.log(`✅ [${res.status}] ${ep.method.padEnd(5)} ${ep.url.padEnd(45)} | ${ep.name}`);
        passed++;
      } else {
        console.error(`❌ [${res.status}] ${ep.method.padEnd(5)} ${ep.url.padEnd(45)} | Expected ${ep.expected.join(",")} but got ${res.status}`);
        console.error(`   Response payload:`, JSON.stringify(json));
        failed++;
      }
    } catch (err: any) {
      console.error(`❌ [ERR] ${ep.method.padEnd(5)} ${ep.url.padEnd(45)} | FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log("\n================================================================");
  console.log(`🎯 API TEST SUMMARY: ${passed} / ${publicEndpoints.length} Endpoints Operational (${failed} errors)`);
  console.log("================================================================");
}

testAllApis().catch((err) => {
  console.error("Fatal API test failure:", err);
  process.exit(1);
});
