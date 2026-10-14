import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireAdmin, requireApprovedUser, createAuditLog, AuthError } from "@/lib/auth";

/** Sections that may be persisted — anything else is rejected outright. */
const ALLOWED_SECTIONS = new Set(["general", "media", "seo", "publishing", "security"]);

/** Keys that must never appear in a settings object (prototype pollution). */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Recursively copy a settings payload, dropping prototype-polluting keys and
 * capping depth/size. Returns a plain object safe to JSON-serialise into the
 * `settings.value` column.
 */
function sanitizeSettingsValue(input: unknown, depth = 0): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  if (depth > 4) return null;

  const out: Record<string, unknown> = {};
  let count = 0;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key) || key.startsWith("__")) continue;
    if (++count > 100) break;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = sanitizeSettingsValue(value, depth + 1);
      if (nested) out[key] = nested;
    } else if (typeof value === "string") {
      out[key] = value.slice(0, 2000);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value
        .slice(0, 100)
        .map((v) => (typeof v === "string" ? v.slice(0, 500) : typeof v === "number" || typeof v === "boolean" ? v : null))
        .filter((v) => v !== null);
    }
  }
  return out;
}

export const defaultSettings = {
  general: {
    siteName: "OpenPost Publication",
    tagline: "Professional blog CMS and high-speed writing studio",
    siteUrl: "http://localhost:3000",
    timezone: "UTC",
    locale: "en-US",
    primaryColor: "#FEA611",
    logoUrl: "/logo.svg",
  },
  media: {
    storageProvider: "Cloudflare R2",
    bucketName: "openpost-media",
    publicCdnUrl: "https://pub-7091.r2.dev",
    maxUploadSizeMb: 25,
    maxDimensionPx: 8000,
    autoWebP: true,
    autoAvif: true,
    stripExif: true,
  },
  seo: {
    titleTemplate: "%title% — OpenPost",
    defaultDescription: "High-performance blog articles, technical insights, and structured content.",
    defaultOgImage: "/images/hero_3d_mockup.jpg",
    robotsDirective: "index, follow",
    sitemapEnabled: true,
    googleSiteVerification: "",
  },
  publishing: {
    defaultPostStatus: "draft",
    autoSlugEnabled: true,
    enable301RedirectsOnSlugChange: true,
    trashRetentionDays: 30,
    cronIntervalMins: 1,
    requireReviewForContributors: true,
  },
  security: {
    sessionDurationDays: 30,
    maxLoginAttempts: 5,
    lockoutDurationMins: 15,
    forceHttps: true,
  },
};

export async function GET(_req: NextRequest) {
  try {
    await requireApprovedUser();

    const records = await withDbRetry(() => db.setting.findMany()).catch(() => []);
    const merged: Record<string, any> = { ...defaultSettings };

    for (const record of records) {
      // Only merge known sections — a poisoned row with key "__proto__" or an
      // arbitrary section name must not pollute the response object.
      if (record.key && ALLOWED_SECTIONS.has(record.key) && record.value && typeof record.value === "object") {
        const safeValue = sanitizeSettingsValue(record.value) || {};
        merged[record.key] = {
          ...(defaultSettings[record.key as keyof typeof defaultSettings] || {}),
          ...safeValue,
        };
      }
    }

    return NextResponse.json({ data: merged });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "SETTINGS_FETCH_FAILED";
    return NextResponse.json({ error: { code, message: status < 500 ? error.message : "Failed to load settings." } }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const { section, data } = body;

    if (!section || typeof section !== "string" || !ALLOWED_SECTIONS.has(section)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: `Unknown settings section. Allowed: ${[...ALLOWED_SECTIONS].join(", ")}.` } },
        { status: 400 }
      );
    }

    const safeData = sanitizeSettingsValue(data) as Record<string, unknown> | null;
    if (!safeData) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Settings data must be a plain object." } },
        { status: 400 }
      );
    }

    const updated = await withDbRetry(() =>
      db.setting.upsert({
        where: { key: section },
        update: { value: safeData as never },
        create: { key: section, value: safeData as never },
      })
    );

    await createAuditLog({
      actorId: adminUser.id,
      action: `settings.updated_${section}`,
      metadata: { section },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "SETTINGS_SAVE_FAILED";
    return NextResponse.json(
      { error: { code, message: status < 500 ? error.message : "Failed to save settings." } },
      { status }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
