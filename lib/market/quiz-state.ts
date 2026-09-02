export function encodeQuizWeights(shares: Record<string, number>) {
  return Object.entries(shares)
    .map(([slug, value]) => `${slug}.${Math.round(value)}`)
    .join("_");
}

export function parseQuizWeights(
  value: string | undefined,
  slugs: string[],
) {
  if (!value) return null;
  const allowed = new Set(slugs);
  const out: Record<string, number> = {};
  for (const part of value.split("_")) {
    const dot = part.lastIndexOf(".");
    if (dot <= 0) continue;
    const slug = part.slice(0, dot);
    const n = Number(part.slice(dot + 1));
    if (!allowed.has(slug) || !Number.isFinite(n)) continue;
    out[slug] = Math.max(0, Math.min(100, n));
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function quizStorageKey(painId: string) {
  return `paingraphs:quiz:${painId}`;
}
