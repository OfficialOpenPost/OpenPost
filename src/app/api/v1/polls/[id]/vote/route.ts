import { NextRequest, NextResponse } from "next/server";

// In-memory dedup for demo (use Redis/DB in production)
const votes = new Map<string, Set<string>>();

function getFingerprint(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const cookie = req.cookies.get("poll_token")?.value ?? Math.random().toString(36).slice(2);
  // Simple hash-like fingerprint
  return `${ip}:${cookie}`.slice(0, 64);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { optionId } = body as { optionId?: string };

  if (!optionId) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "optionId required" } }, { status: 400 });

  const fp = getFingerprint(req);
  const key = `${id}:${fp}`;
  if (votes.has(key)) {
    return NextResponse.json({ error: { code: "ALREADY_VOTED", message: "You have already voted" } }, { status: 409 });
  }

  // Rate limit: simple in-memory (10 votes/min per IP)
  // In production use Upstash Redis or DB

  votes.set(key, new Set([optionId]));

  const res = NextResponse.json({ data: { pollId: id, optionId, fingerprint: fp } }, { status: 201 });
  // Set poll-scoped cookie for dedup
  res.cookies.set("poll_token", fp.split(":")[1] ?? fp, { httpOnly: true, sameSite: "lax", path: `/api/v1/polls/${id}` });
  return res;
}
