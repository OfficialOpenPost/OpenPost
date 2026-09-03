#!/usr/bin/env node
import prompts from "prompts";
import open from "open";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// --- helpers ---
const pkg = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")); } catch { return { version: "0.2.2", name: "openpost-cli" }; }
})();
const VERSION = pkg.version;
const NAME = "openpost-cli";

// Minimal chalk fallback if not installed as ESM
let chalk: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  chalk = require("chalk");
  if (chalk.default) chalk = chalk.default;
} catch {
  chalk = {
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    cyan: (s: string) => s,
    dim: (s: string) => s,
    bold: (s: string) => s,
  };
}

function logStep(msg: string) { console.log(chalk.cyan("→"), msg); }
function logSuccess(msg: string) { console.log(chalk.green("✓"), msg); }
function logError(msg: string) { console.error(chalk.red("✗"), msg); }
function logWarn(msg: string) { console.warn(chalk.yellow("!"), msg); }

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--version" || a === "-v") args.version = true;
    else if (a === "--yes" || a === "-y") args.yes = true;
    else if (a === "--skip-health") args.skipHealth = true;
    else if (a.startsWith("--cms-url=")) args.cmsUrl = a.split("=")[1];
    else if (a.startsWith("--code=")) args.code = a.split("=")[1];
    else if (a.startsWith("--project=")) args.project = a.split("=")[1];
    else if (a === "--cms-url" && argv[i+1]) args.cmsUrl = argv[++i];
    else if (a === "--code" && argv[i+1]) args.code = argv[++i];
    else if (a === "--project" && argv[i+1]) args.project = argv[++i];
    else if (!a.startsWith("-") && !args.command) args.command = a;
    else if (!a.startsWith("-") && !args.command) args.command = a;
  }
  return args;
}

function printHelp() {
  console.log(`
${chalk.bold("OpenPost CLI")} — Headless CMS connector (like sanity init)

${chalk.bold("Usage:")}
  npx ${NAME} [command] [options]

${chalk.bold("Commands:")}
  init [dir]          Scaffold a new Next.js blog (default)
  login               Authenticate with CMS (opens browser)
  logout              Clear saved token (local)
  doctor              Run CMS health checks
  help                Show this help
  version             Show version

${chalk.bold("Options:")}
  --cms-url <url>     CMS URL (e.g. https://cms.example.com)
  --code <OP-XXXX>    Authorization code (skip prompt)
  --project <name>    Project directory name (skip prompt)
  --skip-health       Skip CMS health check (not recommended)
  --yes, -y           Non-interactive defaults
  --help, -h          Show help
  --version, -v       Show version

${chalk.bold("Examples:")}
  npx ${NAME} init my-blog
  npx ${NAME} --cms-url http://localhost:3000 --project my-blog
  npx ${NAME} doctor --cms-url https://cms.example.com

Docs: https://github.com/OfficialOpenPost/OpenPost
`);
}

function checkNode() {
  const major = parseInt(process.versions.node.split(".")[0], 10);
  if (major < 18) {
    logError(`Node.js 18+ required (found ${process.versions.node}). Please upgrade.`);
    process.exit(1);
  }
}

function copyRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && (stats as any).isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      // Skip heavy dirs that shouldn't be in template
      if (["node_modules", ".next", ".git", "dist"].includes(child)) continue;
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else if (exists) {
    // Skip if src is same as dest or outside
    fs.copyFileSync(src, dest);
  }
}

async function healthCheck(cmsUrl: string, skip: boolean) {
  if (skip) { logWarn("Skipping health check (requested)."); return true; }
  logStep(`Checking CMS health at ${cmsUrl}/api/health ...`);
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${cmsUrl}/api/health`, { signal: controller.signal, headers: { "User-Agent": `${NAME}/${VERSION}` } }).catch(() => null);
    clearTimeout(t);
    if (!res) throw new Error("No response");
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${text.slice(0,120)}`);
    }
    const json = await res.json().catch(() => ({}));
    // health endpoint returns { status: "ok" } or similar
    logSuccess(`Connected to OpenPost CMS (${cmsUrl})`);
    if (json.version) console.log(chalk.dim(`  CMS version: ${json.version}`));
    return true;
  } catch (e: any) {
    logError(`Health check failed: ${e.message || String(e)}`);
    console.log(chalk.dim(`  Tried: ${cmsUrl}/api/health`));
    console.log(chalk.yellow("  Tip: Ensure CMS is running and env is reachable. Use --skip-health to bypass (not recommended)."));
    throw e;
  }
}

