#!/usr/bin/env node
import prompts from "prompts";
import open from "open";
import fs from "fs";
import path from "path";
import { execSync, spawn } from "child_process";

// --- helpers ---
const pkg = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")); } catch { return { version: "0.2.5", name: "openpost-cli" }; }
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
    gray: (s: string) => s,
    white: (s: string) => s,
    magenta: (s: string) => s,
  };
}

function logStep(msg: string) { console.log(chalk.cyan("→"), msg); }
function logSuccess(msg: string) { console.log(chalk.green("✓"), msg); }
function logError(msg: string) { console.error(chalk.red("✗"), msg); }
function logWarn(msg: string) { console.warn(chalk.yellow("!"), msg); }

// ─── .env file utilities ─────────────────────────────────────────────────────

function readEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

function writeEnvFile(filePath: string, vars: Record<string, string>, header?: string) {
  const lines: string[] = [];
  if (header) lines.push(`# ${header}`);
  for (const [key, value] of Object.entries(vars)) {
    lines.push(`${key}=${value}`);
  }
  // Atomic write: write to temp file then rename
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, lines.join("\n") + "\n", "utf-8");
  fs.renameSync(tmpPath, filePath);
}

function updateEnvFile(filePath: string, updates: Record<string, string>) {
  const existing = readEnvFile(filePath);
  const merged = { ...existing, ...updates };
  // Preserve comments and ordering from original file
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, "utf-8").split("\n");
    const usedKeys = new Set<string>();
    const output: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        output.push(line);
        continue;
      }
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) { output.push(line); continue; }
      const key = trimmed.slice(0, eqIdx).trim();
      if (key in updates) {
        output.push(`${key}=${updates[key]}`);
        usedKeys.add(key);
      } else {
        output.push(line);
        usedKeys.add(key);
      }
    }
    // Append any new keys not in original
    for (const [key, value] of Object.entries(updates)) {
      if (!usedKeys.has(key)) output.push(`${key}=${value}`);
    }
    const tmpPath = filePath + ".tmp";
    fs.writeFileSync(tmpPath, output.join("\n") + "\n", "utf-8");
    fs.renameSync(tmpPath, filePath);
  } else {
    writeEnvFile(filePath, merged);
  }
}

// ─── project root detection ──────────────────────────────────────────────────

