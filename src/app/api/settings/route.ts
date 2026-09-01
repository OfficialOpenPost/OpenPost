import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireAdmin, requireApprovedUser, createAuditLog, AuthError } from "@/lib/auth";

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
      if (record.key && record.value) {
        merged[record.key] = {
          ...(defaultSettings[record.key as keyof typeof defaultSettings] || {}),
          ...(typeof record.value === "object" ? (record.value as any) : {}),
        };
      }
    }

    return NextResponse.json({ data: merged });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "SETTINGS_FETCH_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to load settings." } }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const { section, data } = body;

    if (!section || !data || typeof section !== "string" || typeof data !== "object") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Section and data object are required." } },
        { status: 400 }
      );
    }

    const updated = await withDbRetry(() =>
      db.setting.upsert({
        where: { key: section },
        update: { value: data },
        create: { key: section, value: data },
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
      { error: { code, message: error.message || "Failed to save settings." } },
      { status }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
