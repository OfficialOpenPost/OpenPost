import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { requirePermission, AuthError } from "@/lib/auth";
import { resolveProjectContext } from "@/lib/apiToken";

const createAuthorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  website: z.string().url().nullable().optional().or(z.literal("")),
  photoId: z.string().uuid().nullable().optional(),
  socialLinks: z.any().optional(),
  twitter: z.string().max(100).nullable().optional(),
  linkedin: z.string().max(100).nullable().optional(),
  projectId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const projectContext = await resolveProjectContext(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (projectContext?.projectId) {
      where.projectId = projectContext.projectId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const data = await withDbRetry(() =>
      db.author.findMany({
        where,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          bio: true,
          email: true,
          website: true,
          socialLinks: true,
          photoId: true,
          projectId: true,
          _count: {
            select: { blogs: true },
          },
        },
      })
    );

    const formatted = data.map((a: any) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      bio: a.bio,
      email: a.email,
      website: a.website,
      social: a.socialLinks ?? {},
      photoId: a.photoId,
      projectId: a.projectId,
      postCount: a._count?.blogs ?? 0,
    }));

    return NextResponse.json(
      { data: formatted, meta: { total: formatted.length } },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } }
    );
  } catch (error: any) {
    console.error("GET /api/v1/authors error:", error);
    return NextResponse.json({ error: { code: "FETCH_FAILED", message: "Failed to fetch authors." } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createAuthorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    }

    const { name, slug: rawSlug, bio, email, website, photoId, socialLinks, twitter, linkedin, projectId } = parsed.data;

    const projectContext = await resolveProjectContext(req);
    const targetProjectId = projectId || projectContext?.projectId;

    if (!targetProjectId) {
      return NextResponse.json({ error: { code: "PROJECT_REQUIRED", message: "Project ID is required." } }, { status: 400 });
    }

    await requirePermission(targetProjectId, "taxonomy.manage");

    const slug = slugify(rawSlug || name);
    if (!slug) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug." } }, { status: 400 });
    }

    const existing = await withDbRetry(() =>
      db.author.findFirst({
        where: { slug, projectId: targetProjectId },
      })
    );

    if (existing) {
      return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Author slug already exists in this project." } }, { status: 409 });
    }

    const links = socialLinks ?? { ...(twitter ? { twitter } : {}), ...(linkedin ? { linkedin } : {}) };

    const created = await withDbRetry(() =>
      db.author.create({
        data: {
          name: name.trim(),
          slug,
          bio: bio || null,
          email: email || null,
          website: website || null,
          socialLinks: links,
          photoId: photoId || null,
          projectId: targetProjectId,
        },
      })
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "CREATE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to create author." } }, { status });
  }
}
