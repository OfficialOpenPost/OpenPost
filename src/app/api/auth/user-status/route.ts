import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ status: "unauthenticated" }, { status: 401 });
    }

    return NextResponse.json({
      status: user.status,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    });
  } catch {
    return NextResponse.json({ status: "unknown" }, { status: 500 });
  }
}
