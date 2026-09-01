import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(50),
  description: z.string().max(300).optional(),
  domain: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Find projects in database
    let projects = await db.project.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            blogs: true,
            categories: true,
            media: true,
            authors: true,
            webhooks: true,
          },
        },
      },
    }).catch(() => []);

    // If no projects exist yet in DB, create/seed a default project
    if (projects.length === 0) {
      try {
        // Find or ensure a default owner profile exists
        let ownerId = user?.id;
        if (!ownerId) {
          const firstUser = await db.user.findFirst().catch(() => null);
          ownerId = firstUser?.id;
        }

        // If we have an owner or profile, create the default project
        if (ownerId) {
          // Ensure Profile exists for ownerId
          await db.profile.upsert({
            where: { id: ownerId },
            update: {},
            create: {
              id: ownerId,
              email: user?.email ?? "admin@openpost.app",
              displayName: "Admin Owner",
              status: "approved",
            },
          }).catch(() => {});

          const defaultProj = await db.project.create({
            data: {
              name: "Main Publication",
              slug: "main",
              description: "Default OpenPost website and content studio",
              ownerId: ownerId,
              settings: {
                siteTitle: "Main Publication",
                description: "Built with OpenPost",
                primaryColor: "#FEA611",
              },
            },
            include: {
              _count: {
                select: {
                  blogs: true,
                  categories: true,
                  media: true,
                  authors: true,
                  webhooks: true,
                },
              },
            },
          });
          projects = [defaultProj];
        }
      } catch (seedErr) {
        console.warn("Could not auto-seed project:", seedErr);
      }
    }

    // Fallback if DB not fully initialized
    if (projects.length === 0) {
      projects = [
        {
          id: "default-project-id",
          name: "Main Publication",
          slug: "main",
          description: "Default OpenPost website",
          ownerId: "00000000-0000-0000-0000-000000000000",
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { blogs: 0, categories: 0, media: 0, authors: 0, webhooks: 0 },
        } as any,
      ];
    }

    return NextResponse.json({ data: projects });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "PROJECT_FETCH_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const { name, slug, description, domain, settings } = parsed.data;

    // Sanitize slug
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Check slug uniqueness
    const existing = await db.project.findUnique({
      where: { slug: cleanSlug },
    }).catch(() => null);

    if (existing) {
      return NextResponse.json(
        { error: { code: "SLUG_EXISTS", message: "A website with this slug identifier already exists." } },
        { status: 409 }
      );
    }

    // Get owner profile ID
    let ownerId = user?.id;
    if (!ownerId) {
      const firstUser = await db.user.findFirst().catch(() => null);
      ownerId = firstUser?.id;
    }

    if (!ownerId) {
      // Create a default user & profile if none exists in dev
      const newUser = await db.user.create({
        data: {
          email: "admin@openpost.app",
          name: "Project Admin",
          passwordHash: "dev-placeholder",
          role: "ADMIN" as any,
        },
      }).catch(() => null);
      ownerId = newUser?.id ?? "00000000-0000-0000-0000-000000000000";
    }

    // Ensure Profile exists for ownerId
    await db.profile.upsert({
      where: { id: ownerId },
      update: {},
      create: {
        id: ownerId,
        email: user?.email ?? "admin@openpost.app",
        displayName: user?.email?.split("@")[0] ?? "Admin",
        status: "approved",
      },
    }).catch(() => {});

    // Create the Project
    const project = await db.project.create({
      data: {
        name,
        slug: cleanSlug,
        description: description || null,
        ownerId,
        settings: {
          domain: domain || null,
          ...(settings || {}),
        },
      },
      include: {
        _count: {
          select: {
            blogs: true,
            categories: true,
            media: true,
            authors: true,
            webhooks: true,
          },
        },
      },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: { code: "PROJECT_CREATE_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}