function findProjectRoot(startDir?: string): string | null {
  let dir = startDir || process.cwd();
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, ".env.local"))) return dir;
    if (fs.existsSync(path.join(dir, "package.json"))) {
      // Check if this is an OpenPost project (has openpost metadata or NEXT_PUBLIC_OPENPOST_URL in .env*)
      const envLocal = path.join(dir, ".env.local");
      const envProduction = path.join(dir, ".env.production");
      if (fs.existsSync(envLocal) || fs.existsSync(envProduction)) return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// ─── connection validation ───────────────────────────────────────────────────

async function validateConnection(cmsUrl: string): Promise<{ ok: boolean; checks?: Record<string, string>; error?: string }> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${cmsUrl}/api/health`, {
      signal: controller.signal,
      headers: { "User-Agent": `${NAME}/${VERSION}` },
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const json = await res.json().catch(() => ({}));
    return { ok: json.status === "ok", checks: json.checks, error: json.status !== "ok" ? "Degraded" : undefined };
  } catch (e: any) {
    return { ok: false, error: e.message || "Connection failed" };
  }
}

// ─── argument parsing ────────────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--version" || a === "-v") args.version = true;
    else if (a === "--yes" || a === "-y") args.yes = true;
    else if (a === "--skip-health") args.skipHealth = true;
    else if (a === "--template-only") args.templateOnly = true;
    else if (a.startsWith("--cms-url=")) args.cmsUrl = a.split("=")[1];
    else if (a.startsWith("--code=")) args.code = a.split("=")[1];
    else if (a.startsWith("--project=")) args.project = a.split("=")[1];
    else if (a.startsWith("--port=")) args.port = a.split("=")[1];
    else if (a === "--cms-url" && argv[i + 1]) args.cmsUrl = argv[++i];
    else if (a === "--code" && argv[i + 1]) args.code = argv[++i];
    else if (a === "--project" && argv[i + 1]) args.project = argv[++i];
    else if (a === "--port" && argv[i + 1]) args.port = argv[++i];
    else if (!a.startsWith("-") && !args.command) args.command = a;
  }
  return args;
}

// ─── help ────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
${chalk.bold("OpenPost CLI")} — Headless CMS connector & blog starter

${chalk.bold("Usage:")}
  npx ${NAME} [command] [options]

${chalk.bold("Commands:")}
  init [dir]          Scaffold a new Next.js blog (default)
  login               Authenticate with CMS (opens browser)
  logout              Clear saved token (local)
  doctor              Run CMS health checks
  dev                 Start local development server
  build               Build production bundle
  start               Start production server
  status              Show project health & config
  upgrade             Update project template & dependencies
  reconnect           Connect to a different CMS instance
  help                Show this help
  version             Show version

${chalk.bold("Options:")}
  --cms-url <url>     CMS URL (e.g. https://cms.example.com)
  --code <OP-XXXX>    Authorization code (skip prompt)
  --project <name>    Project directory name (skip prompt)
  --port <number>     Port for dev/start (default: 3000)
  --template-only     Upgrade: skip npm install
  --skip-health       Skip CMS health check (not recommended)
  --yes, -y           Non-interactive defaults
  --help, -h          Show help
  --version, -v       Show version

${chalk.bold("Examples:")}
  npx ${NAME} init my-blog
  npx ${NAME} dev
  npx ${NAME} build
  npx ${NAME} start --port 8080
  npx ${NAME} status
  npx ${NAME} upgrade
  npx ${NAME} reconnect

Docs: https://github.com/OfficialOpenPost/OpenPost
`);
}

// ─── shared utilities ────────────────────────────────────────────────────────

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
      if (["node_modules", ".next", ".git", "dist"].includes(child)) continue;
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

function copyTemplateForUpgrade(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && (stats as any).isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      // Skip heavy dirs and user data during upgrade
      if (["node_modules", ".next", ".git", "dist", ".env.local", ".env.production", ".env.development"].includes(child)) continue;
      copyTemplateForUpgrade(path.join(src, child), path.join(dest, child));
    }
  } else if (exists) {
    // Never overwrite .env files during upgrade
    const basename = path.basename(dest);
    if (basename === ".env.local" || basename === ".env.production" || basename === ".env.development") return;
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
  const candidates = [
    path.resolve(__dirname, "../templates/nextjs-blog"),
    path.resolve(__dirname, "../../templates/nextjs-blog"),
    path.resolve(process.cwd(), "templates/nextjs-blog"),
    path.resolve(process.cwd(), "../templates/nextjs-blog"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
      if (fs.existsSync(path.join(c, "package.json"))) return c;
    }
  }
  return null;
}

// ─── runInit (unchanged) ─────────────────────────────────────────────────────

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

  const positionalProject = typeof args.command === "string" && !["init","login","logout","doctor","help","version","dev","build","start","status","upgrade","reconnect"].includes(args.command) ? args.command as string : undefined;
  const raw = process.argv.slice(2);
  if (!projectDirArg && positionalProject) projectDirArg = positionalProject;
  if (!projectDirArg) {
    const initIdx = raw.indexOf("init");
    if (initIdx !== -1 && raw[initIdx + 1] && !raw[initIdx + 1].startsWith("-")) projectDirArg = raw[initIdx + 1];
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
  logSuccess(`Authorized for project: ${chalk.bold(cmsProjectName || projectSlug || projectId)} (${projectId.slice(0, 8)}…)`);

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

  const envExamplePath = path.join(dest, ".env.example");
  if (!fs.existsSync(envExamplePath)) fs.writeFileSync(envExamplePath, envContent, "utf-8");

  const pkgPath = path.join(dest, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const j = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      j.name = projectName;
      j.openpost = { cmsUrl: cleanCmsUrl, projectId, projectSlug: projectSlug || null };
      fs.writeFileSync(pkgPath, JSON.stringify(j, null, 2), "utf-8");
    } catch {}
  }

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
  console.log(chalk.dim("  • Token:   ") + chalk.cyan(`op_live_${token.slice(8, 12)}… (saved to .env.local, keep secret)`));
  console.log("");
  console.log(chalk.dim("  Docs: https://github.com/OfficialOpenPost/OpenPost/blob/main/README.md#cli-starter-generator"));
  console.log(chalk.dim("  Need a new token? Re-run: ") + chalk.cyan(`npx ${NAME} --cms-url ${cleanCmsUrl}`));
  console.log("");
}

