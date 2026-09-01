#!/usr/bin/env node
import prompts from "prompts";
import open from "open";
import fs from "fs";
import path from "path";

function copyRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  console.log("\n=======================================================");
  console.log("  OpenPost CLI — Full-Stack Blog Starter Generator");
  console.log("=======================================================\n");

  const { cmsUrl } = await prompts({
    type: "text",
    name: "cmsUrl",
    message: "Enter your OpenPost CMS URL:",
    initial: "http://localhost:3000",
    validate: (v: string) => {
      try {
        new URL(v);
        return true;
      } catch {
        return "Please enter a valid URL (e.g. http://localhost:3000)";
      }
    },
  });

  if (!cmsUrl) {
    console.log("Setup aborted.");
    process.exit(1);
  }

  const cleanCmsUrl = cmsUrl.replace(/\/$/, "");

  // Health check
  try {
    const healthRes = await fetch(`${cleanCmsUrl}/api/health`).catch(() => null);
    if (!healthRes || !healthRes.ok) {
      console.log("Notice: CMS health check returned non-200. Proceeding with setup...");
    } else {
      console.log("✓ Connected to OpenPost CMS successfully.");
    }
  } catch {
    console.log("Notice: Could not reach health endpoint. Proceeding...");
  }

  const connectUrl = `${cleanCmsUrl}/cli/connect`;
  console.log(`\nOpening browser for authorization: ${connectUrl}`);
  try {
    await open(connectUrl);
  } catch {
    console.log(`Open this URL in your browser to approve: ${connectUrl}`);
  }

  const { code } = await prompts({
    type: "text",
    name: "code",
    message: "Paste the authorization code from your browser (e.g. OP-XXXX-YYYY-ZZZZ):",
    validate: (v: string) => (v && v.trim().length >= 6 ? true : "Please enter the authorization code."),
  });

  if (!code) {
    console.log("Setup aborted.");
    process.exit(1);
  }

  console.log("\nExchanging authorization code for secure API token...");

  const exchangeRes = await fetch(`${cleanCmsUrl}/api/cli/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.trim() }),
  });

  if (!exchangeRes.ok) {
    const errorJson = await exchangeRes.json().catch(() => ({}));
    console.error("❌ Code exchange failed:", errorJson.error?.message || exchangeRes.statusText);
    process.exit(1);
  }

  const exchangeData = await exchangeRes.json();
  const { token, projectId, projectName: cmsProjectName } = exchangeData;

  if (!token || !projectId) {
    console.error("❌ Invalid response received from CMS.");
    process.exit(1);
  }

  console.log(`✓ Authorized for project: ${cmsProjectName || projectId}`);

  // Project destination
  const { projectName } = await prompts({
    type: "text",
    name: "projectName",
    message: "Enter the directory name for your new Next.js blog:",
    initial: "my-openpost-blog",
  });

  if (!projectName) {
    console.log("Setup aborted.");
    process.exit(1);
  }

  const dest = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(dest)) {
    console.error(`❌ Directory "${projectName}" already exists. Please choose a different name.`);
    process.exit(1);
  }

  console.log(`\nScaffolding Next.js production blog in: ${dest}...`);
  fs.mkdirSync(dest, { recursive: true });

  // Locate templates/nextjs-blog
  // Check relative paths from CLI installation directory or monorepo root
  const candidateTemplateDirs = [
    path.resolve(__dirname, "../../templates/nextjs-blog"),
    path.resolve(__dirname, "../templates/nextjs-blog"),
    path.resolve(process.cwd(), "templates/nextjs-blog"),
  ];

  let templateDir = candidateTemplateDirs.find((d) => fs.existsSync(d) && fs.statSync(d).isDirectory());

  if (!templateDir) {
    console.error("❌ Could not locate templates/nextjs-blog directory.");
    process.exit(1);
  }

  // Copy template files recursively
  copyRecursiveSync(templateDir, dest);

  // Write .env.local
  const envContent = `# OpenPost CMS Connection Configuration
OPENPOST_URL=${cleanCmsUrl}
OPENPOST_PROJECT_ID=${projectId}
OPENPOST_TOKEN=${token}
SITE_URL=http://localhost:3001
`;

  fs.writeFileSync(path.join(dest, ".env.local"), envContent, "utf-8");

  // Customize package.json name
  const pkgPath = path.join(dest, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      pkg.name = projectName;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
    } catch {}
  }

  console.log("\n=======================================================");
  console.log(`  🎉 Successfully created ${projectName}!`);
  console.log("=======================================================\n");
  console.log("Next steps to start publishing:\n");
  console.log(`  1. cd ${projectName}`);
  console.log("  2. npm install");
  console.log("  3. npm run dev -p 3001\n");
  console.log(`Your blog will be live at http://localhost:3001 and connected to OpenPost CMS!\n`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
