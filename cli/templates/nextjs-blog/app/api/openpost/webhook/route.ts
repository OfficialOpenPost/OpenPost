import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

const WEBHOOK_SECRET = process.env.OPENPOST_WEBHOOK_SECRET || "";

function verify(timestamp: string, body: string, signature: string) {
  if (!WEBHOOK_SECRET || !signature) return false;
  try {
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(`${timestamp}.${body}`).digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

const seen = new Set<string>();

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const timestamp = req.headers.get("x-openpost-timestamp") ?? "";
  const signature = req.headers.get("x-openpost-signature") ?? "";
  const deliveryId = req.headers.get("x-openpost-delivery-id") ?? "";
  const event = req.headers.get("x-openpost-event") ?? "";

  if (!timestamp || !signature || !deliveryId) return NextResponse.json({ error: "Missing headers" }, { status: 401 });
  if (Math.abs(Date.now() - new Date(timestamp).getTime()) > 5 * 60 * 1000) return NextResponse.json({ error: "Timestamp too old" }, { status: 401 });
  if (!verify(timestamp, rawBody, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  if (seen.has(deliveryId)) return NextResponse.json({ ok: true, duplicate: true });
  seen.add(deliveryId);

  const payload = JSON.parse(rawBody);
  // Revalidate based on event
  if (event.startsWith("blog.")) {
    revalidatePath("/blog");
    if (payload.data?.slug) {
      revalidatePath(`/${payload.data.slug}`);
      revalidatePath(`/blog/${payload.data.slug}`);
    }
  }

  return NextResponse.json({ ok: true });
}
