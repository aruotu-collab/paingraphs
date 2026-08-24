const STOP = new Set([
  "the",
  "a",
  "an",
  "in",
  "for",
  "and",
  "of",
  "to",
  "is",
  "it",
  "on",
  "at",
  "by",
  "or",
  "as",
  "be",
  "with",
  "from",
  "that",
  "this",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "not",
  "but",
  "you",
  "your",
  "we",
  "our",
  "my",
  "me",
  "i",
  "do",
  "does",
  "did",
  "can",
  "any",
  "how",
  "what",
  "which",
  "who",
  "ask",
  "hn",
  "looking",
]);

export function decodeEntities(value: string) {
  return value
    .replace(/<p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/^ask hn:\s*/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "pain";
}

export function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP.has(word)),
  );
}

export function overlap(a: string, b: string) {
  const left = tokens(a);
  const right = tokens(b);
  if (left.size === 0 || right.size === 0) return 0;
  let inter = 0;
  for (const word of left) if (right.has(word)) inter += 1;
  return inter / Math.min(left.size, right.size);
}

export function clip(value: string, max = 4000) {
  return value.length <= max ? value : `${value.slice(0, max).trim()}…`;
}

export function firstSentences(value: string, count = 2) {
  const parts = decodeEntities(value)
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  return parts.slice(0, count).join(" ").trim();
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
