import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, AuthError, hasPermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || req.headers.get("x-openpost-project") || user.memberships[0]?.projectId;
    const action = searchParams.get("action");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    if (!projectId) {
      return NextResponse.json({ error: { code: "PROJECT_REQUIRED", message: "projectId required" } }, { status: 400 });
    }

    const { role } = await requireProjectMember(projectId);
    if (!hasPermission(role, "audit.view") && !hasPermission(role, "audit.read") && role !== "OWNER" && role !== "ADMIN") {
      throw new AuthError("Audit log access requires ADMIN or OWNER.", 403, "FORBIDDEN");
    }

    const where: any = { projectId };
    if (action) where.action = { contains: action, mode: "insensitive" };

    const [logs, total] = await Promise.all([
      withDbRetry(() =>
        db.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        })
      ),
      withDbRetry(() => db.auditLog.count({ where })).catch(() => 0),
    ]);

    return NextResponse.json({ data: logs, meta: { total, limit, offset } });
  } catch (error: any) {
    if (error instanceof AuthError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    console.error("GET /api/audit error", error);
    return NextResponse.json({ error: { code: "FETCH_FAILED", message: "Failed to fetch audit logs." } }, { status: 500 });
  }
}
