import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// In-memory fallback if DB not configured
const votes = new Map<string, Set<string>>();

function getFingerprint(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const cookie = req.cookies.get("poll_token")?.value ?? crypto.randomBytes(8).toString("hex");
  return `${ip}:${cookie}`.slice(0, 64);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { optionId } = body as { optionId?: string };

  if (!optionId) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "optionId required" } }, { status: 400 });

  const fp = getFingerprint(req);
  const hashed = crypto.createHash("sha256").update(fp).digest("hex").slice(0, 32);
  const key = `${id}:${hashed}`;

  // DB dedup first (unique poll_id+voter_fingerprint)
  try {
    const existing = await db.pollVote.findFirst({ where: { pollId: id, voterFingerprint: hashed } as never }).catch(() => null);
    if (existing) return NextResponse.json({ error: { code: "ALREADY_VOTED", message: "You have already voted" } }, { status: 409 });
    // Validate poll open
    const poll = await db.poll.findUnique({ where: { id } as never }).catch(() => null);
    if (poll && (poll as any).status === "closed") return NextResponse.json({ error: { code: "POLL_CLOSED" } }, { status: 400 });
    if (poll) {
      await db.pollVote.create({ data: { pollId: id, optionId, voterFingerprint: hashed } as never });
      const res = NextResponse.json({ data: { pollId: id, optionId, fingerprint: hashed } }, { status: 201 });
      res.cookies.set("poll_token", fp.split(":")[1] ?? hashed, { httpOnly: true, sameSite: "lax", path: `/api/v1/polls/${id}` });
      return res;
    }
  } catch {}

  if (votes.has(key)) {
    return NextResponse.json({ error: { code: "ALREADY_VOTED", message: "You have already voted" } }, { status: 409 });
  }
  votes.set(key, new Set([optionId]));
  const res = NextResponse.json({ data: { pollId: id, optionId, fingerprint: hashed } }, { status: 201 });
  res.cookies.set("poll_token", fp.split(":")[1] ?? hashed, { httpOnly: true, sameSite: "lax", path: `/api/v1/polls/${id}` });
  return res;
}
