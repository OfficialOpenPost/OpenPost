import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, AuthError } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Poll ID is required" } },
        { status: 400 }
      );
    }

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
          votes: {
            take: 50,
            orderBy: { votedAt: "desc" },
            select: {
              id: true,
              optionId: true,
              votedAt: true,
              voterFingerprint: true,
            },
          },
          blog: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          _count: { select: { votes: true } },
        },
      })
    );

    if (!poll) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Poll not found" } },
        { status: 404 }
      );
    }

    if (poll.projectId) {
      await requireProjectMember(poll.projectId);
    }

    const totalVotes = poll._count.votes;
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
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      blogId: poll.blogId,
      blog: poll.blog,
      totalVotes,
      options: poll.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        sortOrder: opt.sortOrder,
        votes: opt._count.votes,
        percentage: totalVotes > 0 ? Math.round((opt._count.votes / totalVotes) * 100) : 0,
      })),
      recentVotes: poll.votes.map((v) => ({
        id: v.id,
        optionId: v.optionId,
        votedAt: v.votedAt,
        voterPreview: v.voterFingerprint
          ? `${v.voterFingerprint.slice(0, 4)}...${v.voterFingerprint.slice(-4)}`
          : "Anonymous",
      })),
    };

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/polls/[id] error:", error);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch poll" } },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Poll ID is required" } },
        { status: 400 }
      );
    }

    // Check if id is a UUID (database poll)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      // If it's a client temporary ID like `poll_1740...`, nothing in DB to delete
      return NextResponse.json({ data: { success: true, id, message: "Client poll cleared" } });
    }

    const poll = await withDbRetry(() =>
      db.poll.findUnique({
        where: { id },
        select: { id: true, projectId: true },
      })
    );

    if (!poll) {
      return NextResponse.json({ data: { success: true, id, message: "Poll not found or already deleted" } });
    }

    if (poll.projectId) {
      await requireProjectMember(poll.projectId);
    }

    // Delete poll (Prisma cascading relation deletes options and votes automatically)
    await withDbRetry(async () => {
      await db.pollVote.deleteMany({ where: { pollId: id } }).catch(() => {});
      await db.pollOption.deleteMany({ where: { pollId: id } }).catch(() => {});
      await db.poll.delete({ where: { id } });
    });

    return NextResponse.json({ data: { success: true, id, message: "Poll permanently deleted from database" } });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("DELETE /api/polls/[id] error:", error);
    return NextResponse.json(
      { error: { code: "DELETE_FAILED", message: "Failed to delete poll from database" } },
      { status: 500 }
    );
  }
}
