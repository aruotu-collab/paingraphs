export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "pain";
}

export function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}

export function overlapScore(left: string, right: string) {
  const a = tokens(left);
  const b = tokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared += 1;
  }
  return shared / Math.max(a.size, b.size);
}

const STOP = new Set([
  "the",
  "and",
  "for",
  "you",
  "that",
  "this",
  "with",
  "have",
  "from",
  "was",
  "are",
  "but",
  "they",
  "their",
  "just",
  "about",
]);

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function contentTokenList(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

export function contentOverlap(left: string, right: string) {
  const a = new Set(contentTokenList(left));
  const b = new Set(contentTokenList(right));
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared += 1;
  }
  return shared / Math.max(a.size, b.size);
}

export function phraseOverlap(left: string, right: string) {
  const grams = (value: string) => {
    const list = contentTokenList(value);
    const set = new Set<string>();
    if (list.length === 0) return set;
    if (list.length < 3) {
      set.add(list.join(" "));
      return set;
    }
    for (let i = 0; i <= list.length - 3; i += 1) {
      set.add(list.slice(i, i + 3).join(" "));
    }
    return set;
  };
  const a = grams(left);
  const b = grams(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const gram of a) {
    if (b.has(gram)) shared += 1;
  }
  return shared / Math.max(a.size, b.size);
}

export function similarity(left: string, right: string) {
  return Math.max(
    overlapScore(left, right),
    contentOverlap(left, right),
    phraseOverlap(left, right),
  );
}

export function fingerprint(value: string) {
  return [...new Set(contentTokenList(value))].sort().join(" ").slice(0, 280);
}

export function clip(value: string, max = 4000) {
  return value.trim().slice(0, max);
}

export function optionalText(value: FormDataEntryValue | null, max = 400) {
  if (typeof value !== "string") return null;
  const text = clip(value, max);
  return text || null;
}

export function optionalScore(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, number));
}
