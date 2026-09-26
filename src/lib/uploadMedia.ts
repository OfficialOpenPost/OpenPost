"use client";

import { convertToWebP } from "./imageConvert";

export async function uploadImageWithWebP(file: File, projectId?: string): Promise<{ url: string; key: string; webpFile: File }> {
  const activeProjId = projectId || (typeof window !== "undefined" ? localStorage.getItem("openpost_active_project_id") : null);
  const webpFile = await convertToWebP(file, 0.82);

  // Measure dimensions BEFORE upload so the single server call stores everything
  let width: number | null = null;
  let height: number | null = null;
  try {
    if (webpFile.type.startsWith("image/")) {
      const bmp = await createImageBitmap(webpFile).catch(() => null);
      if (bmp) {
        width = (bmp as ImageBitmap).width;
        height = (bmp as ImageBitmap).height;
        (bmp as ImageBitmap).close?.();
      }
    }
  } catch {}

  // Upload via server (avoids CORS + presign 501) — server does S3 PutObject
  // directly and creates the media row in ONE request. Do not add a second
  // POST to /api/media here — that created duplicate media rows.
  const form = new FormData();
  form.append("file", webpFile);
  if (activeProjId) form.append("projectId", activeProjId);
  if (width != null) form.append("width", String(width));
  if (height != null) form.append("height", String(height));
  const headers: Record<string, string> = activeProjId ? { "X-OpenPost-Project": activeProjId } : {};
  const upRes = await fetch("/api/media/upload", { method: "POST", body: form, headers });
  const upJson = await upRes.json().catch(() => ({}));
  if (!upRes.ok) throw new Error(upJson.error?.message ?? "Upload failed");
  const { key, publicUrl } = upJson.data as { key: string; publicUrl: string };

  return { url: publicUrl, key, webpFile };
}
