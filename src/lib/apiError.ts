import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

/**
 * Central error responder.
 *
 * Authorization failures propagate their real code/status; everything else is
 * collapsed to a generic message so internal details (Prisma query/argument
 * names, driver messages, stack text) are never disclosed to clients.
 *
 * The underlying error is still logged server-side for operators.
 */
export function errorResponse(
  error: unknown,
  fallbackCode: string,
  fallbackMessage: string,
  options?: { log?: boolean }
): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }

  if (options?.log !== false) {
    console.error(`[${fallbackCode}]`, error);
  }

  return NextResponse.json(
    { error: { code: fallbackCode, message: fallbackMessage } },
    { status: 500 }
  );
}
