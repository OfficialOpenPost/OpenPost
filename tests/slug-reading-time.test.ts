import { describe, it, expect } from "vitest";
import { countWords, readingTime } from "../src/lib/publish";
import { slugify } from "../src/lib/slug";

describe("Content Publishing Metrics & Slug Sanitization", () => {
  it("computes accurate word counts from plain text and JSON strings", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("Hello world from OpenPost CMS")).toBe(5);

    const jsonDoc = JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "First paragraph here." }] },
        { type: "paragraph", content: [{ type: "text", text: "Second paragraph with more words." }] },
      ],
    });
    expect(countWords(jsonDoc)).toBeGreaterThanOrEqual(7);
  });

  it("calculates estimated reading time accurately", () => {
    expect(readingTime(0)).toBe(1);
    expect(readingTime(100)).toBe(1);
    expect(readingTime(400)).toBe(2); // 400 words / 200 WPM = 2 min
    expect(readingTime(1000)).toBe(5); // 1000 words / 200 WPM = 5 min
  });

  it("sanitizes slugs and normalizes special characters", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(slugify("How to Deploy Next.js on Cloudflare")).toBe("how-to-deploy-nextjs-on-cloudflare");
    expect(slugify("  Special --- Characters @# & 2026  ")).toBe("special-characters-2026");
    expect(slugify("Café & Résumé")).toBe("cafe-resume");
  });
});
