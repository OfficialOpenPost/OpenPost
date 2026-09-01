import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const integrations = await db.integration.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        permissions: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    }).catch(() => []);

    return NextResponse.json({ data: integrations });
  } catch (error: any) {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser().catch(() => null);
    const body = await req.json();
    const { name, permissions } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Token name is required." } },
        { status: 400 }
      );
    }

    // Generate token: op_live_<32 hex chars>
    const randomHex = crypto.randomBytes(16).toString("hex");
    const rawToken = `op_live_${randomHex}`;
    const tokenPrefix = `op_live_${randomHex.slice(0, 6)}...`;
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Get a project ID
    let project = await db.project.findFirst().catch(() => null);
    if (!project) {
      project = await db.project.create({
        data: {
          name: "Main Publication",
          slug: "main",
          ownerId: user?.id ?? "00000000-0000-0000-0000-000000000000",
        },
      }).catch(() => null);
    }

    const created = await db.integration.create({
      data: {
        name: name.trim(),
        projectId: project?.id ?? "00000000-0000-0000-0000-000000000000",
        tokenHash,
        tokenPrefix,
        permissions: Array.isArray(permissions) && permissions.length > 0
          ? permissions
          : ["READ_PUBLISHED_POSTS", "READ_CATEGORIES", "READ_TAGS", "READ_AUTHORS"],
        createdBy: user?.id ?? "00000000-0000-0000-0000-000000000000",
      },
    });

    return NextResponse.json({
      data: {
        id: created.id,
        name: created.name,
        tokenPrefix: created.tokenPrefix,
        rawToken, // Sent only once upon creation
        permissions: created.permissions,
        createdAt: created.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "TOKEN_CREATE_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Token ID required." } },
        { status: 400 }
      );
    }

    await db.integration.delete({ where: { id } }).catch(async () => {
      await db.integration.update({
        where: { id },
        data: { revokedAt: new Date() },
      });
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "TOKEN_DELETE_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}
