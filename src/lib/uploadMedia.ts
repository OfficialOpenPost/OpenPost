"use client";

import { convertToWebP } from "./imageConvert";

export async function uploadImageWithWebP(file: File): Promise<{ url: string; key: string; webpFile: File }> {
  const webpFile = await convertToWebP(file, 0.82);
  const presignRes = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: webpFile.name, contentType: webpFile.type || "image/webp", size: webpFile.size }),
  });
  const presignJson = await presignRes.json();
  if (!presignRes.ok) throw new Error(presignJson.error?.message ?? "Presign failed");
  const { url, fields, key, publicUrl } = presignJson.data as { url: string; fields: Record<string, string>; key: string; publicUrl: string };
  // Mock presign (R2 not configured) — skip R2 upload, use local blob URL for DB
  const isMock = url === "/api/media/mock-upload" || !url || url.includes("mock-upload");
  let finalPublicUrl = publicUrl;
  if (isMock) {
    try { finalPublicUrl = URL.createObjectURL(webpFile); } catch { finalPublicUrl = publicUrl; }
  } else {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, v as string));
    form.append("file", webpFile);
    try {
      const upRes = await fetch(url, { method: "POST", body: form });
      if (!upRes.ok) throw new Error("R2 upload failed");
    } catch (e: any) {
      console.warn("R2 upload failed, using fallback", e);
      try { finalPublicUrl = URL.createObjectURL(webpFile); } catch {}
    }
  }

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