async function exchangeCode(cmsUrl: string, code: string) {
  logStep("Exchanging code for API token ...");
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${cmsUrl}/api/cli/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": `${NAME}/${VERSION}` },
        body: JSON.stringify({ code: code.trim() }),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg = j.error?.message || res.statusText;
        // 400 invalid/expired should not retry
        if (res.status === 400 && /invalid|expired|used/i.test(msg)) throw new Error(msg);
        throw new Error(msg);
      }
      const data = await res.json();
      if (!data.token || !data.projectId) throw new Error("Invalid token response from CMS");
      return data as {
        token: string;
        projectId: string;
        projectSlug?: string;
        projectName?: string;
        tokenPrefix?: string;
        siteConfig?: {
          name?: string;
          tagline?: string;
          description?: string;
          logoUrl?: string;
          faviconUrl?: string;
          primaryColor?: string;
          url?: string;
          language?: string;
          timezone?: string;
          social?: Record<string, string>;
        };
      };
    } catch (e: any) {
      if (attempts >= 3 || /invalid|expired|used/i.test(e.message)) throw e;
      logWarn(`Exchange attempt ${attempts} failed: ${e.message}. Retrying...`);
      await new Promise((r) => setTimeout(r, 800 * attempts));
    }
  }
  throw new Error("Exchange failed after retries");
}

function findTemplateDir(): string | null {
  // When installed from repo: templates/ is at repo root
  // When installed via npm: templates/ is bundled inside the package (see "files" in package.json)
  const candidates = [
    path.resolve(__dirname, "../templates/nextjs-blog"),          // npm install: dist/ -> openpost-cli/templates/
    path.resolve(__dirname, "../../templates/nextjs-blog"),       // repo root:   cli/dist/ -> templates/
    path.resolve(process.cwd(), "templates/nextjs-blog"),        // CWD
    path.resolve(process.cwd(), "../templates/nextjs-blog"),     // parent of CWD
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
      if (fs.existsSync(path.join(c, "package.json"))) return c;
    }
  }
  return null;
}

