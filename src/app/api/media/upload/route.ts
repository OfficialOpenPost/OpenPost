import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requirePermission, createAuditLog, AuthError } from "@/lib/auth";
import { uploadBuffer, getPublicUrl, validateMagicBytes } from "@/lib/storage";
import { triggerWebhooks } from "@/lib/webhooks";
import crypto from "crypto";

const allowedMimes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
  "video/mp4",
];

export async function POST(req: NextRequest) {
  try {
    const user = await requireApprovedUser();

    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Multipart form data required." } }, { status: 400 });
    }

    const file = form.get("file") as File | null;
    const projectId = (form.get("projectId") as string) || undefined;

    if (projectId) {
      await requirePermission(projectId, "media.upload");
    }

    if (!file) {
      return NextResponse.json({ error: { code: "NO_FILE", message: "No file provided for upload." } }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: { code: "TOO_LARGE", message: "File exceeds 25MB maximum limit." } }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    if (!allowedMimes.includes(mimeType.toLowerCase())) {
      return NextResponse.json(
        { error: { code: "INVALID_TYPE", message: `Unsupported media format: ${mimeType}` } },
        { status: 400 }
      );
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // Validate magic bytes against MIME type (SSRF / Polyglot prevention)
    if (!validateMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: { code: "INVALID_PAYLOAD", message: "File header magic bytes do not match declared MIME type." } },
        { status: 400 }
      );
    }

    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = `openpost-media/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    // Upload to Cloudflare R2
    let publicUrl = "";
    try {
      const uploadResult = await uploadBuffer(key, buffer, mimeType);
      publicUrl = uploadResult.url;
    } catch (storageErr) {
      console.warn("Direct R2 upload failed, falling back to data URL for dev preview:", storageErr);
      const base64 = buffer.toString("base64");
      publicUrl = `data:${mimeType};base64,${base64}`;
    }

    // Save media record to DB
    const mediaRecord = await withDbRetry(() =>
      db.media.create({
        data: {
          originalFilename: file.name,
          mimeType,
          sizeBytes: BigInt(file.size),
          checksum,
          uploadedBy: user.id,
          projectId: projectId || null,
          variants: {
            publicUrl,
            key,
            webp: { url: publicUrl },
          },
          altTextDefault: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        },
      })
    );

    await createAuditLog({
      actorId: user.id,
      projectId,
      action: "media.uploaded",
      targetId: mediaRecord.id,
      metadata: { filename: file.name, size: file.size, mimeType },
    });

    if (projectId) {
      triggerWebhooks({
        projectId,
        event: "media.uploaded",
        payload: { id: mediaRecord.id, filename: file.name, size: file.size, mimeType, url: publicUrl },
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        data: {
          id: mediaRecord.id,
          key,
          publicUrl,
          size: file.size,
          type: mimeType,
          name: file.name,
          projectId: mediaRecord.projectId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "UPLOAD_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Media upload failed." } }, { status });
  }
}
