import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { requirePermission, AuthError } from "@/lib/auth";
import { resolveProjectContext } from "@/lib/apiToken";
import { triggerWebhooks } from "@/lib/webhooks";

const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
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
      db.tag.findMany({
        where,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          projectId: true,
          _count: {
            select: { blogs: true },
          },
        },
      })
    );

    const formatted = data.map((t: any) => ({
      ...t,
      postCount: t._count?.blogs ?? 0,
    }));

    return NextResponse.json(
      { data: formatted, meta: { total: formatted.length } },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } }
    );
  } catch (error: any) {
    console.error("GET /api/v1/tags error:", error);
    return NextResponse.json({ error: { code: "FETCH_FAILED", message: "Failed to fetch tags." } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    }

    const { name, slug: rawSlug, description, projectId } = parsed.data;

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
      db.tag.findFirst({
        where: { slug, projectId: targetProjectId },
      })
    );

    if (existing) {
      return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Tag slug already exists in this project." } }, { status: 409 });
    }

    const created = await withDbRetry(() =>
      db.tag.create({
        data: {
          name: name.trim(),
          slug,
          description: description || null,
          projectId: targetProjectId,
        },
      })
    );

    triggerWebhooks({
      projectId: targetProjectId,
      event: "tag.created",
      payload: { id: created.id, name: created.name, slug: created.slug },
    }).catch(() => {});

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "CREATE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to create tag." } }, { status });
  }
}
