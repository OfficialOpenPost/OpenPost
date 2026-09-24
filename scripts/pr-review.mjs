#!/usr/bin/env node
/**
 * OpenPost PR Review Bot
 * Analyzes a pull request and (optionally) posts a structured review comment.
 *
 * Usage:
 *   node scripts/pr-review.mjs <pr-number> [--post] [--dry-run]
 *
 * Env:
 *   GITHUB_TOKEN  - required to read PR + post comment
 *   GITHUB_REPOSITORY - owner/repo (set automatically in Actions)
 */

import fs from "node:fs";
import path from "node:path";

const MARKER = "<!-- openpost-pr-review -->";
const OWNER_REPO = process.env.GITHUB_REPOSITORY || "OfficialOpenPost/OpenPost";
const API = `https://api.github.com/repos/${OWNER_REPO}`;

function parseArgs(argv) {
  const args = { pr: null, post: false, dryRun: false };
  for (const a of argv) {
    if (/^\d+$/.test(a)) args.pr = Number(a);
    else if (a === "--post") args.post = true;
    else if (a === "--dry-run") args.dryRun = true;
  }
  if (!args.pr && process.env.GITHUB_EVENT_PATH) {
    try {
      const ev = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
      args.pr = ev.pull_request?.number ?? ev.number ?? null;
      if (ev.pull_request) args.post = true;
    } catch {}
  }
  if (process.env.GITHUB_ACTIONS === "true") args.post = true;
  return args;
}

async function gh(pathname, init = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required");
  const res = await fetch(`${API}${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "openpost-pr-review",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status} ${pathname}: ${body.slice(0, 300)}`);
  }
  return res;
}

async function ghJson(p) {
  return (await gh(p)).json();
}

// ---------- risk rules (OpenPost-specific) ----------

