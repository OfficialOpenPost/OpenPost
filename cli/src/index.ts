#!/usr/bin/env node
import prompts from "prompts";
import open from "open";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Welcome to create-openpost — connect your frontend to OpenPost CMS\n");

  const { cmsUrl } = await prompts({
    type: "text",
    name: "cmsUrl",
    message: "Enter your OpenPost CMS URL:",
    initial: "https://cms.example.com",
    validate: (v: string) => {
      try { new URL(v); return true; } catch { return "Enter a valid URL"; }
    }
  });

  if (!cmsUrl) process.exit(1);

  // Validate URL
  try {
    const res = await fetch(`${cmsUrl}/api/health`);
    if (!res.ok) console.log("Warning: CMS health check failed, continuing...");
  } catch {
    console.log("Warning: could not reach CMS, continuing...");
  }

  const connectUrl = `${cmsUrl.replace(/\/$/, "")}/cli/connect`;
  console.log(`\nOpening browser for authorization: ${connectUrl}`);
  await open(connectUrl);

  const { code } = await prompts({
    type: "text",
    name: "code",
    message: "Paste the authorization code from the browser (or connection code OP-XXXX-XXXX):",
    validate: (v: string) => v.length > 5 ? true : "Enter code"
  });

  // Exchange code for token
  console.log("\nExchanging code...");
  const res = await fetch(`${cmsUrl}/api/cli/exchange`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    console.error("Exchange failed:", j.error ?? res.statusText);
    process.exit(1);
  }
  const { token, projectId } = await res.json();
  if (!token || !projectId) {
    console.error("Invalid response from CMS");
    process.exit(1);
  }

  // Generate project
  const { projectName } = await prompts({
    type: "text",
    name: "projectName",
    message: "Project name:",
    initial: "my-blog"
  });

  const dest = path.join(process.cwd(), projectName);
  if (fs.existsSync(dest)) {
    console.log("Directory already exists");
    process.exit(1);
  }
  fs.mkdirSync(dest, { recursive: true });

  // Copy template (simplified)
  fs.writeFileSync(path.join(dest, ".env.local"), `OPENPOST_URL=${cmsUrl}\nOPENPOST_PROJECT_ID=${projectId}\nOPENPOST_TOKEN=${token}\n`);
  fs.writeFileSync(path.join(dest, "package.json"), JSON.stringify({ name: projectName, dependencies: { next: "16.3.3" } }, null, 2));

  console.log(`\nCreated ${projectName} with OpenPost integration`);
  console.log(`Next: cd ${projectName} && npm install && npm run dev`);
}

main().catch((e) => { console.error(e); process.exit(1); });
