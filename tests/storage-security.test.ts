import { describe, it, expect } from "vitest";
import { validateMagicBytes, getPublicUrl } from "../src/lib/storage";

describe("Cloudflare R2 Storage Security & Magic Byte Validation", () => {
  it("validates valid PNG magic bytes (89 50 4E 47)", () => {
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateMagicBytes(validPngBuffer, "image/png")).toBe(true);

    const fakePng = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    expect(validateMagicBytes(fakePng, "image/png")).toBe(false);
  });

  it("validates valid JPEG magic bytes (FF D8 FF)", () => {
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(validateMagicBytes(validJpeg, "image/jpeg")).toBe(true);

    const fakeJpeg = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG disguised as JPEG
    expect(validateMagicBytes(fakeJpeg, "image/jpeg")).toBe(false);
  });

  it("validates valid WebP magic bytes (RIFF .... WEBP)", () => {
    const validWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // length
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(validateMagicBytes(validWebp, "image/webp")).toBe(true);

    const invalidWebp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20]);
    expect(validateMagicBytes(invalidWebp, "image/webp")).toBe(false);
  });

  it("validates valid GIF magic bytes (GIF8)", () => {
    const validGif = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(validateMagicBytes(validGif, "image/gif")).toBe(true);
  });

  it("validates valid PDF magic bytes (%PDF)", () => {
    const validPdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    expect(validateMagicBytes(validPdf, "application/pdf")).toBe(true);
  });

  it("blocks SVG containing script tags (XSS prevention)", () => {
    const safeSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>', "utf-8");
    expect(validateMagicBytes(safeSvg, "image/svg+xml")).toBe(true);

    const maliciousSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "utf-8");
    expect(validateMagicBytes(maliciousSvg, "image/svg+xml")).toBe(false);
  });

  it("generates correct public URL for stored assets", () => {
    const url = getPublicUrl("openpost-media/123-test.webp");
    expect(url).toContain("openpost-media/123-test.webp");
    expect(url.startsWith("http") || url.startsWith("/")).toBe(true);
  });
});
