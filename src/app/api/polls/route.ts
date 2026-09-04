import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, AuthError } from "@/lib/auth";
import { resolveProjectContext } from "@/lib/apiToken";

export async function GET(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const projectContext = await resolveProjectContext(req);
    const projectId = projectContext?.projectId;

    if (!projectId) {
      return NextResponse.json(
        { error: { code: "PROJECT_REQUIRED", message: "Project context required" } },
        { status: 400 }
      );
    }

    await requireProjectMember(projectId);

    const polls = await withDbRetry(() =>
      db.poll.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            include: {
              _count: { select: { votes: true } },
            },
          },
          blog: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
            },
          },
          _count: { select: { votes: true } },
        },
      })
    );

    const formatted = polls.map((p) => {
      const totalVotes = p._count.votes;
      const isExpired = p.closesAt ? new Date(p.closesAt) < new Date() : false;
      const effectiveStatus = isExpired ? "closed" : p.status;

      return {
        id: p.id,
        question: p.question,
        type: p.type,
        status: effectiveStatus,
        allowAnonymous: p.allowAnonymous,
        showResults: p.showResults,
        closesAt: p.closesAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        blogId: p.blogId,
        blog: p.blog,
        totalVotes,
        options: p.options.map((opt) => ({
          id: opt.id,
          label: opt.label,
          sortOrder: opt.sortOrder,
          votes: opt._count.votes,
          percentage: totalVotes > 0 ? Math.round((opt._count.votes / totalVotes) * 100) : 0,
        })),
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/polls error:", error);
    return NextResponse.json(
      { error: { code: "FETCH_FAILED", message: "Failed to fetch polls." } },
      { status: 500 }
    );
  }
}
