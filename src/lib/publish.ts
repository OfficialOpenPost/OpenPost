export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

export function readingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}
