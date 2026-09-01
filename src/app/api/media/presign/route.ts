import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import crypto from "crypto";

function getS3Client() {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function POST(req: NextRequest) {
  // Auth: must be logged in, at least WRITER
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase as any)?.auth.getUser() ?? { data: { user: null } };
  if (!user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { filename, contentType, size } = body as { filename?: string; contentType?: string; size?: number };

  // Validate server-side (never trust client) — after browser WebP conversion, almost everything is image/webp, but allow originals + svg for passthrough
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif", "application/pdf", "video/mp4"];
  if (!contentType || !allowedTypes.includes(contentType)) {
    return NextResponse.json({ error: { code: "INVALID_TYPE", message: "Unsupported file type: " + contentType } }, { status: 400 });
  }
  if (!size || size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: { code: "TOO_LARGE", message: "Max 25MB" } }, { status: 400 });
  }
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: { code: "INVALID_NAME", message: "Invalid filename" } }, { status: 400 });
  }

  const ext = filename.split(".").pop() ?? "bin";
  const key = `media/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const s3 = getS3Client();
  const bucket = process.env.R2_BUCKET_NAME!;

  const post = await createPresignedPost(s3, {
    Bucket: bucket,
    Key: key,
    Conditions: [
      ["content-length-range", 1, 25 * 1024 * 1024],
      ["starts-with", "$Content-Type", "image/"],
    ],
    Fields: { "Content-Type": contentType },
    Expires: 60, // 60 seconds
  });

  return NextResponse.json({ data: { url: post.url, fields: post.fields, key, publicUrl: `${process.env.R2_PUBLIC_URL}/${key}` } });
}