// ─── runDoctor (unchanged) ───────────────────────────────────────────────────

async function runDoctor(args: Record<string, any>) {
  const cmsUrl = (args.cmsUrl as string) || "http://localhost:3000";
  console.log(chalk.bold("\nOpenPost Doctor — CMS connectivity check\n"));
  await healthCheck(cmsUrl.replace(/\/$/, ""), Boolean(args.skipHealth)).then(() => logSuccess("Doctor: CMS is reachable")).catch(() => process.exit(1));
  const tpl = findTemplateDir();
  if (tpl) logSuccess(`Template found: ${tpl}`);
  else logWarn("Template not found (expected for npm-published CLI without repo)");
  console.log("");
}

// ─── runDev ──────────────────────────────────────────────────────────────────

async function runDev(args: Record<string, any>) {
  console.log(chalk.bold("\nOpenPost Dev — Local Development Server\n"));
  checkNode();

  const root = findProjectRoot();
  if (!root) {
    logError("No OpenPost project found. Run this command from your blog directory, or run `npx openpost-cli init` to create one.");
    process.exit(1);
  }

  const envPath = path.join(root, ".env.local");
  const env = readEnvFile(envPath);
  const cmsUrl = env.OPENPOST_URL;
  const projectId = env.OPENPOST_PROJECT_ID;

  if (!cmsUrl) {
    logError("OPENPOST_URL not found in .env.local. Run `npx openpost-cli reconnect` to reconfigure.");
    process.exit(1);
  }

  logStep(`Project: ${root}`);
  logStep(`CMS: ${chalk.cyan(cmsUrl)}`);
  if (projectId) logStep(`Project ID: ${chalk.dim(projectId.slice(0, 8) + "…")}`);

  // Validate connection
  const result = await validateConnection(cmsUrl);
  if (result.ok) {
    logSuccess("CMS connection verified");
  } else {
    logWarn(`CMS connection issue: ${result.error}`);
    console.log(chalk.dim("  Starting dev server anyway — check CMS availability.\n"));
  }

  const port = (args.port as string) || "3000";
  logStep(`Starting Next.js dev server on port ${port}...\n`);

  const child = spawn("npm", ["run", "dev", "--", "-p", port], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });

  // Handle graceful shutdown
  const cleanup = () => {
    if (!child.killed) {
      child.kill("SIGTERM");
      setTimeout(() => { if (!child.killed) child.kill("SIGKILL"); }, 5000);
    }
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  child.on("close", (code) => {
    process.removeListener("SIGINT", cleanup);
    process.removeListener("SIGTERM", cleanup);
    if (code !== 0 && code !== null) {
      logError(`Dev server exited with code ${code}`);
      process.exit(code);
    }
  });

  child.on("error", (err) => {
    logError(`Failed to start dev server: ${err.message}`);
    process.exit(1);
  });
}

// ─── runBuild ────────────────────────────────────────────────────────────────

