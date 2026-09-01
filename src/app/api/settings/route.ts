import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

export async function GET(req: NextRequest) {
  try {
    const records = await db.setting.findMany().catch(() => []);
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
    return NextResponse.json({ data: defaultSettings });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser().catch(() => null);
    if (user && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only administrators can update settings." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Section and data are required." } },
        { status: 400 }
      );
    }

    // Upsert into settings table
    const updated = await db.setting.upsert({
      where: { key: section },
      update: { value: data },
      create: { key: section, value: data },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("Failed to update setting:", error);
    return NextResponse.json(
      { error: { code: "SETTINGS_SAVE_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
