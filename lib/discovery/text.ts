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
