import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/lib/db";
import { requireApprovedUser, requirePermission, createAuditLog, AuthError } from "@/lib/auth";
import { getS3Client, deleteObject, getPublicUrl, validateMagicBytes } from "@/lib/storage";
import { triggerWebhooks } from "@/lib/webhooks";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import crypto from "crypto";

const allowedConfirmMimes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
  "video/mp4",
];

export async function POST(req: NextRequest) {
  try {
    const user = await requireApprovedUser();

    const body = await req.json().catch(() => ({}));
    const { key, projectId, originalFilename, mimeType, sizeBytes, width, height, altTextDefault } = body as {
      key?: string;
      projectId?: string;
      originalFilename?: string;
      mimeType?: string;
      sizeBytes?: number;
      width?: number;
      height?: number;
      altTextDefault?: string;
    };

    if (!projectId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "projectId is required." } },
        { status: 400 }
      );
    }

    await requirePermission(projectId, "media.upload");

    if (!key || typeof key !== "string" || key.includes("..") || !key.startsWith("openpost-media/")) {
      return NextResponse.json(
        { error: { code: "INVALID_KEY", message: "Invalid or malicious storage key." } },
        { status: 400 }
      );
    }

    if (!originalFilename || !mimeType) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "originalFilename and mimeType are required." } },
        { status: 400 }
      );
    }

    const normalizedMime = mimeType.toLowerCase();
    if (!allowedConfirmMimes.includes(normalizedMime)) {
      await deleteObject(key).catch(() => {});
      return NextResponse.json(
        { error: { code: "INVALID_TYPE", message: `Unsupported media format for presigned upload: ${mimeType}` } },
        { status: 400 }
      );
    }

    const s3 = getS3Client();
    const bucket = env.R2_BUCKET_NAME;

    let actualSizeBytes = sizeBytes || 0;

    // Verify object magic bytes from R2 if S3 is configured
    if (s3 && bucket) {
      try {
        const getCmd = new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          Range: "bytes=0-2048",
        });
        const res = await s3.send(getCmd);
        const stream = res.Body;

        if (!stream) {
          throw new Error("Empty response body from storage.");
        }

        // Convert stream to Buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        if (!validateMagicBytes(buffer, normalizedMime)) {
          await deleteObject(key);
          return NextResponse.json(
            { error: { code: "INVALID_PAYLOAD", message: "Uploaded file magic bytes do not match declared MIME type." } },
            { status: 400 }
          );
        }

        if (res.ContentRange) {
          const match = res.ContentRange.match(/\/(\d+)$/);
          if (match) actualSizeBytes = parseInt(match[1], 10);
        }
      } catch (err: any) {
        if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
          return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Uploaded object not found in storage." } },
            { status: 404 }
          );
        }
        console.warn("[confirm-upload] S3 verification error:", err);
      }
    }

    const publicUrl = getPublicUrl(key);
    const checksum = crypto.createHash("sha256").update(`${key}:${Date.now()}:${crypto.randomUUID()}`).digest("hex");

    const mediaRecord = await withDbRetry(() =>
      db.media.create({
        data: {
          originalFilename,
          mimeType: normalizedMime,
          sizeBytes: BigInt(actualSizeBytes),
          width: width ?? null,
          height: height ?? null,
          checksum,
          uploadedBy: user.id,
          projectId,
          variants: {
            publicUrl,
            key,
            webp: normalizedMime === "image/webp" ? { url: publicUrl } : undefined,
          },
          altTextDefault: altTextDefault || originalFilename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        },
      })
    );

    await createAuditLog({
      actorId: user.id,
      projectId,
      action: "media.uploaded",
      targetId: mediaRecord.id,
      metadata: { filename: originalFilename, size: actualSizeBytes, mimeType: normalizedMime, key },
    });

    triggerWebhooks({
      projectId,
      event: "media.uploaded",
      payload: { id: mediaRecord.id, filename: originalFilename, size: actualSizeBytes, mimeType: normalizedMime, url: publicUrl },
    }).catch(() => {});

    return NextResponse.json(
      {
        data: {
          id: mediaRecord.id,
          key,
          publicUrl,
          size: actualSizeBytes,
          type: normalizedMime,
          name: originalFilename,
          projectId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error instanceof AuthError ? error.statusCode : 500;
    const code = error instanceof AuthError ? error.code : "CONFIRM_FAILED";
    return NextResponse.json({ error: { code, message: error.message || "Failed to confirm upload." } }, { status });
  }
}
