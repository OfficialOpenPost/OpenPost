import { describe, it, expect } from "vitest";
import {
  serializeJsonForScript,
  sanitizeUrl,
  safeHref,
  sanitizeHtml,
  isTrustedVideoEmbed,
  youtubeVideoId,
} from "../src/lib/sanitize";

describe("serializeJsonForScript — JSON-LD / <script> break-out prevention", () => {
  it("escapes </script> so a value cannot terminate the surrounding script tag", () => {
    const json = serializeJsonForScript({ title: '</script><script>alert(1)</script>' });
    expect(json).not.toContain("</script>");
    expect(json).not.toContain("<");
    expect(json).toContain("\\u003c");
  });

  it("escapes < > & and U+2028/U+2029 line terminators", () => {
    const json = serializeJsonForScript({ s: "a<b>c&d\u2028e\u2029f" });
    expect(json).not.toContain("<");
    expect(json).not.toContain(">");
    expect(json).not.toContain("&");
    expect(json).not.toContain("\u2028");
    expect(json).not.toContain("\u2029");
  });

  it("still produces parseable JSON", () => {
    const value = { a: 1, b: "</script>", c: [1, 2, 3] };
    expect(JSON.parse(serializeJsonForScript(value))).toEqual(value);
  });

  it("handles null/undefined safely", () => {
    expect(serializeJsonForScript(undefined)).toBe("null");
    expect(serializeJsonForScript(null)).toBe("null");
  });
});

describe("sanitizeUrl — scheme filtering", () => {
  it("blocks javascript: and obfuscated variants", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("JaVaScRiPt:alert(1)")).toBeNull();
    expect(sanitizeUrl("java\tscript:alert(1)")).toBeNull();
    expect(sanitizeUrl("java\nscript:alert(1)")).toBeNull();
    expect(sanitizeUrl(" javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBeNull();
    expect(sanitizeUrl("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
    expect(sanitizeUrl("file:///etc/passwd")).toBeNull();
  });

  it("blocks protocol-relative URLs (//evil.com)", () => {
    expect(sanitizeUrl("//evil.com")).toBeNull();
  });

  it("allows http(s), mailtel and relative paths", () => {
    expect(sanitizeUrl("https://example.com/a")).toContain("https://example.com");
    expect(sanitizeUrl("http://example.com")).toContain("http://example.com");
    expect(sanitizeUrl("mailto:a@b.com")).toContain("mailto:");
    expect(sanitizeUrl("/blog/hello")).toBe("/blog/hello");
    expect(sanitizeUrl("#section")).toBe("#section");
  });

  it("only allows safe data:image URIs when explicitly opted in", () => {
    expect(sanitizeUrl("data:image/png;base64,iVBORw0KGgo=")).toBeNull();
    const ok = sanitizeUrl("data:image/png;base64,iVBORw0KGgo=", { allowDataImage: true });
    expect(ok).toContain("data:image/png");
    expect(
      sanitizeUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", { allowDataImage: true })
    ).toBeNull();
  });

  it("safeHref never returns an unsafe scheme", () => {
    expect(safeHref("javascript:alert(1)")).toBe("#");
    expect(safeHref("https://ok.com")).toContain("https://ok.com");
  });
});

describe("isTrustedVideoEmbed / youtubeVideoId", () => {
  it("accepts only known video hosts", () => {
    expect(isTrustedVideoEmbed("https://www.youtube.com/embed/abc")).toBe(true);
    expect(isTrustedVideoEmbed("https://player.vimeo.com/video/123")).toBe(true);
    expect(isTrustedVideoEmbed("https://evil.com/embed/abc")).toBe(false);
    expect(isTrustedVideoEmbed("https://youtube.com.evil.com/embed/abc")).toBe(false);
  });

  it("extracts only canonical 11-char video ids", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    // Path traversal / injection attempts are rejected
    expect(youtubeVideoId("https://youtu.be/../../evil")).toBeNull();
    expect(youtubeVideoId("https://youtu.be/abc")).toBeNull();
  });
});

describe("sanitizeHtml — allow-list sanitiser for legacy string content", () => {
  it("drops script/style/iframe entirely including contents", () => {
    const out = sanitizeHtml('<p>hi</p><script>alert(1)</script><style>body{}</style><iframe src=x></iframe>');
    expect(out).toContain("<p>hi</p>");
    expect(out).not.toContain("script");
    expect(out).not.toContain("alert");
    expect(out).not.toContain("iframe");
  });

  it("strips event handlers and javascript: hrefs", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)" onclick="alert(2)">x</a>');
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("onclick");
    expect(out).toContain(">x</a>");
  });

  it("removes unknown tags but keeps their text", () => {
    const out = sanitizeHtml("<custom-tag>text</custom-tag>");
    expect(out).not.toContain("<custom-tag");
    expect(out).toContain("text");
  });

  it("neutralises attribute break-outs (quote can never terminate the attribute)", () => {
    // The &quot; inside alt must be re-encoded so it stays literal text and
    // cannot close the attribute and start a new onerror= attribute.
    const out = sanitizeHtml('<img src="x" alt="a&quot; onerror=&quot;alert(1)">');
    expect(out).not.toContain("&quot; onerror"); // no raw breakout sequence
    expect(out).not.toMatch(/"\s+onerror\s*=/); // no real onerror attribute
    // It IS fine for "onerror" to appear as escaped text inside the value.
    expect(out).toContain("alt=");
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml(123 as unknown as string)).toBe("");
  });
});
