import { parseProfile, type PainProfile } from "./match";

export function encodeProfile(profile: PainProfile, slugs: string[]) {
  return slugs
    .map((slug) => `${slug}:${profile.importances[slug] ?? 0}`)
    .join(",");
}

export function decodeProfile(
  raw: string | null | undefined,
  slugs: string[],
): PainProfile | null {
  if (!raw || slugs.length === 0) return null;
  const importances: Record<string, number> = {};
  for (const part of raw.split(",")) {
    const [slug, value] = part.split(":");
    if (!slug || !slugs.includes(slug)) continue;
    importances[slug] = Number(value);
  }
  if (Object.keys(importances).length === 0) return null;
  return parseProfile({ importances, breakers: [] }, slugs);
}

export function matchHref(href: string, profile: PainProfile, slugs: string[]) {
  const encoded = encodeProfile(profile, slugs);
  const [path] = href.split("?");
  return `${path}?m=${encodeURIComponent(encoded)}`;
}
