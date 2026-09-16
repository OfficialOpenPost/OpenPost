import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requireProjectMember, AuthError, hasPermission, hasMinimumRole } from "@/lib/auth";
import { queryCache } from "@/lib/cache";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const projectId = searchParams.get("projectId") || req.headers.get("x-openpost-project");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let targetProjectId = projectId;
    if (!targetProjectId) {
      targetProjectId = user.memberships[0]?.projectId;
      if (!targetProjectId) return NextResponse.json({ data: [] });
    }

    await requireProjectMember(targetProjectId, "CONTRIBUTOR");

    const where: any = {
      projectId: targetProjectId,
    };
    if (search) {
      where.AND = [
        { projectId: targetProjectId },
        {
          OR: [
            { originalFilename: { contains: search, mode: "insensitive" } },
            { altTextDefault: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
      delete where.projectId;
    }

    const [data, total] = await Promise.all([
      withDbRetry(() =>
        db.media.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          select: { id: true, originalFilename: true, mimeType: true, sizeBytes: true, width: true, height: true, variants: true, altTextDefault: true, createdAt: true, projectId: true } as never,
        })
      ),
      withDbRetry(() => db.media.count({ where })),
    ]);

    const withUrl = (data as any[]).map((m) => ({
      ...m,
      sizeBytes: m.sizeBytes ? Number(m.sizeBytes) : m.sizeBytes,
      sizeBytesRaw: m.sizeBytes ? m.sizeBytes.toString() : null,
      url: (m.variants as any)?.publicUrl ?? (m.variants as any)?.webp?.url ?? null,
      name: m.originalFilename,
      size: m.sizeBytes ? `${(Number(m.sizeBytes) / 1024).toFixed(1)} KB` : "-",
      dimensions: m.width && m.height ? `${m.width}×${m.height}` : "-",
    }));

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
    return NextResponse.json({ data: withUsage, total, hasMore: offset + limit < total });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    console.error("GET /api/media error", error);
    return NextResponse.json({ error: { code: "FETCH_FAILED", message: "Failed to fetch media." } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApprovedUser();
    const body = await req.json().catch(() => ({}));
    const { originalFilename, mimeType, sizeBytes, width, height, key: clientKey, publicUrl: clientPublicUrl, checksum: clientChecksum, altTextDefault, projectId } = body as any;

    if (!originalFilename || !mimeType) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Missing required fields: originalFilename, mimeType" } }, { status: 400 });
    }

    // Resolve project
    let targetProjectId: string | null = projectId || req.headers.get("x-openpost-project");
    if (!targetProjectId) {
      const first = user.memberships[0]?.projectId;
      targetProjectId = first || null;
    }
    if (!targetProjectId) {
      return NextResponse.json({ error: { code: "PROJECT_REQUIRED", message: "Project ID required for media upload." } }, { status: 400 });
    }

    await requireProjectMember(targetProjectId, "CONTRIBUTOR");
    // Check media upload permission
    const member = user.memberships.find((m) => m.projectId === targetProjectId);
    if (member && !hasPermission(member.role, "media.upload") && !hasPermission(member.role, "media.create")) {
      throw new AuthError("You do not have permission to upload media.", 403, "FORBIDDEN");
    }

    // Server-side key generation — ignore client-supplied key to prevent path traversal / cross-project overwrite
    const ext = (originalFilename.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = `openpost-media/${targetProjectId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    // Server should compute checksum itself; client checksum is untrusted, ignore and generate placeholder that will be replaced on real upload flow
    // For this metadata endpoint (used by direct presigned flow), we accept client checksum but hash it or generate server-side if missing
    const checksum = clientChecksum && typeof clientChecksum === "string" && /^[a-f0-9]{64}$/i.test(clientChecksum)
      ? clientChecksum.toLowerCase()
      : crypto.createHash("sha256").update(`${originalFilename}:${Date.now()}:${crypto.randomUUID()}`).digest("hex");

    // Validate mime allowlist
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","image/svg+xml","image/avif","application/pdf","video/mp4"];
    if (!allowed.includes(mimeType.toLowerCase())) {
      return NextResponse.json({ error: { code: "INVALID_TYPE", message: `Unsupported media type ${mimeType}` } }, { status: 400 });
    }

    const publicUrl = clientPublicUrl || `/${key}`;

    const variants: any = { publicUrl, key };
    if (mimeType === "image/webp") {
      variants.webp = { url: publicUrl, key, size: sizeBytes };
    }

    // Ensure uploadedBy exists in users table (legacy FK) — if not, fallback to first profile but keep with profile id? Use user.id directly, ensure user row exists
    let uploadedById = user.id;
    try {
      const exists = await withDbRetry(() => db.user.findUnique({ where: { id: user.id } as never }).catch(() => null));
      if (!exists) {
        // Try to create corresponding user row for FK integrity (or use existing first user as fallback)
        await withDbRetry(() => db.user.create({ data: { id: user.id, email: user.email, name: user.displayName || user.email.split("@")[0], passwordHash: "", role: member?.role as any || "CONTRIBUTOR" } as never }).catch(() => {}));
      }
    } catch {}

    const media: any = await withDbRetry(() =>
      db.media.create({
        data: {
          originalFilename,
          mimeType,
          sizeBytes: BigInt(sizeBytes ?? 0) as never,
          width: width ?? null,
          height: height ?? null,
          variants,
          altTextDefault: altTextDefault ?? null,
          checksum,
          uploadedBy: uploadedById,
          projectId: targetProjectId,
        } as never,
      })
    );

    const serialized = { ...media, sizeBytes: media.sizeBytes ? Number(media.sizeBytes) : media.sizeBytes };
    queryCache.invalidate("dashboard:");
    return NextResponse.json({ data: serialized }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    console.error("POST /api/media error", error);
    return NextResponse.json({ error: { code: "DB_ERROR", message: String(error) } }, { status: 500 });
  }
}