async function runBuild(args: Record<string, any>) {
  console.log(chalk.bold("\nOpenPost Build — Production Bundle\n"));
  checkNode();

  const root = findProjectRoot();
  if (!root) {
    logError("No OpenPost project found. Run this command from your blog directory.");
    process.exit(1);
  }

  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    logError(".env.local not found. Run `npx openpost-cli init` or `npx openpost-cli reconnect` first.");
    process.exit(1);
  }

  const env = readEnvFile(envPath);
  if (!env.OPENPOST_URL) {
    logError("OPENPOST_URL not found in .env.local.");
    process.exit(1);
  }

  logStep(`Project: ${root}`);
  logStep(`CMS: ${chalk.cyan(env.OPENPOST_URL)}`);

  // Check if node_modules exists
  if (!fs.existsSync(path.join(root, "node_modules"))) {
    logWarn("node_modules not found. Running npm install first...");
    logStep("npm install ...");
    try {
      execSync("npm install", { cwd: root, stdio: "inherit" });
      logSuccess("Dependencies installed");
    } catch (e: any) {
      logError("npm install failed. Run `npm install` manually and try again.");
      process.exit(1);
    }
  }

  const startTime = Date.now();
  logStep("Building production bundle...\n");

  try {
    execSync("npm run build", { cwd: root, stdio: "inherit" });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("");
    logSuccess(`Build completed in ${elapsed}s`);
    logStep(`Output: ${chalk.dim(path.join(root, ".next"))}`);
    logStep(`Run ${chalk.cyan("npx openpost-cli start")} to serve the production build`);
    console.log("");
  } catch (e: any) {
    logError("Build failed. Check the output above for errors.");
    process.exit(1);
  }
}

// ─── runStart ────────────────────────────────────────────────────────────────

async function runStart(args: Record<string, any>) {
  console.log(chalk.bold("\nOpenPost Start — Production Server\n"));
  checkNode();

  const root = findProjectRoot();
  if (!root) {
    logError("No OpenPost project found. Run this command from your blog directory.");
    process.exit(1);
  }

  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    logError(".env.local not found. Run `npx openpost-cli init` or `npx openpost-cli reconnect` first.");
    process.exit(1);
  }

  const env = readEnvFile(envPath);
  if (!env.OPENPOST_URL) {
    logError("OPENPOST_URL not found in .env.local.");
    process.exit(1);
  }

  // Check if build exists
  if (!fs.existsSync(path.join(root, ".next"))) {
    logWarn("No .next build found. Running build first...");
    logStep("npm run build ...");
    try {
      execSync("npm run build", { cwd: root, stdio: "inherit" });
      logSuccess("Build completed");
    } catch (e: any) {
      logError("Build failed. Run `npx openpost-cli build` manually and try again.");
      process.exit(1);
    }
  }

  const port = (args.port as string) || "3000";
  logStep(`Project: ${root}`);
  logStep(`CMS: ${chalk.cyan(env.OPENPOST_URL)}`);
  logStep(`Starting production server on port ${port}...\n`);

  const child = spawn("npm", ["run", "start", "--", "-p", port], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PORT: port },
  });

  const cleanup = () => {
    if (!child.killed) {
      child.kill("SIGTERM");
      setTimeout(() => { if (!child.killed) child.kill("SIGKILL"); }, 5000);
    }
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  child.on("close", (code) => {
    process.removeListener("SIGINT", cleanup);
    process.removeListener("SIGTERM", cleanup);
    if (code !== 0 && code !== null) {
      logError(`Server exited with code ${code}`);
      process.exit(code);
    }
  });

  child.on("error", (err) => {
    logError(`Failed to start server: ${err.message}`);
    process.exit(1);
  });
}

// ─── runStatus ───────────────────────────────────────────────────────────────

