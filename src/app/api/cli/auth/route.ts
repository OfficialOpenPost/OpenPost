import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, createAuditLog, AuthError } from "@/lib/auth";
import crypto from "crypto";
import { z } from "zod";

const authCodeSchema = z.object({
  projectId: z.string().uuid("Valid project ID required"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const body = await req.json().catch(() => ({}));
    const parsed = authCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0]?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const { projectId } = parsed.data;

    // Verify user is a member of the project
    await requireProjectMember(projectId, "WRITER");

    // Generate high-entropy 12-char alphanumeric code (e.g. OP-A1B2-C3D4-E5F6)
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part3 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const code = `OP-${part1}-${part2}-${part3}`;

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const connectionCode = await withDbRetry(() =>
      db.connectionCode.create({
        data: {
          code,
          projectId,
          createdBy: user.id,
          expiresAt,
        },
      })
    );

    await createAuditLog({
      actorId: user.id,
      projectId,
      action: "cli.code_generated",
      targetId: connectionCode.code,
      metadata: { codePrefix: code.slice(0, 7) },
    });

    return NextResponse.json({
      code: connectionCode.code,
      expiresIn: 600,
      expiresAt: connectionCode.expiresAt,
    });
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "CODE_GENERATION_FAILED";
    return NextResponse.json(
      { error: { code, message: error.message || "Failed to generate connection code." } },
      { status }
    );
  }
}
