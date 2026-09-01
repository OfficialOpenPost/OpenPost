import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { generateApiToken } from "@/lib/apiToken";
import { createAuditLog } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code } = body as { code?: string };

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Connection authorization code is required." } },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Atomically find and mark code as used
    const exchangeResult = await withDbRetry(() =>
      db.$transaction(async (tx) => {
        const conn = await tx.connectionCode.findUnique({
          where: { code: cleanCode },
          include: { project: true },
        });

        if (!conn) {
          return { error: "INVALID_CODE", message: "Invalid authorization code." };
        }

        if (conn.usedAt) {
          return { error: "CODE_ALREADY_USED", message: "This authorization code has already been used." };
        }

        if (new Date(conn.expiresAt) < new Date()) {
          return { error: "CODE_EXPIRED", message: "Authorization code has expired. Please generate a new code." };
        }

        // Mark as used immediately
        await tx.connectionCode.update({
          where: { code: cleanCode },
          data: { usedAt: new Date() },
        });

        // Generate genuine API token
        const { rawToken, tokenHash, tokenPrefix } = generateApiToken();

        const integration = await tx.integration.create({
          data: {
            projectId: conn.projectId,
            name: `CLI Starter (${conn.project.name})`,
            tokenHash,
            tokenPrefix,
            permissions: [
              "READ_PUBLISHED_POSTS",
              "READ_CATEGORIES",
              "READ_TAGS",
              "READ_AUTHORS",
              "RECEIVE_WEBHOOKS",
            ],
            createdBy: conn.createdBy,
          },
        });

        return {
          conn,
          rawToken,
          tokenPrefix,
          integration,
        };
      })
    );

    if ("error" in exchangeResult) {
      return NextResponse.json(
        { error: { code: exchangeResult.error, message: exchangeResult.message } },
        { status: 400 }
      );
    }

    const { conn, rawToken, tokenPrefix, integration } = exchangeResult;

    await createAuditLog({
      actorId: conn.createdBy,
      projectId: conn.projectId,
      action: "cli.token_exchanged",
      targetId: integration.id,
      metadata: { tokenPrefix, projectSlug: conn.project.slug },
    });

    return NextResponse.json({
      token: rawToken,
      tokenPrefix,
      projectId: conn.projectId,
      projectSlug: conn.project.slug,
      projectName: conn.project.name,
      integrationId: integration.id,
    });
  } catch (error: any) {
    console.error("CLI code exchange error:", error);
    return NextResponse.json(
      { error: { code: "EXCHANGE_FAILED", message: "Failed to exchange authorization code." } },
      { status: 500 }
    );
  }
}
