import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    // Check redirects first (slug changed)
    const redirect = await db.redirect.findFirst({ where: { oldSlug: slug } });
    if (redirect) {
      return NextResponse.json({ data: null, redirect: redirect.newSlug }, { status: 301, headers: { Location: `/api/v1/posts/${redirect.newSlug}` } });
    }

    const post = await db.blog.findFirst({ where: { slug, status: "published" } });
    if (!post) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Post not found" } }, { status: 404 });
    }

    return NextResponse.json(
      { data: post },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          ETag: `"${slug}-v1"`,
        },
      }
    );
  } catch {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Post not found" } }, { status: 404 });
  }
}
