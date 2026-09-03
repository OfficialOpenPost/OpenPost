import { NextRequest, NextResponse } from "next/server";
import { getPosts } from "@/lib/openpost";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();

  if (!q) {
    return NextResponse.json({ posts: [] });
  }

  try {
    const { posts } = await getPosts({ limit: 50 });
    const filtered = posts.filter((post) => {
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchExcerpt = (post.seo?.description || "").toLowerCase().includes(q);
      const matchCategory = (post.category?.name || "").toLowerCase().includes(q);
      const matchAuthor = post.authors?.some((a) => a.name.toLowerCase().includes(q));
      const matchTag = post.tags?.some((t) => t.name.toLowerCase().includes(q));
      return matchTitle || matchExcerpt || matchCategory || matchAuthor || matchTag;
    });

    return NextResponse.json({ posts: filtered.slice(0, 8) });
  } catch (err: any) {
    return NextResponse.json({ posts: [], error: err.message }, { status: 500 });
  }
}
