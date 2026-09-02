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
  linkedUserId: z.string().uuid().nullable().optional(),
  socialLinks: z.any().optional(),
  twitter: z.string().max(100).nullable().optional(),
  linkedin: z.string().max(100).nullable().optional(),
  projectId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const projectContext = await resolveProjectContext(req);
    if (!projectContext?.projectId) {
      return NextResponse.json({ data: [], meta: { total: 0, warning: "Missing project identification" } }, { headers: { "Cache-Control": "no-store" } });
    }
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const where: any = { projectId: projectContext.projectId };
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
          linkedUserId: true,
          projectId: true,
          photo: { select: { id: true, variants: true } },
          linkedUser: { select: { id: true, email: true } },
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
      photoUrl: (a.photo?.variants as any)?.publicUrl ?? null,
      linkedUserId: a.linkedUserId,
      linkedUserEmail: a.linkedUser?.email ?? null,
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

    const { name, slug: rawSlug, bio, email, website, photoId, linkedUserId, socialLinks, twitter, linkedin, projectId } = parsed.data;

    const projectContext = await resolveProjectContext(req);
    const targetProjectId = projectId || projectContext?.projectId;

    if (!targetProjectId) {
      return NextResponse.json({ error: { code: "PROJECT_REQUIRED", message: "Project ID is required." } }, { status: 400 });
    }

    await requirePermission(targetProjectId, "authors.create").catch(async () => {
      await requirePermission(targetProjectId, "taxonomy.manage");
    });

    // Validate linkedUserId belongs to same project if provided
    if (linkedUserId) {
      const linkMember = await withDbRetry(() =>
        db.projectMember.findUnique({ where: { projectId_userId: { projectId: targetProjectId, userId: linkedUserId } } })
      ).catch(() => null);
      if (!linkMember) {
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Linked user must be a member of the same project." } }, { status: 400 });
      }
      // Prevent cross-project linking — ensure user exists and profile approved
      const linkedProfile = await withDbRetry(() => db.profile.findUnique({ where: { id: linkedUserId } })).catch(() => null);
      if (!linkedProfile || linkedProfile.status !== "approved") {
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Linked user must be approved." } }, { status: 400 });
      }
    }

    // Validate photoId exists and belongs to same project if provided
    if (photoId) {
      const media = await withDbRetry(() => db.media.findUnique({ where: { id: photoId } })).catch(() => null);
      if (!media) {
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Selected photo not found." } }, { status: 400 });
      }
      if ((media as any).projectId && (media as any).projectId !== targetProjectId) {
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Photo must belong to same project." } }, { status: 400 });
      }
    }

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
          linkedUserId: linkedUserId || null,
          projectId: targetProjectId,
        },
      })
    );

    // Audit log
    try {
      const { createAuditLog, getCurrentUser } = await import("@/lib/auth");
      const actor = await getCurrentUser().catch(() => null);
      if (actor) {
        await createAuditLog({ actorId: actor.id, projectId: targetProjectId, action: "author.created", targetId: created.id, metadata: { name: created.name, slug } });
      }
    } catch {}

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "CREATE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to create author." } }, { status });
  }
}
