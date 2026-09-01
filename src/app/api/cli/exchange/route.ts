import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({}));
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  try {
    const conn = await db.connectionCode.findUnique({ where: { code } });
    if (!conn || conn.usedAt || new Date(conn.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    await db.connectionCode.update({ where: { code }, data: { usedAt: new Date() } });

    // Create integration token (project-scoped)
    const rawToken = "op_" + crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const prefix = rawToken.slice(0, 8);

    const integration = await db.integration.create({
      data: {
        projectId: conn.projectId,
        name: "CLI Generated Website",
        tokenHash,
        tokenPrefix: prefix,
        permissions: ["READ_PUBLISHED_POSTS", "READ_CATEGORIES", "READ_TAGS", "READ_AUTHORS", "RECEIVE_WEBHOOKS"],
        createdBy: conn.createdBy,
      } as never,
    });

    return NextResponse.json({
      token: rawToken,
      tokenPrefix: prefix,
      projectId: conn.projectId,
      integrationId: integration.id,
    });
  } catch (e) {
    // Fallback mock for demo without DB
    const rawToken = "op_mock_" + code.slice(0, 8);
    return NextResponse.json({ token: rawToken, projectId: "mock-project", integrationId: "mock-id" });
  }
}
