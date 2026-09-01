import { db, withDbRetry } from "../src/lib/db";

async function auditAllTables() {
  console.log("================================================================");
  console.log("📊 OPENPOST COMPLETE DATABASE & TABLE WIRING AUDIT");
  console.log("================================================================\n");

  const tables = [
    { name: "profiles", model: "profile", desc: "User profile status (approved/pending), display name, avatar" },
    { name: "users", model: "user", desc: "Authentication and core user roles (ADMIN, EDITOR, WRITER)" },
    { name: "projects", model: "project", desc: "Multi-tenant workspaces (OpenPost publication projects)" },
    { name: "project_members", model: "projectMember", desc: "User-to-project role assignments and memberships" },
    { name: "blogs", model: "blog", desc: "Core blog articles, content AST, status, SEO metadata" },
    { name: "blog_revisions", model: "blogRevision", desc: "Version history, autosaves, and editorial rollbacks" },
    { name: "categories", model: "category", desc: "Hierarchical content taxonomies with parent/child links" },
    { name: "tags", model: "tag", desc: "Flat article tags for filtering and SEO indexing" },
    { name: "blog_tags", model: "blogTag", desc: "Join table linking blogs and tags" },
    { name: "authors", model: "author", desc: "Bylines with bios, headshots, and social links" },
    { name: "blog_authors", model: "blogAuthor", desc: "Multi-author bylines and sort ordering per article" },
    { name: "media", model: "media", desc: "Cloudflare R2 media assets, dimensions, and WebP variants" },
    { name: "media_usage", model: "mediaUsage", desc: "Tracks which articles use which media (deletion safety)" },
    { name: "polls", model: "poll", desc: "Interactive voting polls embedded inside articles" },
    { name: "poll_options", model: "pollOption", desc: "Poll answer options" },
    { name: "poll_votes", model: "pollVote", desc: "Fingerprinted, vote tracking" },
    { name: "redirects", model: "redirect", desc: "301 redirect engine for renamed article slugs" },
    { name: "webhooks", model: "webhook", desc: "HMAC SHA-256 automated event notifications (post.published)" },
    { name: "webhook_deliveries", model: "webhookDelivery", desc: "Webhook delivery history, payloads, status codes, retries" },
    { name: "integrations", model: "integration", desc: "Project API keys (op_live_...) with hashed storage" },
    { name: "connection_codes", model: "connectionCode", desc: "One-time codes for pairing external frontends" },
    { name: "cli_auth_codes", model: "cliAuthCode", desc: "One-time codes for openpost-cli terminal authentication" },
    { name: "invites", model: "invite", desc: "Team invitation tokens with expiration and role assignment" },
    { name: "audit_logs", model: "auditLog", desc: "Security audit trail (actor, action, project, timestamp)" },
    { name: "settings", model: "setting", desc: "Site configuration, branding, and defaults" },
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tables) {
    try {
      const accessor = (db as any)[t.model];
      if (!accessor) {
        throw new Error(`Prisma client model '${t.model}' is not registered.`);
      }
      const count = await withDbRetry(() => accessor.count());
      console.log(`✅ Table [${t.name.padEnd(20)}] | Model: ${t.model.padEnd(16)} | Records: ${String(count).padStart(3)} | Purpose: ${t.desc}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ Table [${t.name.padEnd(20)}] | FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log("\n================================================================");
  console.log(`🎯 AUDIT SUMMARY: ${passed} / ${tables.length} Tables Verified Operational (${failed} errors)`);
  console.log("================================================================");
}

auditAllTables().catch((err) => {
  console.error("Fatal audit failure:", err);
  process.exit(1);
});
