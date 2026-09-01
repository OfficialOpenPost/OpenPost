import { NextRequest, NextResponse } from "next/server";

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
  const poll = MOCK_POLLS[id];
  if (!poll) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Poll not found" } }, { status: 404 });
  return NextResponse.json({ data: poll }, { headers: { "Cache-Control": "public, s-maxage=30" } });
}
