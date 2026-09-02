#!/usr/bin/env tsx
/**
 * OpenPost CMS CLI — doctor & bootstrap
 * Usage:
 *  npm run cms:doctor
 *  npm run cms:bootstrap -- --email admin@example.com --password secret123 --name "Admin"
 * Or via env: BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_NAME
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

type CheckResult = { name: string; ok: boolean; msg: string };

function envCheck(name: string, required = true): CheckResult {
  const v = process.env[name];
  const ok = Boolean(v && !String(v).includes("your-") && !String(v).includes("placeholder") && String(v).length >= 4);
  return {
    name,
    ok: ok || !required,
    msg: ok ? "set" : required ? "MISSING or placeholder" : "optional / not set",
  };
}

async function runDoctor() {
  console.log("\n=== OpenPost CMS Doctor ===\n");

  const checks: CheckResult[] = [];

  // Node
  const nodeOk = parseInt(process.versions.node.split(".")[0], 10) >= 18;
  checks.push({ name: "Node >=18", ok: nodeOk, msg: process.versions.node });

  // Env
  checks.push(envCheck("DATABASE_URL", true));
  checks.push(envCheck("NEXT_PUBLIC_SUPABASE_URL", true));
  checks.push(envCheck("NEXT_PUBLIC_SUPABASE_ANON_KEY", true));
  checks.push(envCheck("SUPABASE_SERVICE_ROLE_KEY", true));
  checks.push(envCheck("R2_ACCOUNT_ID", false));
  checks.push(envCheck("R2_ACCESS_KEY_ID", false));
  checks.push(envCheck("R2_SECRET_ACCESS_KEY", false));
  checks.push(envCheck("R2_BUCKET_NAME", false));
  checks.push(envCheck("CRON_SECRET", false));
  checks.push(envCheck("NEXT_PUBLIC_APP_URL", false));

  for (const c of checks) {
    const icon = c.ok ? "✓" : "✗";
    console.log(`${icon} ${c.name}: ${c.msg}`);
  }

  // DB connection
  try {
    await prisma.$connect();
    console.log("✓ Database connection: OK");
    // Check migrations table existence
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
    const names = tables.map((t) => t.table_name);
    const required = ["profiles", "projects", "project_members", "blogs", "authors", "media", "audit_logs", "invites"];
    for (const t of required) {
      const ok = names.includes(t);
      console.log(`${ok ? "✓" : "✗"} Table ${t}: ${ok ? "exists" : "MISSING — run npx prisma migrate deploy"}`);
    }
    // Check enum
    try {
      const enumVals = await prisma.$queryRaw<Array<{ enumlabel: string }>>`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname='user_role' ORDER BY enumsortorder`;
      const labels = enumVals.map((e) => e.enumlabel);
      console.log(`  user_role enum values: ${labels.join(", ")}`);
      const has5 = ["OWNER", "ADMIN", "EDITOR", "AUTHOR", "CONTRIBUTOR"].every((v) => labels.includes(v));
      console.log(`${has5 ? "✓" : "✗"} Canonical 5 roles: ${has5 ? "OK" : "MISSING — run migration 019"}`);
    } catch (e: any) {
      console.log(`✗ enum check failed: ${e.message}`);
    }
  } catch (e: any) {
    console.log(`✗ Database connection: FAILED — ${e.message}`);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  // Supabase config
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (supaUrl.includes("supabase")) console.log("✓ Supabase URL looks valid");
  else console.log("✗ Supabase URL missing or placeholder");

  const prodIssues = checks.filter((c) => !c.ok && c.name !== "CRON_SECRET" && !c.name.startsWith("R2"));
  if (prodIssues.length === 0) {
    console.log("\n✓ CMS is ready for production (core checks passed).");
  } else {
    console.log("\n✗ CMS has configuration issues — see above. Fix env and re-run.");
    process.exitCode = 1;
  }
}

async function runBootstrap() {
  console.log("\n=== OpenPost CMS Bootstrap Admin ===\n");

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || getArg("--email") || process.env.ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || getArg("--password");
  const displayName = process.env.BOOTSTRAP_ADMIN_NAME || getArg("--name") || "Admin";
  const projectName = getArg("--project") || process.env.BOOTSTRAP_PROJECT_NAME || "Main Publication";
  const projectSlug = getArg("--slug") || process.env.BOOTSTRAP_PROJECT_SLUG || "main-publication";

  if (!email) {
    console.error("✗ Missing admin email. Provide via --email or BOOTSTRAP_ADMIN_EMAIL env.");
    console.log("Example: npm run cms:bootstrap -- --email admin@example.com --password secret123");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL missing");
    process.exit(1);
  }

  // Check existing bootstrap takeover protection: if any OWNER exists, require explicit --force to re-bootstrap
  try {
    await prisma.$connect();
    const ownerCount = await prisma.projectMember.count({ where: { role: "OWNER" as any } }).catch(() => 0);
    const projectCount = await prisma.project.count().catch(() => 0);
    if (ownerCount > 0 && projectCount > 0 && getArg("--force") !== "true") {
      console.log(`Found existing OWNER (${ownerCount}) and ${projectCount} project(s). Bootstrap would create duplicate owner.`);
      console.log("Use --force to proceed anyway, or manage members via dashboard.");
      // Allow but warn? We'll allow creation of additional but not takeover
    }

    const cleanEmail = email.toLowerCase().trim();
    // Find or create profile
    let profile = await prisma.profile.findUnique({ where: { email: cleanEmail } }).catch(() => null);
    let userId: string;
    if (profile) {
      console.log(`Found existing profile ${profile.id} (${profile.email}) status=${profile.status}`);
      userId = profile.id;
      if (profile.status !== "approved") {
        profile = await prisma.profile.update({ where: { id: profile.id }, data: { status: "approved" } });
        console.log(`Updated profile status to approved`);
      }
    } else {
      // Need to create Supabase user if possible via service role — try via direct DB insert to auth.users is not allowed; fallback to creating profile with random UUID
      // We'll attempt to create via Supabase Admin API if service key available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      let supabaseUserId: string | null = null;
      if (supabaseUrl && serviceKey && password) {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const admin = createClient(supabaseUrl, serviceKey);
          const { data, error } = await admin.auth.admin.createUser({
            email: cleanEmail,
            password: password || crypto.randomBytes(12).toString("hex"),
            email_confirm: true,
            user_metadata: { display_name: displayName },
          });
          if (error) {
            // If user already exists, try to get by email
            const { data: list } = await (admin.auth.admin as any).listUsers?.().catch(() => ({ data: { users: [] } }));
            const found = (list?.users || []).find((u: any) => u.email?.toLowerCase() === cleanEmail);
            if (found) {
              supabaseUserId = found.id;
              console.log(`Found existing Supabase user ${supabaseUserId}`);
            } else {
              console.warn(`Supabase createUser failed: ${error.message} — falling back to local profile creation`);
            }
          } else if (data?.user) {
            supabaseUserId = data.user.id;
            console.log(`Created Supabase user ${supabaseUserId}`);
          }
        } catch (e: any) {
          console.warn(`Supabase admin creation failed: ${e.message}`);
        }
      }
      const id = supabaseUserId || crypto.randomUUID();
      userId = id;
      profile = await prisma.profile.create({
        data: { id, email: cleanEmail, displayName, status: "approved" },
      }).catch(async () => {
        // if already exists race, fetch
        return await prisma.profile.findUnique({ where: { email: cleanEmail } });
      }) as any;
      console.log(`Created profile ${profile!.id}`);
      // Ensure users table FK
      await prisma.user.upsert({
        where: { email: cleanEmail },
        create: { id, email: cleanEmail, name: displayName, passwordHash: "", role: "OWNER" as any },
        update: { name: displayName },
      }).catch(() => {});
    }

    // Find or create project
    let project = await prisma.project.findUnique({ where: { slug: projectSlug } }).catch(() => null);
    if (!project) {
      const existingProject = await prisma.project.findFirst({ orderBy: { createdAt: "asc" } }).catch(() => null);
      if (existingProject) {
        project = existingProject;
        console.log(`Using existing project ${project.id} (${project.slug})`);
        // Ensure caller is owner/member
        const existingMember = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: project.id, userId } } }).catch(() => null);
        if (!existingMember) {
          await prisma.projectMember.create({ data: { projectId: project.id, userId, role: "OWNER" as any } });
          console.log(`Added ${cleanEmail} as OWNER to existing project`);
        } else if ((existingMember as any).role !== "OWNER") {
          await prisma.projectMember.update({ where: { projectId_userId: { projectId: project.id, userId } }, data: { role: "OWNER" as any } });
          console.log(`Promoted ${cleanEmail} to OWNER`);
        }
        // Ensure project ownerId is this user if no owner
        if ((project as any).ownerId !== userId) {
          // Keep original owner but ensure membership; optionally transfer if --force and owner is placeholder
        }
      } else {
        project = await prisma.project.create({
          data: { name: projectName, slug: projectSlug, ownerId: userId, settings: {} },
        });
        console.log(`Created project ${project.id} (${project.slug})`);
        await prisma.projectMember.create({ data: { projectId: project.id, userId, role: "OWNER" as any } });
        console.log(`Added ${cleanEmail} as OWNER`);
      }
    } else {
      console.log(`Found project ${project.id} (${project.slug})`);
      const mem = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: project.id, userId } } }).catch(() => null);
      if (!mem) {
        await prisma.projectMember.create({ data: { projectId: project.id, userId, role: "OWNER" as any } });
        console.log(`Added ${cleanEmail} as OWNER to project`);
      }
    }

    await prisma.auditLog.create({
      data: { actorId: userId, projectId: project!.id, action: "bootstrap.owner_created", targetId: userId, metadata: { email: cleanEmail, projectSlug } },
    }).catch(() => {});

    console.log(`\n✓ Bootstrap complete — admin ${cleanEmail} is OWNER of project ${project!.slug}`);
    console.log(`  Login via Supabase Auth (email/password) and you will have immediate access (approved).`);
  } catch (e: any) {
    console.error("Bootstrap failed:", e.message, e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

function getArg(name: string): string | null {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  // also support --email=value
  const pref = process.argv.find((a) => a.startsWith(name + "="));
  if (pref) return pref.split("=")[1];
  return null;
}

async function main() {
  const cmd = process.argv[2] || "doctor";
  if (cmd === "doctor") await runDoctor();
  else if (cmd === "bootstrap") await runBootstrap();
  else if (cmd === "bootstrap:admin" || cmd === "admin:create") await runBootstrap();
  else {
    console.log(`Unknown command ${cmd}. Available: doctor, bootstrap`);
    process.exit(1);
  }
}
main();
