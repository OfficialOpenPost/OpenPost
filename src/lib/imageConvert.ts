"use client";

// Browser-based WebP converter — runs entirely client-side via <canvas>, no server sharp needed.
// Converts any image/* File to image/webp before upload to R2. Non-images pass through.

export async function convertToWebP(file: File, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/webp") return file;
  // SVG should not be converted (keep vector)
  if (file.type === "image/svg+xml") return file;

  try {
    const bitmap = await loadImageBitmap(file);
    if (!bitmap) return file;
    const { width, height } = bitmap;
    // Cap huge images to 4096 to avoid canvas OOM (preserves aspect)
    const max = 4096;
    let w = width, h = height;
    if (w > max || h > max) {
      const scale = Math.min(max / w, max / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // White background for images with transparency flattening? Keep transparent for WebP (WebP supports alpha) — just draw
    ctx.drawImage(bitmap as any, 0, 0, w, h);
    if (typeof (bitmap as any).close === "function") (bitmap as any).close();

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", quality));
    if (!blob) return file;

    const webpName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], webpName, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}

async function loadImageBitmap(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  // Prefer createImageBitmap (fast, off-main-thread where available)
  try {
    if (typeof createImageBitmap === "function") {
      const bmp = await createImageBitmap(file);
      return bmp as unknown as ImageBitmap;
    }
  } catch {}
  // Fallback via <img>
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
