import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/slug";
import { requirePermission, AuthError } from "@/lib/auth";
import { resolveProjectContext } from "@/lib/apiToken";
import { triggerWebhooks } from "@/lib/webhooks";

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().optional(),
  seoTitle: z.string().max(60).nullable().optional(),
  seoDesc: z.string().max(160).nullable().optional(),
  seo: z.any().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const projectContext = await resolveProjectContext(req);
    // Strict isolation: require project identification for multi-tenant
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
      db.category.findMany({
        where,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          parentId: true,
          projectId: true,
          seo: true,
          _count: {
            select: { blogs: { where: { status: "published" } } },
          },
        },
      })
    );

    const normalized = data.map((c: any) => ({
      ...c,
      postCount: c._count?.blogs ?? 0,
      seoTitle: (c.seo as any)?.title ?? null,
      seoDesc: (c.seo as any)?.description ?? null,
    }));

    return NextResponse.json(
      { data: normalized, meta: { total: normalized.length } },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } }
    );
  } catch (error: any) {
    console.error("GET /api/v1/categories error:", error);
    return NextResponse.json({ error: { code: "FETCH_FAILED", message: "Failed to fetch categories." } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, { status: 400 });
    }

    const { name, slug: rawSlug, description, parentId, projectId, seoTitle, seoDesc, seo } = parsed.data;

    const projectContext = await resolveProjectContext(req);
    const targetProjectId = projectId || projectContext?.projectId;

    if (!targetProjectId) {
      return NextResponse.json({ error: { code: "PROJECT_REQUIRED", message: "Project ID is required." } }, { status: 400 });
    }

    // Require taxonomy.manage permission (EDITOR+)
    await requirePermission(targetProjectId, "taxonomy.manage");

    const slug = slugify(rawSlug || name);
    if (!slug) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid slug." } }, { status: 400 });
    }

    // Check project-scoped slug collision
    const existing = await withDbRetry(() =>
      db.category.findFirst({
        where: { slug, projectId: targetProjectId },
      })
    );

    if (existing) {
      return NextResponse.json({ error: { code: "SLUG_EXISTS", message: "Category slug already exists in this project." } }, { status: 409 });
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await withDbRetry(() =>
        db.category.findFirst({ where: { id: parentId, projectId: targetProjectId } })
      );
      if (!parent) {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "Parent category not found within project." } }, { status: 404 });
      }
      if (parent.parentId) {
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Only top-level categories can be parent categories." } }, { status: 400 });
      }
    }

    const seoData = seo ?? (seoTitle || seoDesc ? { title: seoTitle ?? null, description: seoDesc ?? null } : {});

    const created = await withDbRetry(() =>
      db.category.create({
        data: {
          name: name.trim(),
          slug,
          description: description || null,
          parentId: parentId || null,
          projectId: targetProjectId,
          seo: seoData,
        },
      })
    );

    triggerWebhooks({
      projectId: targetProjectId,
      event: "category.created",
      payload: { id: created.id, name: created.name, slug: created.slug },
    }).catch(() => {});

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "CREATE_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to create category." } }, { status });
  }
}
