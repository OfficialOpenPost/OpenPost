import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Poll ID required" } }, { status: 400 });
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

    const formatted = {
      id: poll.id,
      question: poll.question,
      type: poll.type,
      status: effectiveStatus,
      allowAnonymous: poll.allowAnonymous,
      showResults: poll.showResults,
      closesAt: poll.closesAt,
      totalVotes: poll._count.votes,
      options: poll.options.map((o) => ({
        id: o.id,
        label: o.label,
        sortOrder: o.sortOrder,
        votes: o._count.votes,
      })),
    };

    return NextResponse.json(
      { data: formatted },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error: any) {
    console.error("GET /api/v1/polls/[id] error:", error);
    return NextResponse.json({ error: { code: "FETCH_FAILED", message: "Failed to fetch poll." } }, { status: 500 });
  }
}