async function runInit(args: Record<string, any>) {
  console.log(chalk.bold("\n======================================================="));
  console.log(chalk.bold("  OpenPost CLI — Full-Stack Blog Starter Generator"));
  console.log(chalk.bold(`  v${VERSION}`));
  console.log(chalk.bold("=======================================================\n"));

  checkNode();

  const isNonInteractive = Boolean(args.yes);
  let cmsUrl = args.cmsUrl as string | undefined;
  let code = args.code as string | undefined;
  let projectDirArg = args.project as string | undefined;

  // If command was `init my-blog` the first free arg is project name
  const positionalProject = typeof args.command === "string" && !["init","login","logout","doctor","help","version"].includes(args.command) ? args.command as string : undefined;
  // Also check raw argv for second positional
  const raw = process.argv.slice(2);
  if (!projectDirArg && positionalProject) projectDirArg = positionalProject;
  if (!projectDirArg) {
    // check if init <dir> style: e.g. npx openpost-cli init my-blog
    const initIdx = raw.indexOf("init");
    if (initIdx !== -1 && raw[initIdx+1] && !raw[initIdx+1].startsWith("-")) projectDirArg = raw[initIdx+1];
  }

  if (!cmsUrl) {
    if (isNonInteractive) cmsUrl = "http://localhost:3000";
    else {
      const ans = await prompts({
        type: "text",
        name: "cmsUrl",
        message: "Enter your OpenPost CMS URL:",
        initial: "http://localhost:3000",
        validate: (v: string) => { try { new URL(v); return true; } catch { return "Please enter a valid URL (e.g. http://localhost:3000)"; } },
      });
      cmsUrl = ans.cmsUrl;
    }
  }
  if (!cmsUrl) { console.log("Setup aborted."); process.exit(1); }
  const cleanCmsUrl = cmsUrl.replace(/\/$/, "");

  // Health check (fail fast like sanity)
  try {
    await healthCheck(cleanCmsUrl, Boolean(args.skipHealth));
  } catch {
    if (!args.skipHealth) {
      const { retry } = await prompts({ type: "confirm", name: "retry", message: "Health check failed. Continue anyway?", initial: false });
      if (!retry) process.exit(1);
    }
  }

  const connectUrl = `${cleanCmsUrl}/cli/connect`;
  console.log(`\n${chalk.bold("Authorize this CLI:")}`);
  console.log(`  1. Open ${chalk.cyan(connectUrl)} in your browser`);
  console.log(`  2. Log in as a project ${chalk.bold("OWNER or ADMIN")}`);
  console.log(`  3. Copy the ${chalk.bold("OP-XXXX-YYYY-ZZZZ")} code`);
  console.log(chalk.dim("  (Code expires in 10 minutes, single-use)\n"));

  try { await open(connectUrl); logSuccess("Opened browser for authorization"); } catch { console.log(`Please open manually: ${connectUrl}`); }

  if (!code) {
    const ans = await prompts({
      type: "text",
      name: "code",
      message: "Paste the authorization code from your browser (e.g. OP-XXXX-YYYY-ZZZZ):",
      validate: (v: string) => (v && v.trim().length >= 6 ? true : "Please enter the authorization code."),
    });
    code = ans.code;
  }
  if (!code) { console.log("Setup aborted."); process.exit(1); }

  let exchange: { token: string; projectId: string; projectName?: string; projectSlug?: string; siteConfig?: any } | null = null;
  try {
    exchange = await exchangeCode(cleanCmsUrl, code);
  } catch (e: any) {
    logError(`Code exchange failed: ${e.message}`);
    console.log(chalk.dim("  Generate a new code at /cli/connect and try again. Codes are single-use and expire in 10 min."));
    process.exit(1);
  }
  const { token, projectId, projectName: cmsProjectName, projectSlug, siteConfig } = exchange!;
  logSuccess(`Authorized for project: ${chalk.bold(cmsProjectName || projectSlug || projectId)} (${projectId.slice(0,8)}…)`);

  // Project directory
  let projectName = projectDirArg;
  if (!projectName) {
    const ans = await prompts({
      type: "text",
      name: "projectName",
      message: "Enter the directory name for your new Next.js blog:",
      initial: "my-openpost-blog",
      validate: (v: string) => {
        if (!v || !v.trim()) return "Name required";
        if (/[^a-z0-9-_]/i.test(v) && v.includes("/")) return "Avoid path separators";
        return true;
      },
    });
    projectName = ans.projectName;
  }
  if (!projectName) { console.log("Setup aborted."); process.exit(1); }
  projectName = projectName.trim();
  // Validate slug-like but allow any dir name
  if (!/^[a-z0-9._-]+$/i.test(projectName)) {
    logWarn(`Project name "${projectName}" contains unusual characters. Using as-is.`);
  }
  const dest = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(dest)) {
    logError(`Directory "${projectName}" already exists at ${dest}. Choose a different name or remove it.`);
    process.exit(1);
  }

  const templateDir = findTemplateDir();
  if (!templateDir) {
    logError("Could not locate templates/nextjs-blog directory.");
    console.log(chalk.dim("  Expected at: <cli>/../templates/nextjs-blog or ./templates/nextjs-blog"));
    console.log(chalk.dim("  If installed via npm, ensure you use the full OpenPost repo or publish template with the CLI."));
    process.exit(1);
  }
  logStep(`Scaffolding Next.js production blog in: ${dest} ...`);
  console.log(chalk.dim(`  Template: ${templateDir}`));
  fs.mkdirSync(dest, { recursive: true });
  copyRecursiveSync(templateDir, dest);

  // Write .env.local (and .env.example reference)
  const siteName = siteConfig?.name || cmsProjectName || "My Blog";
  const siteTagline = siteConfig?.tagline || "";
  const siteDescription = siteConfig?.description || "";
  const siteLogoUrl = siteConfig?.logoUrl || "";
  const sitePrimaryColor = siteConfig?.primaryColor || "#FEA611";
  const siteUrl = siteConfig?.url || "http://localhost:3001";
  const siteLanguage = siteConfig?.language || "en";
  const siteTimezone = siteConfig?.timezone || "UTC";
  const socialTwitter = siteConfig?.social?.twitter || "";
  const socialGithub = siteConfig?.social?.github || "";
  const socialLinkedin = siteConfig?.social?.linkedin || "";

  const envContent = `# OpenPost CMS — generated by ${NAME} v${VERSION} on ${new Date().toISOString()}
# See https://github.com/OfficialOpenPost/OpenPost#quickstart
OPENPOST_URL=${cleanCmsUrl}
OPENPOST_PROJECT_ID=${projectId}
OPENPOST_TOKEN=${token}
SITE_URL=${siteUrl}

# Public env vars (client-side components)
NEXT_PUBLIC_OPENPOST_URL=${cleanCmsUrl}
NEXT_PUBLIC_SITE_NAME=${siteName}
NEXT_PUBLIC_SITE_TAGLINE=${siteTagline}
NEXT_PUBLIC_SITE_DESCRIPTION=${siteDescription}
NEXT_PUBLIC_SITE_LOGO_URL=${siteLogoUrl}
NEXT_PUBLIC_SITE_PRIMARY_COLOR=${sitePrimaryColor}

# Site config (server-side)
SITE_NAME=${siteName}
SITE_TAGLINE=${siteTagline}
SITE_DESCRIPTION=${siteDescription}
SITE_LOGO_URL=${siteLogoUrl}
SITE_PRIMARY_COLOR=${sitePrimaryColor}
SITE_LANGUAGE=${siteLanguage}
SITE_TIMEZONE=${siteTimezone}
SOCIAL_TWITTER=${socialTwitter}
SOCIAL_GITHUB=${socialGithub}
SOCIAL_LINKEDIN=${socialLinkedin}
`;
  fs.writeFileSync(path.join(dest, ".env.local"), envContent, "utf-8");
  logSuccess(`Wrote ${path.join(projectName, ".env.local")}`);

  // Also write .env.example if missing
  const envExamplePath = path.join(dest, ".env.example");
  if (!fs.existsSync(envExamplePath)) fs.writeFileSync(envExamplePath, envContent, "utf-8");

  // Customize package.json name + add openpost metadata
  const pkgPath = path.join(dest, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const j = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      j.name = projectName;
      j.openpost = { cmsUrl: cleanCmsUrl, projectId, projectSlug: projectSlug || null };
      fs.writeFileSync(pkgPath, JSON.stringify(j, null, 2), "utf-8");
    } catch {}
  }

  // Customize layout.tsx with site config
  const layoutPath = path.join(dest, "app", "layout.tsx");
  if (fs.existsSync(layoutPath)) {
    try {
      let layout = fs.readFileSync(layoutPath, "utf-8");
      layout = layout
        .replace(/"OpenPost Blog — High Performance Headless Publication"/g, `"${siteName}"`)
        .replace(/"A fast, modern blog powered by OpenPost CMS[^"]*"/g, `"${siteDescription || siteTagline || siteName}"`)
        .replace(/%s — OpenPost Blog/g, `%s — ${siteName}`);
      fs.writeFileSync(layoutPath, layout, "utf-8");
    } catch {}
  }

  // Customize Header.tsx with site name and logo
  const headerPath = path.join(dest, "components", "Header.tsx");
  if (fs.existsSync(headerPath)) {
    try {
      let header = fs.readFileSync(headerPath, "utf-8");
      header = header.replace(/OpenPost Blog/g, siteName);
      if (siteLogoUrl) {
        header = header.replace(
          /<div className="flex h-9 w-9[^"]*"[^>]*>[\s\S]*?<\/div>\s*<span/g,
          `<img src="${siteLogoUrl}" alt="${siteName}" className="h-9 w-auto rounded-lg" />\n          <span`
        );
      }
      fs.writeFileSync(headerPath, header, "utf-8");
    } catch {}
  }

  // Customize Footer.tsx with site name
  const footerPath = path.join(dest, "components", "Footer.tsx");
  if (fs.existsSync(footerPath)) {
    try {
      let footer = fs.readFileSync(footerPath, "utf-8");
      footer = footer.replace(/OpenPost Publication/g, siteName);
      if (socialGithub) {
        footer = footer.replace(
          /href="https:\/\/github\.com\/OfficialOpenPost\/OpenPost"/g,
          `href="${socialGithub}"`
        );
      }
      fs.writeFileSync(footerPath, footer, "utf-8");
    } catch {}
  }

  // Customize page.tsx hero section with site name/tagline
  const homePath = path.join(dest, "app", "page.tsx");
  if (fs.existsSync(homePath)) {
    try {
      let home = fs.readFileSync(homePath, "utf-8");
      home = home
        .replace(/Ideas, insights, and stories engineered for performance\./g, siteTagline || siteDescription || siteName)
        .replace(/Welcome to our blog powered by OpenPost[^"]*/g, siteDescription || `${siteName} — powered by OpenPost`);
      fs.writeFileSync(homePath, home, "utf-8");
    } catch {}
  }

  // Git init hint (like sanity)
  let didGitInit = false;
  try {
    if (!fs.existsSync(path.join(dest, ".git"))) {
      execSync("git --version", { stdio: "ignore" });
      execSync("git init", { cwd: dest, stdio: "ignore" });
      didGitInit = true;
    }
  } catch {}

  console.log(chalk.green("\n======================================================="));
  console.log(chalk.green(`  🎉 Successfully created ${projectName}!`));
  console.log(chalk.green("=======================================================\n"));
  console.log(chalk.bold("Next steps:\n"));
  console.log(`  ${chalk.dim("1.")} ${chalk.cyan(`cd ${projectName}`)}`);
  console.log(`  ${chalk.dim("2.")} ${chalk.cyan("npm install")} ${chalk.dim("(or pnpm/yarn)")}`);
  console.log(`  ${chalk.dim("3.")} ${chalk.cyan("npm run dev -p 3001")}  ${chalk.dim("# blog at http://localhost:3001")}`);
  console.log("");
  if (didGitInit) console.log(chalk.dim("  • Initialized git repository"));
  console.log(chalk.dim("  • CMS:     ") + chalk.cyan(cleanCmsUrl));
  console.log(chalk.dim("  • Project: ") + chalk.cyan(projectSlug || cmsProjectName || projectId));
  console.log(chalk.dim("  • Token:   ") + chalk.cyan(`op_live_${token.slice(8,12)}… (saved to .env.local, keep secret)`));
  console.log("");
  console.log(chalk.dim("  Docs: https://github.com/OfficialOpenPost/OpenPost/blob/main/README.md#cli-starter-generator"));
  console.log(chalk.dim("  Need a new token? Re-run: ") + chalk.cyan(`npx ${NAME} --cms-url ${cleanCmsUrl}`));
  console.log("");
}

async function runDoctor(args: Record<string, any>) {
  const cmsUrl = (args.cmsUrl as string) || "http://localhost:3000";
  console.log(chalk.bold("\nOpenPost Doctor — CMS connectivity check\n"));
  await healthCheck(cmsUrl.replace(/\/$/, ""), Boolean(args.skipHealth)).then(() => logSuccess("Doctor: CMS is reachable")).catch(() => process.exit(1));
  // Check template
  const tpl = findTemplateDir();
  if (tpl) logSuccess(`Template found: ${tpl}`);
  else logWarn("Template not found (expected for npm-published CLI without repo)");
  console.log("");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) { printHelp(); process.exit(0); }
  if (args.version) { console.log(`${NAME} v${VERSION}`); process.exit(0); }

  const cmd = (args.command as string) || "init";
  if (["help", "--help", "-h"].includes(cmd)) { printHelp(); process.exit(0); }
  if (["version", "--version", "-v"].includes(cmd)) { console.log(`${NAME} v${VERSION}`); process.exit(0); }

  if (cmd === "doctor") return runDoctor(args);
  if (cmd === "init" || cmd === "create" || !["login","logout","doctor"].includes(cmd)) {
    // login is alias to init (code exchange)
    return runInit(args);
  }
  if (cmd === "login") return runInit(args);
  if (cmd === "logout") {
    console.log(chalk.dim("No persistent token stored by CLI (token is in your project's .env.local). To logout, delete .env.local or revoke token in CMS → Settings → API Keys."));
    return;
  }

  printHelp();
  process.exit(1);
}

main().catch((err) => {
  logError(`Unexpected error: ${err.message || String(err)}`);
  if (process.env.DEBUG) console.error(err);
  process.exit(1);
});
