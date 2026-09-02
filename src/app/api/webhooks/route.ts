import { NextRequest, NextResponse } from "next/server";
import { requireApprovedUser, requirePermission, AuthError } from "@/lib/auth";
import { db, withDbRetry } from "@/lib/db";
import { isAllowedWebhookUrl } from "@/lib/webhooks";

// GET /api/webhooks — list project-scoped, sanitized
export async function GET(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || req.headers.get("x-openpost-project");

    let where: any = {};
    if (projectId) {
      await requirePermission(projectId, "webhooks.manage").catch(async () => {
        await requirePermission(projectId, "webhook.manage");
      });
      where.projectId = projectId;
    } else {
      // Return webhooks for all projects user can manage (ADMIN+)
      const manageableIds = user.memberships
        .filter((m) => ["OWNER", "ADMIN"].includes(m.role))
        .map((m) => m.projectId);
      if (manageableIds.length === 0) {
        // Non-admin: return only webhooks they can view via members.view? Restrict empty for least privilege
        return NextResponse.json({ data: [] });
      }
      where.projectId = { in: manageableIds };
    }

    const webhooks = await withDbRetry(() =>
      db.webhook.findMany({ where, orderBy: { createdAt: "desc" } })
    );

    // Sanitize secrets
    const sanitized = (webhooks as any[]).map((w) => ({
      ...w,
      secret: undefined,
      secretConfigured: Boolean(w.secret),
      secretPreview: w.secret ? `••••${String(w.secret).slice(-4)}` : null,
    }));

    return NextResponse.json({ data: sanitized });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    console.error("GET /api/webhooks error", error);
    return NextResponse.json({ error: { code: "FETCH_FAILED", message: "Failed to fetch webhooks." } }, { status: 500 });
  }
}

// POST /api/webhooks — create project-scoped
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, url, events, secret, filter, projectId: bodyProjectId } = body;

    const projectId = bodyProjectId || req.headers.get("x-openpost-project") || new URL(req.url).searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: { code: "PROJECT_REQUIRED", message: "projectId is required." } }, { status: 400 });
    }

    await requirePermission(projectId, "webhooks.manage").catch(async () => {
      await requirePermission(projectId, "webhook.manage");
    });

    if (!name || !url || !events?.length) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "name, url, events required" } }, { status: 400 });
    }

    const check = isAllowedWebhookUrl(url);
    if (!check.allowed) {
      return NextResponse.json({ error: { code: "SSRF_BLOCKED", message: check.reason || "URL blocked by SSRF policy." } }, { status: 400 });
    }

    if (secret && (typeof secret !== "string" || secret.length < 16)) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Webhook secret must be at least 16 characters if provided." } }, { status: 400 });
    }

    const webhook = await withDbRetry(() =>
      db.webhook.create({
        data: { name: name.trim().slice(0, 100), url: url.trim(), events, secret: secret || null, filter: filter || null, projectId },
      })
    );

    // Return sanitized
    const sanitized = { ...(webhook as any), secret: undefined, secretConfigured: Boolean((webhook as any).secret) };
    return NextResponse.json({ data: sanitized }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    console.error("POST /api/webhooks error", error);
    return NextResponse.json({ error: { code: "CREATE_FAILED", message: String(error?.message || error) } }, { status: 500 });
  }
}
