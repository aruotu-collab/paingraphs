import type { PainPage, Priorities } from "./types";

export function normalizePriorities(raw: FormData | Priorities, slugs: string[]) {
  const priorities: Priorities = {};
  let total = 0;
  for (const slug of slugs) {
    const value =
      raw instanceof FormData
        ? Number(raw.get(`priority-${slug}`) || 0)
        : Number(raw[slug] || 0);
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
    priorities[slug] = safe;
    total += safe;
  }
  if (total <= 0) {
    const even = 100 / Math.max(slugs.length, 1);
    for (const slug of slugs) priorities[slug] = even;
    return priorities;
  }
  for (const slug of slugs) {
    priorities[slug] = Math.round((priorities[slug] / total) * 100);
  }
  return priorities;
}

export function rankProducts(
  products: PainPage["products"],
  priorities: Priorities,
): PainPage["products"] {
  return products
    .map((product) => {
      let weighted = 0;
      let weight = 0;
      for (const [slug, share] of Object.entries(priorities)) {
        const score = product.scores[slug];
        if (score == null) continue;
        weighted += score * share;
        weight += share;
      }
      return {
        ...product,
        match: weight ? Math.round(weighted / weight) : product.match,
      };
    })
    .sort((a, b) => b.match - a.match);
}
