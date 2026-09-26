export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

/** Count words in a Tiptap/ProseMirror JSON document (text nodes only). */
export function countDocWords(doc: unknown): number {
  let count = 0;
  const walk = (n: unknown) => {
    if (!n) return;
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (typeof n !== "object") return;
    const node = n as { type?: unknown; text?: unknown; content?: unknown };
    if (node.type === "text" && typeof node.text === "string") {
      count += node.text.split(/\s+/).filter(Boolean).length;
    }
    if (node.content) walk(node.content);
  };
  walk(doc);
  return count;
}

/** Word count for any stored content shape (JSON doc, HTML or plain text). */
export function countContentWords(content: unknown): number {
  if (content && typeof content === "object" && (content as { type?: unknown }).type === "doc") {
    return countDocWords(content);
  }
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && parsed.type === "doc") return countDocWords(parsed);
    } catch {
      return countWords(content);
    }
    return countWords(content);
  }
  return countWords(JSON.stringify(content ?? ""));
}

export function readingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}
