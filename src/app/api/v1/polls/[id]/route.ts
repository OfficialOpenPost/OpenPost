import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import crypto from "crypto";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function voterFingerprint(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const cookie = req.cookies.get("op_poll_voter")?.value;
  return crypto.createHash("sha256").update(`${ip}:${userAgent.slice(0, 32)}:${cookie || ""}`).digest("hex").slice(0, 32);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Poll not found" } }, { status: 404 });
  }

  try {
    const poll = await withDbRetry(() =>
      db.poll.findUnique({
        where: { id },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            include: {
              _count: { select: { votes: true } },
            },
          },
          _count: { select: { votes: true } },
        },
      })
    );

    if (!poll || poll.status === "draft") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Poll not found" } }, { status: 404 });
    }

    const isExpired = poll.closesAt ? new Date(poll.closesAt) < new Date() : false;
    const effectiveStatus = isExpired ? "closed" : poll.status;
    const totalVotes = poll._count.votes;

    // Enforce the poll's results-visibility setting. "always" is the only mode
    // that is safe to cache publicly; personalised answers are no-store.
    let resultsVisible = true;
    let cacheControl = "public, s-maxage=30, stale-while-revalidate=60";
    if (poll.showResults === "after_close") {
      resultsVisible = effectiveStatus === "closed";
    } else if (poll.showResults === "after_vote") {
      const fp = voterFingerprint(req);
      const hasVoted = await withDbRetry(() =>
        db.pollVote.findFirst({ where: { pollId: poll.id, voterFingerprint: fp }, select: { id: true } })
      ).catch(() => null);
      resultsVisible = Boolean(hasVoted) || effectiveStatus === "closed";
      cacheControl = "private, no-store";
    }

    const formatted = {
      id: poll.id,
      question: poll.question,
      type: poll.type,
      status: effectiveStatus,
      allowAnonymous: poll.allowAnonymous,
      showResults: poll.showResults,
      closesAt: poll.closesAt,
      resultsVisible,
      totalVotes: resultsVisible ? totalVotes : null,
      options: poll.options.map((o) => ({
        id: o.id,
        label: o.label,
        sortOrder: o.sortOrder,
        votes: resultsVisible ? o._count.votes : null,
        percentage: resultsVisible && totalVotes > 0 ? Math.round((o._count.votes / totalVotes) * 100) : null,
      })),
    };

    return NextResponse.json(
      { data: formatted },
      { headers: { "Cache-Control": cacheControl } }
    );
  } catch (error: any) {
    console.error("GET /api/v1/polls/[id] error:", error);
    return NextResponse.json({ error: { code: "FETCH_FAILED", message: "Failed to fetch poll." } }, { status: 500 });
  }
}