async function runStatus(args: Record<string, any>) {
  console.log(chalk.bold("\nOpenPost Status — Project Health\n"));

  const root = findProjectRoot();
  if (!root) {
    logError("No OpenPost project found. Run this command from your blog directory.");
    process.exit(1);
  }

  const envPath = path.join(root, ".env.local");
  const env = readEnvFile(envPath);

  // Project info
  console.log(chalk.bold("  Project"));
  console.log(`  ${chalk.dim("Root:")}       ${root}`);
  if (env.OPENPOST_URL) console.log(`  ${chalk.dim("CMS URL:")}    ${chalk.cyan(env.OPENPOST_URL)}`);
  if (env.OPENPOST_PROJECT_ID) console.log(`  ${chalk.dim("Project ID:")} ${chalk.dim(env.OPENPOST_PROJECT_ID.slice(0, 8) + "…")}`);
  if (env.OPENPOST_TOKEN) console.log(`  ${chalk.dim("Token:")}      ${chalk.dim(`op_live_${env.OPENPOST_TOKEN.slice(8, 12)}…`)}`);
  console.log("");

  // Environment
  console.log(chalk.bold("  Environment"));
  console.log(`  ${chalk.dim("Node.js:")}   ${process.version}`);
  console.log(`  ${chalk.dim("npm:")}       ${(() => { try { return execSync("npm --version", { encoding: "utf-8" }).trim(); } catch { return "unknown"; } })()}`);
  console.log(`  ${chalk.dim("CLI:")}       v${VERSION}`);
  console.log("");

  // Dependencies
  const nodeModulesExists = fs.existsSync(path.join(root, "node_modules"));
  const buildExists = fs.existsSync(path.join(root, ".next"));

  console.log(chalk.bold("  Build Status"));
  console.log(`  ${chalk.dim("node_modules:")} ${nodeModulesExists ? chalk.green("installed") : chalk.red("missing — run npm install")}`);
  console.log(`  ${chalk.dim(".next build:")}  ${buildExists ? chalk.green("exists") : chalk.yellow("missing — run npx openpost-cli build")}`);
  console.log("");

  // CMS Connection
  if (env.OPENPOST_URL) {
    console.log(chalk.bold("  CMS Connection"));
    const result = await validateConnection(env.OPENPOST_URL);
    if (result.ok) {
      console.log(`  ${chalk.dim("Status:")}     ${chalk.green("connected")}`);
      if (result.checks) {
        for (const [key, value] of Object.entries(result.checks)) {
          const color = value === "Connected" || value === "Valid" || value === "Operational" ? chalk.green : chalk.yellow;
          console.log(`  ${chalk.dim(`${key}:`)}        ${color(value)}`);
        }
      }
    } else {
      console.log(`  ${chalk.dim("Status:")}     ${chalk.red("disconnected")} — ${result.error}`);
    }
    console.log("");
  }

  // Quick actions
  console.log(chalk.bold("  Quick Actions"));
  console.log(`  ${chalk.cyan("npx openpost-cli dev")}          Start development server`);
  console.log(`  ${chalk.cyan("npx openpost-cli build")}        Build for production`);
  console.log(`  ${chalk.cyan("npx openpost-cli start")}        Start production server`);
  console.log(`  ${chalk.cyan("npx openpost-cli upgrade")}      Update template & deps`);
  console.log(`  ${chalk.cyan("npx openpost-cli reconnect")}    Connect to different CMS`);
  console.log("");
}

// ─── runUpgrade ──────────────────────────────────────────────────────────────

