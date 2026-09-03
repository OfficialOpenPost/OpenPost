import { NextRequest, NextResponse } from "next/server";
import { requireApprovedUser, requirePermission, AuthError } from "@/lib/auth";
import { db, withDbRetry } from "@/lib/db";

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

    if (!webhook) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Webhook not found." } },
        { status: 404 }
      );
    }

    if (webhook.projectId) {
      await requirePermission(webhook.projectId, "webhooks.manage").catch(async () => {
        await requirePermission(webhook.projectId!, "webhook.manage");
      });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 100);

    const deliveries = await withDbRetry(() =>
      db.webhookDelivery.findMany({
        where: { webhookId: id },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
    );

    return NextResponse.json({ data: deliveries });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch webhook deliveries." } },
      { status: 500 }
    );
  }
}
