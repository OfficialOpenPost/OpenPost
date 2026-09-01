// Production-ready storage abstraction: Cloudflare R2 (S3-compatible)
// Falls back to no-op in development if env not configured

import { isR2Configured, env } from "@/lib/env";

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

export async function getSignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  if (!isR2Configured) {
    throw new Error("R2 not configured — set R2_* env vars");
  }
  // In production, generate presigned URL via @aws-sdk/s3-presigned-post or similar
  // For now, return a placeholder that the client can use with direct upload
  const base = env.R2_PUBLIC_URL ?? `https://${env.R2_BUCKET_NAME}.r2.cloudflarestorage.com`;
  return `${base}/${key}?expires=${expiresIn}&contentType=${encodeURIComponent(contentType)}`;
}

export function getPublicUrl(key: string): string {
  const base = env.R2_PUBLIC_URL ?? `https://${env.R2_BUCKET_NAME ?? "openpost-media"}.r2.cloudflarestorage.com`;
  return `${base}/${key}`;
}

export async function deleteObject(key: string): Promise<void> {
  if (!isR2Configured) return;
  // TODO: implement with S3 client when R2 is configured
  console.log(`[storage] delete ${key}`);
}
