import { NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";

export async function GET() {
  try {
    const ownerCount = await withDbRetry(() =>
      db.projectMember.count({
        where: { role: "OWNER" as any },
      })
    );

    return NextResponse.json({ hasOwners: ownerCount > 0 });
  } catch (error) {
    return NextResponse.json({ hasOwners: true });
  }
}