const PATH_RULES = [
  { re: /(^|\/)\.env(\.|$)/, risk: 3, label: "Secrets/env — verify no keys committed" },
  { re: /src\/lib\/(auth|rbac|apiToken|rateLimit)\.ts/, risk: 3, label: "Auth/RBAC core — must preserve 5-tier matrix" },
  { re: /src\/lib\/supabase\//, risk: 3, label: "Supabase client/server — session & RLS impact" },
  { re: /(middleware|proxy)\.ts/, risk: 3, label: "Route middleware — auth guard" },
  { re: /prisma\/schema\.prisma/, risk: 3, label: "Prisma schema — migration required" },
  { re: /supabase\/migrations\//, risk: 3, label: "DB migration — verify order & backfills" },
  { re: /src\/app\/api\/cron\//, risk: 3, label: "Cron — Bearer-only, fail-closed" },
  { re: /src\/app\/api\/webhooks\//, risk: 3, label: "Webhooks — SSRF + HMAC rules" },
  { re: /src\/lib\/(storage|webhooks)\.ts/, risk: 3, label: "Storage/webhook security helpers" },
  { re: /src\/app\/api\/(blogs|media|authors|settings|projects)\//, risk: 2, label: "Project-scoped API — check requireProjectMember" },
  { re: /src\/app\/api\/settings\/users/, risk: 3, label: "Users/invites — OWNER/ADMIN guards" },
  { re: /src\/app\/(layout|page|template)\.tsx/, risk: 2, label: "App entry — global UX impact" },
  { re: /src\/components\/project\//, risk: 2, label: "Project switcher — multi-tenant UI" },
  { re: /package\.json$/, risk: 1, label: "Dependencies" },
  { re: /package-lock\.json$/, risk: 1, label: "Lockfile" },
  { re: /\.github\/workflows\//, risk: 2, label: "CI workflow change" },
  { re: /cli\//, risk: 2, label: "CLI (openpost-cli)" },
  { re: /scripts\//, risk: 1, label: "Scripts" },
  { re: /(test|spec)\.(ts|tsx|js|mjs)$/, risk: 1, label: "Tests" },
  { re: /\.(md|yml|yaml)$/, risk: 0, label: "Docs/config" },
  { re: /src\/app\/blog\//, risk: 2, label: "Public blog frontend" },
];

const DIFF_SECRET_PATTERNS = [
  { re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: "Private key material" },
  { re: /\bsk-[A-Za-z0-9]{16,}/, label: "Possible OpenAI-style secret key" },
  { re: /service_role["'\s:=]+["'][A-Za-z0-9._-]{20,}/i, label: "Supabase service_role key" },
  { re: /(AWS_SECRET_ACCESS_KEY|SUPABASE_SERVICE_ROLE_KEY|CRON_SECRET|DATABASE_URL)\s*[:=]\s*["'][^"']+["']/, label: "Hardcoded credential/URL assignment" },
  { re: /gh[pousr]_[A-Za-z0-9]{20,}/, label: "GitHub token" },
  { re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./, label: "JWT-like token" },
];

const CRITICAL_CODE = /src\/(lib|app\/api)\/|middleware|proxy\.ts|prisma\/schema/;

// ---------- helpers ----------

function classifyFile(filename) {
  let group = "other";
  if (filename === "package.json" || filename === "package-lock.json") group = "deps";
  else if (filename.startsWith(".github/")) group = "ci";
  else if (filename.startsWith("prisma/") || filename.startsWith("supabase/")) group = "db";
  else if (filename.startsWith("src/app/api/")) group = "api";
  else if (filename.startsWith("src/lib/")) group = "lib";
  else if (filename.startsWith("src/components/") || filename.startsWith("src/app/")) group = "ui";
  else if (filename.startsWith("cli/")) group = "cli";
  else if (filename.startsWith("scripts/")) group = "scripts";
  else if (filename.startsWith("tests/") || /\.(test|spec)\./.test(filename)) group = "tests";
  else if (/\.(md|txt)$/.test(filename)) group = "docs";

  const rules = PATH_RULES.filter((r) => r.re.test(filename));
  const risk = rules.length ? Math.max(...rules.map((r) => r.risk)) : guessRisk(filename, group);
  const labels = rules.map((r) => r.label);
  return { group, risk, labels };
}

function guessRisk(filename, group) {
  if (group === "deps") return 1;
  if (group === "api" || group === "lib" || group === "db") return 2;
  if (group === "ui" || group === "cli") return 1;
  return 0;
}

function parseSemver(v) {
  const cleaned = String(v).trim().replace(/^[\^~>=<\s]+/, "");
  const m = cleaned.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return null;
  return { major: +m[1], minor: +(m[2] ?? 0), patch: +(m[3] ?? 0), raw: String(v).trim() };
}

function bumpType(from, to) {
  const a = parseSemver(from);
  const b = parseSemver(to);
  if (!a || !b) return "unknown";
  if (b.major > a.major) return "major";
  if (b.minor > a.minor) return "minor";
  if (b.patch > a.patch) return "patch";
  if (b.raw !== a.raw) return "other";
  return "none";
}

function extractPackageChanges(patch) {
  if (!patch) return [];
  const changes = [];
  let section = null;
  for (const line of patch.split("\n")) {
    if (/^[+-]\s*"(dependencies|devDependencies|peerDependencies|optionalDependencies)":/.test(line)) {
      section = line.replace(/^[+-]\s*"/, "").replace(/":.*/, "");
      continue;
    }
    const m = line.match(/^([+-])\s*"([^"]+)":\s*"([^"]+)"/);
    if (m) {
      const [, sign, name, ver] = m;
      // package.json top-level dep keys (scoped or plain, no path separators)
      if (name.includes("/") && !name.startsWith("@")) continue;
      changes.push({ section: section || "dependencies", name, ver, sign });
    }
  }
  const byName = new Map();
  for (const c of changes) {
    if (!byName.has(c.name))
      byName.set(c.name, { name: c.name, section: c.section, from: null, to: null });
    const e = byName.get(c.name);
    if (c.sign === "-" && !e.from) e.from = c.ver;
    if (c.sign === "+" && !e.to) e.to = c.ver;
  }
  return [...byName.values()]
    .filter((e) => e.from && e.to && e.from !== e.to)
    .map((e) => ({ ...e, bump: bumpType(e.from, e.to) }));
}

function riskName(r) {
  return r >= 3 ? "HIGH" : r === 2 ? "MEDIUM" : r === 1 ? "LOW" : "INFO";
}

function riskEmoji(r) {
  return r >= 3 ? "🔴" : r === 2 ? "🟠" : r === 1 ? "🟡" : "⚪";
}

function trunc(s, n = 240) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function summarizePatch(patch) {
  if (!patch) return { adds: 0, dels: 0, sample: [] };
  const lines = patch.split("\n");
  let adds = 0;
  let dels = 0;
  const sample = [];
  for (const ln of lines) {
    if (ln.startsWith("+++") || ln.startsWith("---") || ln.startsWith("@@")) continue;
    if (ln.startsWith("+")) {
      adds++;
      if (sample.length < 4 && ln.trim().length > 2) sample.push(ln);
    } else if (ln.startsWith("-")) {
      dels++;
      if (sample.length < 4 && ln.trim().length > 2 && sample.filter((s) => s.startsWith("-")).length < 2)
        sample.push(ln);
    }
  }
  return { adds, dels, sample };
}

// ---------- main analysis ----------

async function analyze(prNumber) {
  const pr = await ghJson(`/pulls/${prNumber}`);
  const files = await ghJson(`/pulls/${prNumber}/files?per_page=100`);
  const headSha = pr.head.sha;

  let checkRuns = { check_runs: [] };
  let combined = { statuses: [], state: "pending" };
  try {
    checkRuns = await ghJson(`/commits/${headSha}/check-runs?per_page=100`);
  } catch {}
  try {
    combined = await ghJson(`/commits/${headSha}/status`);
  } catch {}

  const checks = [
    ...(checkRuns.check_runs || []).map((c) => ({
      name: c.name,
      status: c.conclusion || c.status,
      ok: c.conclusion === "success" || c.conclusion === "skipped" || c.conclusion === "neutral",
      url: c.html_url,
    })),
    ...(combined.statuses || []).map((s) => ({
      name: s.context,
      status: s.state,
      ok: s.state === "success",
      url: s.target_url,
    })),
  ];

  const analyzed = files.map((f) => {
    const meta = classifyFile(f.filename);
    const secretHits = DIFF_SECRET_PATTERNS.filter((p) => p.re.test(f.patch || "")).map((p) => p.label);
    const sum = summarizePatch(f.patch);
    const pkgBumps =
      f.filename === "package.json" ? extractPackageChanges(f.patch) : [];
    const isMajorDep = pkgBumps.some((b) => b.bump === "major");
    let risk = meta.risk;
    if (secretHits.length) risk = 3;
    if (isMajorDep) risk = Math.max(risk, 3);
    if (CRITICAL_CODE.test(f.filename) && sum.adds + sum.dels > 200) risk = Math.max(risk, 3);
    return {
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      ...meta,
      risk,
      secretHits,
      pkgBumps,
      sample: sum.sample,
      patch: f.patch || "",
    };
  });

  // verdict
  const failedChecks = checks.filter((c) => !c.ok && c.status !== "pending" && c.status !== "in_progress" && c.status !== "queued");
  const pendingChecks = checks.filter((c) => c.status === "pending" || c.status === "in_progress" || c.status === "queued");
  const secrets = analyzed.flatMap((f) => f.secretHits.map((s) => `${f.filename}: ${s}`));
  const majors = analyzed.flatMap((f) => f.pkgBumps.filter((b) => b.bump === "major"));
  const highRisk = analyzed.filter((f) => f.risk >= 3);

  let verdict = "✅ SAFE TO MERGE";
  let verdictLevel = "safe";
  const reasons = [];

  if (secrets.length) {
    verdict = "🛑 BLOCK — secrets detected";
    verdictLevel = "block";
    reasons.push(...secrets);
  }
  if (failedChecks.length) {
    const criticalFail = failedChecks.filter((c) => !/dependency review/i.test(c.name));
    if (criticalFail.length) {
      verdict = "🛑 BLOCK — CI failing";
      verdictLevel = "block";
      reasons.push(`Failing checks: ${criticalFail.map((c) => c.name).join(", ")}`);
    } else {
      reasons.push(`Non-blocking failures: ${failedChecks.map((c) => c.name).join(", ")}`);
    }
  }
  if (majors.length) {
    if (verdictLevel !== "block") {
      verdict = "⚠️ HOLD — major version bumps";
      verdictLevel = "hold";
    }
    reasons.push(
      `Major bumps: ${majors.map((m) => `${m.name} ${m.from} → ${m.to}`).join("; ")}`
    );
  }
  if (highRisk.length && verdictLevel === "safe") {
    verdict = "👀 NEEDS HUMAN REVIEW";
    verdictLevel = "review";
    reasons.push(`High-risk paths: ${highRisk.map((f) => f.filename).join(", ")}`);
  }
  if (pendingChecks.length && verdictLevel === "safe") {
    verdict = "⏳ WAIT — checks still running";
    verdictLevel = "wait";
    reasons.push(`Pending: ${pendingChecks.map((c) => c.name).join(", ")}`);
  }
  if (!reasons.length) reasons.push("No blocking issues found in diff analysis.");

  // stats
  const totalAdd = files.reduce((s, f) => s + f.additions, 0);
  const totalDel = files.reduce((s, f) => s + f.deletions, 0);
  const groups = {};
  for (const f of analyzed) {
    groups[f.group] = (groups[f.group] || 0) + 1;
  }

  return {
    pr,
    files: analyzed,
    checks,
    failedChecks,
    pendingChecks,
    verdict,
    verdictLevel,
    reasons,
    majors,
    secrets,
    stats: { totalAdd, totalDel, count: files.length, groups },
    headSha,
  };
}

// ---------- report rendering ----------

function render(a) {
  const { pr, stats, verdict, reasons, checks, files, majors } = a;
  const byRisk = [...files].sort((x, y) => y.risk - x.risk || y.additions + y.deletions - (x.additions + x.deletions));

  const lines = [];
  lines.push(MARKER);
  lines.push(`## 🤖 OpenPost PR Review — #${pr.number}`);
  lines.push("");
  lines.push(`**${verdict}**`);
  lines.push("");
  lines.push(`> ${pr.title}`);
  lines.push(`> \`${pr.head.ref}\` → \`${pr.base.ref}\` · by @${pr.user.login} · ${pr.state}${pr.draft ? " (draft)" : ""}`);
  lines.push("");
  lines.push("### Why");
  for (const r of reasons) lines.push(`- ${r}`);
  lines.push("");
  lines.push("### Stats");
  lines.push(
    `**${stats.count} files** · +${stats.totalAdd} / −${stats.totalDel} · groups: ${Object.entries(stats.groups)
      .map(([g, n]) => `${g}×${n}`)
      .join(", ")}`
  );
  lines.push("");

  lines.push("### CI");
  if (!checks.length) lines.push("_No checks reported yet._");
  else {
    for (const c of checks) {
      const icon = c.ok ? "✅" : c.status === "pending" || c.status === "in_progress" ? "⏳" : "❌";
      lines.push(`- ${icon} **${c.name}** — \`${c.status}\``);
    }
  }
  lines.push("");

  if (majors.length) {
    lines.push("### ⚠️ Major dependency bumps");
    for (const m of majors) lines.push(`- \`${m.name}\` ${m.from} → **${m.to}**`);
    lines.push("");
  }

  lines.push("### 📝 Every changed file (risk-ordered)");
  lines.push("");
  lines.push("| Risk | File | Δ | Notes |");
  lines.push("|------|------|---|-------|");
  for (const f of byRisk) {
    const notes = [
      ...f.labels,
      f.status !== "modified" ? f.status : "",
      f.secretHits.length ? `**SECRET:** ${f.secretHits.join("; ")}` : "",
      f.pkgBumps.length
        ? f.pkgBumps.map((b) => `${b.name} ${b.bump} ${b.from}→${b.to}`).join("; ")
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
    lines.push(
      `| ${riskEmoji(f.risk)} ${riskName(f.risk)} | \`${f.filename}\` | +${f.additions}/−${f.deletions} | ${trunc(notes, 160)} |`
    );
  }
  lines.push("");

  const showEdits = byRisk.filter((f) => f.risk >= 2 && f.sample.length).slice(0, 8);
  if (showEdits.length) {
    lines.push("### 🔍 Key edits (high-risk files)");
    for (const f of showEdits) {
      lines.push("");
      lines.push(`<details><summary><code>${f.filename}</code> +${f.additions}/−${f.deletions}</summary>`);
      lines.push("");
      lines.push("```diff");
      for (const s of f.sample) lines.push(trunc(s, 200));
      lines.push("```");
      lines.push("</details>");
    }
    lines.push("");
  }

  const low = files.filter((f) => f.risk < 2);
  if (low.length) {
    lines.push("### ⚪ Low-risk files");
    lines.push(low.map((f) => `\`${f.filename}\` (+${f.additions}/−${f.deletions})`).join(", "));
    lines.push("");
  }

  lines.push("---");
  lines.push(
    `_Generated by \`scripts/pr-review.mjs\` · head \`${a.headSha.slice(0, 7)}\` · re-run on push to update_`
  );
  lines.push(MARKER);
  return lines.join("\n");
}

async function upsertComment(prNumber, body) {
  const comments = await ghJson(`/issues/${prNumber}/comments?per_page=100`);
  const existing = comments.find((c) => c.body && c.body.includes(MARKER));
  if (existing) {
    await gh(`/issues/comments/${existing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    return existing.html_url;
  }
  const created = await (
    await gh(`/issues/${prNumber}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    })
  ).json();
  return created.html_url;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pr) {
    console.error("Usage: node scripts/pr-review.mjs <pr-number> [--post] [--dry-run]");
    process.exit(1);
  }
  console.error(`Analyzing PR #${args.pr} on ${OWNER_REPO}…`);
  const analysis = await analyze(args.pr);
  const report = render(analysis);

  if (args.dryRun) {
    process.stdout.write(report);
    return;
  }

  if (args.post && !args.dryRun) {
    const url = await upsertComment(args.pr, report);
    console.error(`Review posted: ${url}`);
    console.error(`Verdict: ${analysis.verdict}`);
    // Fail the job for block-level verdicts so branch protection can require it
    if (analysis.verdictLevel === "block" && process.env.GITHUB_ACTIONS === "true") {
      process.exitCode = 1;
    }
  } else {
    process.stdout.write(report);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
