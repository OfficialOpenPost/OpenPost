import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const [users, invites] = await Promise.all([
      db.user.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }).catch(() => []),
      db.invite.findMany({
        where: { usedAt: null },
        orderBy: { createdAt: "desc" },
      }).catch(() => []),
    ]);

    return NextResponse.json({ data: { users, invites } });
  } catch (error: any) {
    return NextResponse.json({ data: { users: [], invites: [] } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser().catch(() => null);
    const body = await req.json();
    const { email, role, name } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Valid email address required." } },
        { status: 400 }
      );
    }

    const normalizedRole = ["ADMIN", "EDITOR", "WRITER", "CONTRIBUTOR"].includes(role?.toUpperCase())
      ? role.toUpperCase()
      : "WRITER";

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } }).catch(() => null);
    if (existing) {
      return NextResponse.json(
        { error: { code: "USER_EXISTS", message: "User with this email is already registered." } },
        { status: 409 }
      );
    }

    // Create user or invitation
    const createdUser = await db.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name?.trim() || email.split("@")[0],
        passwordHash: "invited-account",
        role: normalizedRole as any,
      },
    });

    return NextResponse.json({ data: createdUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "USER_INVITE_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "User ID and Role required." } },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id },
      data: { role: role as any },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "USER_UPDATE_FAILED", message: String(error) } },
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
        { error: { code: "VALIDATION_ERROR", message: "User ID required." } },
        { status: 400 }
      );
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "USER_DELETE_FAILED", message: String(error) } },
      { status: 500 }
    );
  }
}
