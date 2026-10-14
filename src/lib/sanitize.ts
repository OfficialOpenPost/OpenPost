/**
 * Output-encoding / URL / HTML sanitisation helpers.
 *
 * These are the single place where untrusted values are turned into markup.
 * Keep them conservative: default-deny.
 */

/* ------------------------------------------------------------------ *
 * 1. JSON embedded inside <script> (JSON-LD, __NEXT_DATA__, etc.)
 * ------------------------------------------------------------------ */

/**
 * `JSON.stringify` does NOT escape `<`, so a value containing `</script>` would
 * terminate the surrounding <script> element and allow arbitrary JS injection.
 * Escaping `<`, `>` and `&` as unicode escapes keeps the JSON valid while making
 * a tag break-out impossible. U+2028/2029 are escaped because they are literal
 * line terminators in JavaScript source.
 */
export function serializeJsonForScript(value: unknown): string {
  const json = JSON.stringify(value ?? null);
  if (typeof json !== "string") return "null";
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/* ------------------------------------------------------------------ *
 * 2. URLs
 * ------------------------------------------------------------------ */

const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:", "ftp:"]);

/**
 * Returns a safe URL or `null`.
 *
 * Blocks `javascript:`, `data:` (except explicitly permitted image data URIs),
 * `vbscript:`, `file:` and any scheme obfuscated with control characters or
 * embedded whitespace (`java\tscript:`, `java\nscript:` …).
 */
export function sanitizeUrl(
  raw: unknown,
  opts: { allowRelative?: boolean; allowDataImage?: boolean } = {}
): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;

  // Strip control characters and whitespace used to smuggle a scheme past filters.
  const stripped = value.replace(/[\u0000-\u0020\u007f\u00a0\u200b-\u200f\u2028\u2029\ufeff]/g, "");
  const lower = stripped.toLowerCase();

  if (lower.startsWith("javascript:") || lower.startsWith("vbscript:") || lower.startsWith("file:")) {
    return null;
  }
  if (lower.startsWith("data:")) {
    if (!opts.allowDataImage) return null;
    if (!/^data:image\/(png|jpe?g|gif|webp|avif|bmp);base64,[a-z0-9+/=\s]+$/i.test(stripped)) return null;
    return value;
  }

  // Scheme-relative / protocol-relative
  if (value.startsWith("//")) return null;

  // Relative URL (same-origin path, query or hash)
  if (opts.allowRelative !== false && /^[./#?]/.test(value) && !/^\/\//.test(value)) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (!SAFE_URL_SCHEMES.has(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    // Not parseable as an absolute URL → treat as a relative path if allowed.
    if (opts.allowRelative !== false && /^[a-z0-9._~-]+(?:[/?#].*)?$/i.test(value)) return value;
    return null;
  }
}

/** Convenience: safe href or "#". */
export function safeHref(raw: unknown): string {
  return sanitizeUrl(raw) ?? "#";
}

/* ------------------------------------------------------------------ *
 * 3. Embedded video hosts
 * ------------------------------------------------------------------ */

const VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
  "www.vimeo.com",
]);

/** Strict host allow-list for `<iframe src>` — never a substring check. */
export function isTrustedVideoEmbed(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const url = sanitizeUrl(raw, { allowRelative: false });
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return VIDEO_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Extract a YouTube video id from common URL shapes; null when untrusted. */
export function youtubeVideoId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const url = sanitizeUrl(raw, { allowRelative: false });
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = parsed.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{6,20}$/.test(v)) return v;
      const m = parsed.pathname.match(/\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{6,20})/);
      if (m) return m[1];
    }
  } catch {
    /* fall through */
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * 4. Legacy HTML strings
 * ------------------------------------------------------------------ */

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

// Elements dropped *together with their contents* — their text is script-active.
const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "object", "embed", "applet", "form", "select",
  "textarea", "option", "template", "noscript", "svg", "math", "frame",
  "frameset", "base", "link", "meta", "title", "head",
]);

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "span", "div", "section", "article", "header", "footer",
  "main", "aside", "nav", "figure", "figcaption", "blockquote", "pre", "code",
  "kbd", "samp", "var", "abbr", "address", "cite", "q", "del", "ins", "mark",
  "small", "strong", "b", "em", "i", "u", "s", "sub", "sup", "time",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "dl", "dt", "dd",
  "a", "img", "picture", "source", "video", "audio", "track",
  "table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td",
]);

