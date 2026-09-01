"use client";

import { convertToWebP } from "./imageConvert";

export async function uploadImageWithWebP(file: File): Promise<{ url: string; key: string; webpFile: File }> {
  const webpFile = await convertToWebP(file, 0.82);
  // Upload via server (avoids CORS + presign 501) — server does S3 PutObject directly
  const form = new FormData();
  form.append("file", webpFile);
  const upRes = await fetch("/api/media/upload", { method: "POST", body: form });
  const upJson = await upRes.json().catch(()=>({}));
  if (!upRes.ok) throw new Error(upJson.error?.message ?? "Upload failed");
  const { key, publicUrl } = upJson.data as { key: string; publicUrl: string };
  const finalPublicUrl = publicUrl;

  // Save metadata (fire-and-forget, don't block insertion if DB fails)
  let width: number | null = null, height: number | null = null;
  try {
    if (webpFile.type.startsWith("image/")) {
      const bmp = await createImageBitmap(webpFile).catch(() => null);
      if (bmp) { width = (bmp as any).width; height = (bmp as any).height; (bmp as any).close?.(); }
    }
  } catch {}
  fetch("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalFilename: webpFile.name, mimeType: webpFile.type, sizeBytes: webpFile.size, width, height, key, publicUrl: finalPublicUrl, checksum: `${Date.now()}-${webpFile.name}` }),
  }).catch(() => {});

  return { url: publicUrl, key, webpFile };
}
