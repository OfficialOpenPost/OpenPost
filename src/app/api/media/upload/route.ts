import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import crypto from "crypto";

function getS3Client() {
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!accessKeyId || !secretAccessKey || !endpoint) return null;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: { code: "NO_FILE", message: "No file provided" } }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: { code: "TOO_LARGE", message: "File exceeds 25MB limit" } }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const key = `openpost-media/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    const s3 = getS3Client();
    const bucket = process.env.R2_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
    let publicUrl = "";

    if (s3 && bucket) {
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: file.type || "application/octet-stream",
          })
        );
        const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || `https://${bucket}.r2.dev`;
        publicUrl = `${baseUrl.replace(/\/$/, "")}/${key}`;
      } catch (r2Err) {
        console.warn("R2 upload attempt failed, falling back to data URL:", r2Err);
      }
    }

    // If R2 wasn't configured or failed, fallback to Data URL for instant, seamless authoring
    if (!publicUrl) {
      const base64 = buffer.toString("base64");
      publicUrl = `data:${file.type || "image/jpeg"};base64,${base64}`;
    }

    // Register media in database
    let mediaRecord = null;
    try {
      const firstUser = await db.user.findFirst().catch(() => null);
      const userId = firstUser?.id ?? "00000000-0000-0000-0000-000000000000";

      mediaRecord = await db.media.create({
        data: {
          originalFilename: file.name,
          mimeType: file.type || "image/jpeg",
          sizeBytes: BigInt(file.size),
          checksum,
          uploadedBy: userId,
          variants: {
            publicUrl,
            key,
            webp: { url: publicUrl },
          },
          altTextDefault: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        },
      });
    } catch (dbErr) {
      console.warn("Could not save media record to DB:", dbErr);
    }

    return NextResponse.json({
      data: {
        id: mediaRecord?.id ?? crypto.randomUUID(),
        key,
        publicUrl,
        size: file.size,
        type: file.type,
        name: file.name,
      },
    });
  } catch (e: any) {
    console.error("Media upload error:", e);
    return NextResponse.json(
      { error: { code: "UPLOAD_FAILED", message: String(e.message ?? e) } },
      { status: 500 }
    );
  }
}