// Per-tag attribute allow-list. Anything not listed is dropped.
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  source: new Set(["src", "srcset", "type", "media"]),
  video: new Set(["src", "poster", "controls", "width", "height", "loop", "muted", "preload"]),
  audio: new Set(["src", "controls", "loop", "muted", "preload"]),
  track: new Set(["src", "kind", "srclang", "label", "default"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  col: new Set(["span"]),
  colgroup: new Set(["span"]),
  ol: new Set(["start", "type", "reversed"]),
  li: new Set(["value"]),
  time: new Set(["datetime"]),
  "*": new Set(["class", "id", "title", "lang", "dir"]),
};

const URL_ATTRS = new Set(["href", "src", "poster", "srcset"]);

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeSrcset(value: string): string | null {
  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
  const kept: string[] = [];
  for (const part of parts) {
    const [url, ...rest] = part.split(/\s+/);
    const safe = sanitizeUrl(url, { allowRelative: true });
    if (safe) kept.push([safe, ...rest].join(" "));
  }
  return kept.length ? kept.join(", ") : null;
}

const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/**
 * Allow-list HTML sanitiser for legacy string content.
 *
 * Everything not explicitly permitted is dropped; all text and attribute values
 * are re-encoded on output. This is intentionally default-deny — the primary
 * defence is that the blog API only accepts structured editor documents, this
 * exists purely as defence-in-depth for rows written before that rule.
 */
export function sanitizeHtml(input: unknown): string {
  if (typeof input !== "string" || !input) return "";

  const out: string[] = [];
  const open: string[] = [];
  let i = 0;

  const closeUntil = (tag: string) => {
    const idx = open.lastIndexOf(tag);
    if (idx === -1) return;
    for (let k = open.length - 1; k >= idx; k--) out.push(`</${open[k]}>`);
    open.length = idx;
  };

  while (i < input.length) {
    const lt = input.indexOf("<", i);

    if (lt === -1) {
      out.push(escapeText(input.slice(i)));
      break;
    }
    if (lt > i) out.push(escapeText(input.slice(i, lt)));

    // Comments / doctype / CDATA — always dropped
    if (input.startsWith("<!--", lt)) {
      const end = input.indexOf("-->", lt + 4);
      i = end === -1 ? input.length : end + 3;
      continue;
    }
    if (input.startsWith("<!", lt) || input.startsWith("<?", lt)) {
      const end = input.indexOf(">", lt + 2);
      i = end === -1 ? input.length : end + 1;
      continue;
    }

    const gt = input.indexOf(">", lt);
    if (gt === -1) {
      out.push(escapeText(input.slice(lt)));
      break;
    }

    const rawTag: string = input.slice(lt + 1, gt);
    const isClosing: boolean = rawTag.startsWith("/");
    const body: string = isClosing ? rawTag.slice(1) : rawTag;
    const nameMatch: RegExpMatchArray | null = body.match(/^\s*([a-zA-Z][a-zA-Z0-9]*)/);

    if (!nameMatch) {
      out.push(escapeText(input.slice(lt, gt + 1)));
      i = gt + 1;
      continue;
    }

    const tag: string = nameMatch[1].toLowerCase();

    if (DROP_WITH_CONTENT.has(tag)) {
      if (isClosing) {
        i = gt + 1;
        continue;
      }
      // Skip through the matching close tag (nesting-aware for same tag name)
      let depth = 1;
      let cursor = gt + 1;
      const openRe = new RegExp(`<\\s*${tag}\\b[^>]*>`, "gi");
      const closeRe = new RegExp(`<\\s*/\\s*${tag}\\s*>`, "gi");
      while (cursor < input.length && depth > 0) {
        openRe.lastIndex = cursor;
        closeRe.lastIndex = cursor;
        const o = openRe.exec(input);
        const c = closeRe.exec(input);
        if (!c) {
          cursor = input.length;
          break;
        }
        if (o && o.index < c.index) {
          depth++;
          cursor = o.index + o[0].length;
        } else {
          depth--;
          cursor = c.index + c[0].length;
        }
      }
      i = cursor;
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      // Unknown/disallowed element: drop the tag itself, keep its text content.
      i = gt + 1;
      continue;
    }

    if (isClosing) {
      if (open.includes(tag)) closeUntil(tag);
      i = gt + 1;
      continue;
    }

    // Parse attributes
    const attrsSource = body.slice(nameMatch[0].length);
    const allowed = ALLOWED_ATTRS[tag];
    const starAllowed = ALLOWED_ATTRS["*"];
    const attrs: string[] = [];
    let m: RegExpExecArray | null;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(attrsSource)) !== null) {
      const attrName = m[1].toLowerCase();
      const rawValue = m[3] ?? m[4] ?? m[5] ?? "";
      if (attrName.startsWith("on")) continue; // event handlers
      if (attrName === "style") continue; // CSS can carry url()/expression()
      if (!(allowed?.has(attrName) || starAllowed?.has(attrName))) continue;

      if (attrName === "srcset") {
        const safe = sanitizeSrcset(rawValue);
        if (safe) attrs.push(`srcset="${escapeAttr(safe)}"`);
        continue;
      }
      if (URL_ATTRS.has(attrName)) {
        const safe = sanitizeUrl(rawValue, { allowRelative: true, allowDataImage: attrName === "src" });
        if (!safe) continue;
        attrs.push(`${attrName}="${escapeAttr(safe)}"`);
        continue;
      }
      if (attrName === "target") {
        // only the safe rel-target combo
        attrs.push('target="_blank"');
        continue;
      }
      attrs.push(`${attrName}="${escapeAttr(rawValue)}"`);
    }

    if (tag === "a" && attrs.some((a) => a.startsWith('target="_blank"'))) {
      attrs.push('rel="noopener noreferrer nofollow"');
    }

    const selfClosing = VOID_TAGS.has(tag) || rawTag.endsWith("/");
    out.push(`<${tag}${attrs.length ? " " + attrs.join(" ") : ""}${selfClosing ? " />" : ">"}`);
    if (!selfClosing) open.push(tag);

    i = gt + 1;
  }

  while (open.length) out.push(`</${open.pop()!}>`);
  return out.join("");
}

/* ------------------------------------------------------------------ *
 * 5. Structured content validation
 * ------------------------------------------------------------------ */

export const MAX_CONTENT_CHARS = 5_000_000;

/**
 * Normalises the `content` column: must be a Tiptap-style document object or a
 * legacy HTML string. Anything else (arrays, numbers, null prototypes …) is
 * rejected so it can never reach a rendering sink.
 */
export function normalizePostContent(value: unknown): { ok: true; value: unknown } | { ok: false; reason: string } {
  if (value === undefined || value === null) return { ok: true, value: {} };
  if (typeof value === "string") {
    if (value.length > MAX_CONTENT_CHARS) return { ok: false, reason: "Content too large." };
    return { ok: true, value };
  }
  if (typeof value !== "object") return { ok: false, reason: "Unsupported content format." };
  if (Array.isArray(value)) return { ok: false, reason: "Unsupported content format." };
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return { ok: false, reason: "Unsupported content format." };

  const json = JSON.stringify(value);
  if (json === undefined) return { ok: false, reason: "Unsupported content format." };
  if (json.length > MAX_CONTENT_CHARS) return { ok: false, reason: "Content too large." };
  return { ok: true, value };
}