async function runUpgrade(args: Record<string, any>) {
  console.log(chalk.bold("\nOpenPost Upgrade — Update Project Template\n"));
  checkNode();

  const root = findProjectRoot();
  if (!root) {
    logError("No OpenPost project found. Run this command from your blog directory.");
    process.exit(1);
  }

  const templateDir = findTemplateDir();
  if (!templateDir) {
    logError("Could not locate templates/nextjs-blog directory. If installed via npm, update the CLI first: npm install -g openpost-cli");
    process.exit(1);
  }

  const envPath = path.join(root, ".env.local");
  const env = readEnvFile(envPath);

  logStep(`Project: ${root}`);
  logStep(`Template: ${templateDir}`);

  // Check for changes
  logStep("Comparing template files...");

  // Copy template files (preserving .env.local, node_modules, .next, .git)
  logStep("Updating template files...");
  copyTemplateForUpgrade(templateDir, root);
  logSuccess("Template files updated");

  // Update package.json name and openpost metadata if they exist
  const pkgPath = path.join(root, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const projectPkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const templatePkg = JSON.parse(fs.readFileSync(path.join(templateDir, "package.json"), "utf-8"));

      // Check for dependency changes
      const allDeps = { ...templatePkg.dependencies, ...templatePkg.devDependencies };
      const projectDeps = { ...projectPkg.dependencies, ...projectPkg.devDependencies };
      const changes: string[] = [];

      for (const [dep, version] of Object.entries(allDeps)) {
        const current = projectDeps[dep];
        if (!current) {
          changes.push(`  ${chalk.green("+")} ${dep}@${version} (new)`);
        } else if (current !== version) {
          changes.push(`  ${chalk.yellow("~")} ${dep}: ${current} → ${version}`);
        }
      }

      if (changes.length > 0) {
        console.log(`\n${chalk.bold("  Dependency changes:")}`);
        console.log(changes.join("\n"));
      } else {
        logSuccess("Dependencies are up to date");
      }
    } catch {}
  }

  // Install dependencies unless --template-only
  if (!args.templateOnly) {
    logStep("Installing updated dependencies...");
    try {
      execSync("npm install", { cwd: root, stdio: "inherit" });
      logSuccess("Dependencies installed");
    } catch (e: any) {
      logWarn("npm install had issues. You may need to run it manually.");
    }
  } else {
    logStep("Skipping npm install (--template-only)");
  }

  console.log(chalk.green("\n======================================================="));
  console.log(chalk.green("  ✨ Upgrade complete!"));
  console.log(chalk.green("=======================================================\n"));
  logStep("Run `npx openpost-cli status` to verify everything is working");
  logStep("Run `npx openpost-cli dev` to start developing");
  console.log("");
}

// ─── runReconnect ────────────────────────────────────────────────────────────

