import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            blogs: true,
            categories: true,
            tags: true,
            media: true,
            authors: true,
            webhooks: true,
            members: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: project });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, slug, description, settings } = body;

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    const updated = await db.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        slug: slug !== undefined ? slug : existing.slug,
        description: description !== undefined ? description : existing.description,
        settings: settings !== undefined ? settings : existing.settings,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if there are other projects
    const count = await db.project.count().catch(() => 0);
    if (count <= 1) {
      return NextResponse.json(
        { error: { code: "CANNOT_DELETE_LAST", message: "Cannot delete the only remaining website/project." } },
        { status: 400 }
      );
    }

    await db.project.delete({ where: { id } });
    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "DELETE_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}
