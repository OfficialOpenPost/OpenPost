import { NextRequest, NextResponse } from "next/server";
import { requireApprovedUser, requirePermission, AuthError } from "@/lib/auth";
import { db, withDbRetry } from "@/lib/db";
import { isAllowedWebhookUrl } from "@/lib/webhooks";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireApprovedUser();

    const webhook = await withDbRetry(() =>
      db.webhook.findUnique({ where: { id } })
    );

    if (!webhook || !webhook.projectId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Webhook not found." } },
        { status: 404 }
      );
    }

    await requirePermission(webhook.projectId, "webhooks.manage").catch(async () => {
      await requirePermission(webhook.projectId!, "webhook.manage");
    });

    const sanitized = {
      ...webhook,
      secret: undefined,
      secretConfigured: Boolean(webhook.secret),
      secretPreview: webhook.secret ? `••••${String(webhook.secret).slice(-4)}` : null,
    };

    return NextResponse.json({ data: sanitized });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch webhook." } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireApprovedUser();
    const body = await req.json().catch(() => ({}));
    const { name, url, events, secret, isActive, filter } = body;

    const existing = await withDbRetry(() =>
      db.webhook.findUnique({ where: { id } })
    );

    if (!existing || !existing.projectId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Webhook not found." } },
        { status: 404 }
      );
    }

    await requirePermission(existing.projectId, "webhooks.manage").catch(async () => {
      await requirePermission(existing.projectId!, "webhook.manage");
    });

    const dataToUpdate: any = {};

    if (name !== undefined) {
      dataToUpdate.name = String(name).trim().slice(0, 100);
    }

    if (url !== undefined) {
      const trimmedUrl = String(url).trim();
      const check = isAllowedWebhookUrl(trimmedUrl);
      if (!check.allowed) {
        return NextResponse.json(
          { error: { code: "SSRF_BLOCKED", message: check.reason || "URL blocked by SSRF policy." } },
          { status: 400 }
        );
      }
      dataToUpdate.url = trimmedUrl;
    }

    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0 || events.length > 50 || !events.every((e) => typeof e === "string" && e.length > 0 && e.length <= 100)) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Events must be a non-empty array of short strings (max 50)." } },
          { status: 400 }
        );
      }
      dataToUpdate.events = events;
    }

    if (secret !== undefined) {
      if (secret && (typeof secret !== "string" || secret.length < 16)) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Webhook secret must be at least 16 characters." } },
          { status: 400 }
        );
      }
      dataToUpdate.secret = secret || null;
    }

    if (isActive !== undefined) {
      dataToUpdate.isActive = Boolean(isActive);
    }

    if (filter !== undefined) {
      dataToUpdate.filter = filter || null;
    }

    const updated = await withDbRetry(() =>
      db.webhook.update({
        where: { id },
        data: dataToUpdate,
      })
    );

    const sanitized = {
      ...updated,
      secret: undefined,
      secretConfigured: Boolean(updated.secret),
      secretPreview: updated.secret ? `••••${String(updated.secret).slice(-4)}` : null,
    };

    return NextResponse.json({ data: sanitized });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireApprovedUser();

    const existing = await withDbRetry(() =>
      db.webhook.findUnique({ where: { id } })
    );

    if (!existing || !existing.projectId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Webhook not found." } },
        { status: 404 }
      );
    }

    await requirePermission(existing.projectId, "webhooks.manage").catch(async () => {
      await requirePermission(existing.projectId!, "webhook.manage");
    });

    await withDbRetry(() =>
      db.webhook.delete({ where: { id } })
    );

    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "DELETE_FAILED", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