async function runReconnect(args: Record<string, any>) {
  console.log(chalk.bold("\nOpenPost Reconnect — Connect to a Different CMS\n"));
  checkNode();

  const root = findProjectRoot();
  if (!root) {
    // No project found — run init instead
    logWarn("No existing project found. Running init to create a new project...");
    return runInit(args);
  }

  const envPath = path.join(root, ".env.local");
  const env = readEnvFile(envPath);
  const currentCmsUrl = env.OPENPOST_URL;

  if (currentCmsUrl) {
    logStep(`Current CMS: ${chalk.cyan(currentCmsUrl)}`);
  }

  let cmsUrl = args.cmsUrl as string | undefined;
  if (!cmsUrl) {
    const ans = await prompts({
      type: "text",
      name: "cmsUrl",
      message: "Enter the new OpenPost CMS URL:",
      initial: currentCmsUrl || "http://localhost:3000",
      validate: (v: string) => { try { new URL(v); return true; } catch { return "Please enter a valid URL"; } },
    });
    cmsUrl = ans.cmsUrl;
  }
  if (!cmsUrl) { console.log("Reconnect aborted."); process.exit(1); }
  const cleanCmsUrl = cmsUrl.replace(/\/$/, "");

  if (cleanCmsUrl === currentCmsUrl) {
    logWarn("Same CMS URL as current. No changes needed.");
    return;
  }

  // Health check
  try {
    await healthCheck(cleanCmsUrl, Boolean(args.skipHealth));
  } catch {
    if (!args.skipHealth) {
      const { retry } = await prompts({ type: "confirm", name: "retry", message: "Health check failed. Continue anyway?", initial: false });
      if (!retry) process.exit(1);
    }
  }

  // Open browser for code
  const connectUrl = `${cleanCmsUrl}/cli/connect`;
  console.log(`\n${chalk.bold("Authorize this CLI:")}`);
  console.log(`  1. Open ${chalk.cyan(connectUrl)} in your browser`);
  console.log(`  2. Log in and copy the authorization code`);
  console.log(chalk.dim("  (Code expires in 10 minutes, single-use)\n"));

  try { await open(connectUrl); logSuccess("Opened browser for authorization"); } catch { console.log(`Please open manually: ${connectUrl}`); }

  let code = args.code as string | undefined;
  if (!code) {
    const ans = await prompts({
      type: "text",
      name: "code",
      message: "Paste the authorization code:",
      validate: (v: string) => (v && v.trim().length >= 6 ? true : "Please enter the authorization code."),
    });
    code = ans.code;
  }
  if (!code) { console.log("Reconnect aborted."); process.exit(1); }

  let exchange;
  try {
    exchange = await exchangeCode(cleanCmsUrl, code);
  } catch (e: any) {
    logError(`Code exchange failed: ${e.message}`);
    process.exit(1);
  }

  const { token, projectId, projectName: cmsProjectName, projectSlug } = exchange!;
  logSuccess(`Authorized for project: ${chalk.bold(cmsProjectName || projectSlug || projectId)}`);

  // Update .env.local — preserve all other vars
  const updates: Record<string, string> = {
    OPENPOST_URL: cleanCmsUrl,
    OPENPOST_PROJECT_ID: projectId,
    OPENPOST_TOKEN: token,
    NEXT_PUBLIC_OPENPOST_URL: cleanCmsUrl,
  };

  // Update site config from new CMS if available
  if (exchange!.siteConfig) {
    const sc = exchange!.siteConfig;
    if (sc.name) { updates.SITE_NAME = sc.name; updates.NEXT_PUBLIC_SITE_NAME = sc.name; }
    if (sc.tagline !== undefined) { updates.SITE_TAGLINE = sc.tagline; updates.NEXT_PUBLIC_SITE_TAGLINE = sc.tagline; }
    if (sc.description !== undefined) { updates.SITE_DESCRIPTION = sc.description; updates.NEXT_PUBLIC_SITE_DESCRIPTION = sc.description; }
    if (sc.logoUrl !== undefined) { updates.SITE_LOGO_URL = sc.logoUrl; updates.NEXT_PUBLIC_SITE_LOGO_URL = sc.logoUrl; }
    if (sc.primaryColor) { updates.SITE_PRIMARY_COLOR = sc.primaryColor; updates.NEXT_PUBLIC_SITE_PRIMARY_COLOR = sc.primaryColor; }
    if (sc.url) updates.SITE_URL = sc.url;
    if (sc.language) updates.SITE_LANGUAGE = sc.language;
    if (sc.timezone) updates.SITE_TIMEZONE = sc.timezone;
    if (sc.social?.twitter !== undefined) updates.SOCIAL_TWITTER = sc.social.twitter;
    if (sc.social?.github !== undefined) updates.SOCIAL_GITHUB = sc.social.github;
    if (sc.social?.linkedin !== undefined) updates.SOCIAL_LINKEDIN = sc.social.linkedin;
  }

  updateEnvFile(envPath, updates);
  logSuccess("Updated .env.local with new CMS connection");

  console.log(chalk.green("\n======================================================="));
  console.log(chalk.green("  ✨ Reconnect complete!"));
  console.log(chalk.green("=======================================================\n"));
  console.log(`  ${chalk.dim("CMS:")}     ${chalk.cyan(cleanCmsUrl)}`);
  console.log(`  ${chalk.dim("Project:")} ${chalk.cyan(projectSlug || cmsProjectName || projectId)}`);
  console.log(`  ${chalk.dim("Token:")}   ${chalk.cyan(`op_live_${token.slice(8, 12)}…`)}`);
  console.log("");
  logStep("Run `npx openpost-cli dev` to start developing with the new CMS");
  console.log("");
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) { printHelp(); process.exit(0); }
  if (args.version) { console.log(`${NAME} v${VERSION}`); process.exit(0); }

  const cmd = (args.command as string) || "init";
  if (["help", "--help", "-h"].includes(cmd)) { printHelp(); process.exit(0); }
  if (["version", "--version", "-v"].includes(cmd)) { console.log(`${NAME} v${VERSION}`); process.exit(0); }

  if (cmd === "doctor") return runDoctor(args);
  if (cmd === "dev") return runDev(args);
  if (cmd === "build") return runBuild(args);
  if (cmd === "start") return runStart(args);
  if (cmd === "status") return runStatus(args);
  if (cmd === "upgrade") return runUpgrade(args);
  if (cmd === "reconnect") return runReconnect(args);
  if (cmd === "init" || cmd === "create" || !["login", "logout", "doctor", "dev", "build", "start", "status", "upgrade", "reconnect"].includes(cmd)) {
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
