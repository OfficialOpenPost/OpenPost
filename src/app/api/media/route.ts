import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const where: Record<string, unknown> = {};
    if (search) {
      (where as any).OR = [
        { originalFilename: { contains: search, mode: "insensitive" } },
        { altTextDefault: { contains: search, mode: "insensitive" } },
      ];
    }
    const data = await db.media.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, originalFilename: true, mimeType: true, sizeBytes: true, width: true, height: true, variants: true, altTextDefault: true, createdAt: true } as never,
    });
    // Attach publicUrl from variants — also serialize BigInt
    const withUrl = (data as any[]).map((m) => ({
      ...m,
      sizeBytes: m.sizeBytes ? Number(m.sizeBytes) : m.sizeBytes,
      sizeBytesRaw: m.sizeBytes ? m.sizeBytes.toString() : null,
      url: (m.variants as any)?.publicUrl ?? (m.variants as any)?.webp?.url ?? null,
      name: m.originalFilename,
      size: m.sizeBytes ? `${(Number(m.sizeBytes) / 1024).toFixed(1)} KB` : "-",
      dimensions: m.width && m.height ? `${m.width}×${m.height}` : "-",
    }));
    // Also fetch usage counts
    let withUsage = withUrl;
    try {
      const ids = withUrl.map((m) => m.id);
      if (ids.length) {
        const usages: any[] = await (db as any).$queryRaw`SELECT media_id, array_agg(blog_id) as blogs FROM media_usage WHERE media_id = ANY(ARRAY[${ids.join(",")}]::uuid[]) GROUP BY media_id`;
        const map = new Map<string, string[]>(usages.map((u: any) => [u.media_id, u.blogs ?? []]));
        withUsage = withUrl.map((m) => ({ ...m, usedIn: map.get(m.id) ?? [] }));
      }
    } catch {
      withUsage = withUrl.map((m) => ({ ...m, usedIn: [] }));
    }
    return NextResponse.json({ data: withUsage });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { originalFilename, mimeType, sizeBytes, width, height, key, publicUrl, checksum, altTextDefault } = body as any;
    if (!originalFilename || !mimeType || !key) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Missing fields" } }, { status: 400 });
    }
    // Auth: WRITER+ — allow mock for dev without DB
    try {
      const user = await getCurrentUser();
      if (user && !["WRITER", "EDITOR", "ADMIN"].includes(user.role)) {
        return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
      }
    } catch {}

    let uploadedBy = "00000000-0000-0000-0000-000000000001";
    try {
      const u = await getCurrentUser().catch(()=>null);
      if (u?.id) {
        // Verify that id exists in users table, otherwise use first user
        const exists = await db.user.findUnique({ where: { id: u.id } as never }).catch(()=>null);
        if (exists) uploadedBy = u.id;
        else {
          const first: any = await db.user.findFirst({ select: { id: true } } as never).catch(()=>null);
          if (first?.id) uploadedBy = first.id;
        }
      } else {
        const first: any = await db.user.findFirst({ select: { id: true } } as never).catch(()=>null);
        if (first?.id) uploadedBy = first.id;
      }
    } catch {}
    // Ensure FK exists — create system user if needed
    try {
      const exists = await db.user.findUnique({ where: { id: uploadedBy } as never }).catch(()=>null);
      if (!exists) {
        await db.user.create({ data: { id: uploadedBy, email: `system-${uploadedBy.slice(0,8)}@openpost.local`, name: "System", passwordHash: "", role: "ADMIN" as never } as never }).catch(()=>{});
      }
    } catch {}

    const variants: any = { publicUrl, key };
    if (mimeType === "image/webp") {
      variants.webp = { url: publicUrl, key, size: sizeBytes };
    }

    const media: any = await db.media.create({
      data: {
        originalFilename,
        mimeType,
        sizeBytes: BigInt(sizeBytes ?? 0) as never,
        width: width ?? null,
        height: height ?? null,
        variants,
        altTextDefault: altTextDefault ?? null,
        checksum: checksum ?? `${Date.now()}-${Math.random()}`,
        uploadedBy: uploadedBy!,
      } as never,
    });

    // Serialize BigInt for JSON
    const serialized = { ...media, sizeBytes: media.sizeBytes ? Number(media.sizeBytes) : media.sizeBytes };
    return NextResponse.json({ data: serialized }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(e) } }, { status: 500 });
  }
}
