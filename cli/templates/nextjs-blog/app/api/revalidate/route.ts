import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.REVALIDATION_SECRET;
    const authHeader = req.headers.get("x-openpost-signature") || req.headers.get("authorization");

    if (secret && authHeader !== secret) {
      return NextResponse.json({ error: "Unauthorized revalidation request" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { event, payload } = body;

    // Invalidate global post tag
    try {
      (revalidateTag as any)("openpost-posts");
      (revalidateTag as any)("openpost-content");
    } catch {
      // Fallback for cache environments
    }

    // Invalidate specific slug path if provided
    if (payload?.slug) {
      revalidatePath(`/${payload.slug}`);
      revalidatePath(`/blog/${payload.slug}`);
    }
    revalidatePath("/blog");
    revalidatePath("/");

    return NextResponse.json({ revalidated: true, event, now: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ error: "Revalidation failed", message: err.message }, { status: 500 });
  }
}
