import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, requirePermission, AuthError } from "@/lib/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve the owning project of a poll. Polls created through the editor always
 * carry a `projectId`; legacy rows may only have `blogId`, so fall back to the
 * blog's project. Returns null when the poll cannot be tied to a project — in
 * that case callers must deny (never allow unauthenticated access).
 */
async function resolvePollProjectId(poll: { projectId: string | null; blogId: string | null }): Promise<string | null> {
  if (poll.projectId) return poll.projectId;
  const blogId = poll.blogId;
  if (blogId) {
    const blog = await withDbRetry(() =>
      db.blog.findUnique({ where: { id: blogId }, select: { projectId: true } })
    ).catch(() => null);
    return blog?.projectId || null;
  }
  return null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SECURITY: every poll is project-scoped. Authenticate first, then verify
    // membership against the owning project — a missing/null projectId used to
    // skip authorisation entirely, letting anonymous callers read any poll.
    await requireApprovedUser();

    const { id } = await params;
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Poll not found" } },
        { status: 404 }
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

    // Membership check happens BEFORE any data is returned.
    const projectId = await resolvePollProjectId(poll);
    if (!projectId) {
      // Orphaned poll with no tenant — treat as non-existent.
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Poll not found" } },
        { status: 404 }
      );
    }
    await requireProjectMember(projectId);

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
    // SECURITY: destructive operation — authenticate + require `poll.delete`
    // (EDITOR or above) on the owning project. Previously this had NO auth at
    // all when projectId was null, and only a weak membership check otherwise.
    await requireApprovedUser();

    const { id } = await params;
    if (!id || !UUID_RE.test(id)) {
      // Client temporary IDs like `poll_1740...` — nothing in DB to delete.
      return NextResponse.json({ data: { success: true, id, message: "Client poll cleared" } });
    }

    const poll = await withDbRetry(() =>
      db.poll.findUnique({
        where: { id },
        select: { id: true, projectId: true, blogId: true },
      })
    ).catch(() => null);

    if (!poll) {
      return NextResponse.json({ data: { success: true, id, message: "Poll not found or already deleted" } });
    }

    const projectId = await resolvePollProjectId(poll);
    if (!projectId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Poll not found" } },
        { status: 404 }
      );
    }
    await requirePermission(projectId, "poll.delete");

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
