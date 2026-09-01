import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isR2Configured, env } from "@/lib/env";

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

let cachedS3Client: S3Client | null = null;

export function getS3Client(): S3Client | null {
  if (cachedS3Client) return cachedS3Client;

  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const endpoint = env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    return null;
  }

  cachedS3Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  return cachedS3Client;
}

export function getPublicUrl(key: string): string {
  const base = env.R2_PUBLIC_URL || (env.R2_BUCKET_NAME ? `https://${env.R2_BUCKET_NAME}.r2.dev` : "");
  if (!base) return `/${key}`;
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

export async function getSignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  const s3 = getS3Client();
  const bucket = env.R2_BUCKET_NAME;

  if (!s3 || !bucket) {
    throw new Error("Cloudflare R2 storage credentials are not configured in environment.");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3, command, { expiresIn });
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
  const s3 = getS3Client();
  const bucket = env.R2_BUCKET_NAME;

  if (!s3 || !bucket) {
    throw new Error("Cloudflare R2 storage credentials are not configured in environment.");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    url: getPublicUrl(key),
    key,
    size: buffer.length,
  };
}

export async function deleteObject(key: string): Promise<void> {
  const s3 = getS3Client();
  const bucket = env.R2_BUCKET_NAME;

  if (!s3 || !bucket) {
    return;
  }

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (err) {
    console.error(`[storage] Failed to delete object ${key} from R2:`, err);
  }
}

/**
 * Validates file buffer magic bytes against declared MIME type to prevent polyglot / executable upload attacks.
 */
export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  const mime = mimeType.toLowerCase();

  // JPEG: FF D8 FF
  if (mime === "image/jpeg" || mime === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 (0x89 'PNG')
  if (mime === "image/png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // GIF: 47 49 46 38 ('GIF8')
  if (mime === "image/gif") {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    );
  }

  // WebP: RIFF ... WEBP (52 49 46 46 .... 57 45 42 50)
  if (mime === "image/webp") {
    if (buffer.length < 12) return false;
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // PDF: 25 50 44 46 ('%PDF')
  if (mime === "application/pdf") {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // SVG: text/xml containing <svg
  if (mime === "image/svg+xml") {
    const text = buffer.slice(0, 1024).toString("utf-8").toLowerCase();
    return text.includes("<svg") && !text.includes("<script");
  }

  // AVIF: ....ftypavif
  if (mime === "image/avif") {
    if (buffer.length < 12) return false;
    const brand = buffer.slice(4, 12).toString("ascii");
    return brand.includes("ftypavif") || brand.includes("ftypavis") || brand.includes("ftypmif1");
  }

  // MP4: ....ftyp
  if (mime === "video/mp4") {
    if (buffer.length < 8) return false;
    const brand = buffer.slice(4, 8).toString("ascii");
    return brand === "ftyp";
  }

  return true;
}
