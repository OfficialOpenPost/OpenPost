import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

function getS3Client() {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await (supabase as any)?.auth.getUser() ?? { data: { user: null } };
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });

  const isR2 = Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
  if (!isR2) return NextResponse.json({ error: { code: "R2_NOT_CONFIGURED" } }, { status: 500 });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: { code: "NO_FILE" } }, { status: 400 });
    if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: { code: "TOO_LARGE" } }, { status: 400 });

    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
    const key = `Openpost-images/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const bucket = process.env.R2_BUCKET_NAME!;
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    const s3 = getS3Client();
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ data: { key, publicUrl, size: file.size, type: file.type } });
  } catch (e: any) {
    console.error("R2 upload error", e);
    return NextResponse.json({ error: { code: "UPLOAD_FAILED", message: String(e.message ?? e) } }, { status: 500 });
  }
}
