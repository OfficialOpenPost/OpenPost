import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import crypto from "crypto";

function getFingerprint(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const cookie = req.cookies.get("op_poll_voter")?.value;
  return `${ip}:${userAgent.slice(0, 32)}:${cookie || ""}`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pollId } = await params;

  if (!pollId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Poll ID required" } }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { optionId } = body as { optionId?: string };

    if (!optionId || typeof optionId !== "string") {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "optionId is required" } }, { status: 400 });
    }

    // 1. Fetch poll
    const poll = await withDbRetry(() =>
      db.poll.findUnique({
        where: { id: pollId },
        include: {
          options: true,
        },
      })
    );

    if (!poll || poll.status === "draft") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Poll not found" } }, { status: 404 });
    }

    const isExpired = poll.closesAt ? new Date(poll.closesAt) < new Date() : false;
    if (poll.status === "closed" || isExpired) {
      return NextResponse.json({ error: { code: "POLL_CLOSED", message: "This poll is closed for voting." } }, { status: 400 });
    }

    // 2. Validate that option belongs to this poll
    const validOption = poll.options.find((o) => o.id === optionId);
    if (!validOption) {
      return NextResponse.json({ error: { code: "INVALID_OPTION", message: "Option does not belong to this poll." } }, { status: 400 });
    }

    // 3. Compute hashed voter fingerprint
    const rawFp = getFingerprint(req);
    const voterFingerprint = crypto.createHash("sha256").update(rawFp).digest("hex").slice(0, 32);

    // 4. Check duplicate vote
    const existingVote = await withDbRetry(() =>
      db.pollVote.findFirst({
        where: { pollId, voterFingerprint },
      })
    );

    if (existingVote) {
      return NextResponse.json({ error: { code: "ALREADY_VOTED", message: "You have already voted in this poll." } }, { status: 409 });
    }

    // 5. Record vote
    const vote = await withDbRetry(() =>
      db.pollVote.create({
        data: {
          pollId,
          optionId,
          voterFingerprint,
        },
      })
    );

    const cookieToken = req.cookies.get("op_poll_voter")?.value || crypto.randomBytes(16).toString("hex");

    const res = NextResponse.json(
      {
        data: {
          id: vote.id,
          pollId,
          optionId,
          success: true,
        },
      },
      { status: 201 }
    );

    res.cookies.set("op_poll_voter", cookieToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 3600,
    });

    return res;
  } catch (error: any) {
    console.error("POST /api/v1/polls/[id]/vote error:", error);
    return NextResponse.json({ error: { code: "VOTE_FAILED", message: "Failed to record vote." } }, { status: 500 });
  }
}
