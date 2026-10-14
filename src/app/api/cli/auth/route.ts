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

    // Verify user is a member of the project (any role can generate CLI code but must be approved member)
    await requireProjectMember(projectId, "CONTRIBUTOR");

    // Generate a high-entropy code matching the DB CHECK constraint
    // `^OP-[A-Z0-9]{4}-[A-Z0-9]{4}$`. The previous implementation used
    // randomBytes().toString("hex"), which only ever produced 0-9A-F and
    // therefore just 16 bits of entropy — trivially brute-forceable given the
    // code is the sole authenticator. We now use the full 32-symbol alphabet
    // (40 bits) and, critically, the exchange is single-use + rate-limited.
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const randomChunk = (): string => {
      const bytes = crypto.randomBytes(4);
      let out = "";
      for (let i = 0; i < 4; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
      return out;
    };
    const code = `OP-${randomChunk()}-${randomChunk()}`;

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
      // SECURITY: never log the full code — it is the sole authenticator.
      targetId: `${code.slice(0, 7)}…`,
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
      { error: { code, message: status < 500 ? error.message : "Failed to generate connection code." } },
      { status }
    );
  }
}
