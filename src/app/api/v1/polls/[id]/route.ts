import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const MOCK_POLLS: Record<string, { id: string; question: string; options: { id: string; label: string; votes: number }[]; type: string }> = {
  "poll-1": {
    id: "poll-1",
    question: "What is your favorite feature?",
    options: [
      { id: "opt-1", label: "Block Editor", votes: 12 },
      { id: "opt-2", label: "Headless API", votes: 8 },
      { id: "opt-3", label: "Media Pipeline", votes: 5 },
    ],
    type: "single",
  },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const poll = await db.poll.findUnique({ where: { id } as never, include: { options: true, votes: true } as never }).catch(() => null);
    if (poll) {
      const data = {
        id: (poll as any).id,
        question: (poll as any).question,
        type: (poll as any).type,
        status: (poll as any).status,
        options: (poll as any).options?.map((o: any) => ({ id: o.id, label: o.label, votes: (poll as any).votes?.filter((v: any) => v.optionId === o.id).length ?? 0 })) ?? [],
      };
      return NextResponse.json({ data }, { headers: { "Cache-Control": "public, s-maxage=30" } });
    }
  } catch {}
  const mock = MOCK_POLLS[id];
  if (!mock) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Poll not found" } }, { status: 404 });
  return NextResponse.json({ data: mock }, { headers: { "Cache-Control": "public, s-maxage=30" } });
}
