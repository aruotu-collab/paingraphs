import type {
  PainCriterion,
  PainGraphPage,
  Priorities,
  RecommendedProduct,
} from "./types";

export function normalizePriorities(
  raw: Priorities | FormData,
  slugs: string[],
): Priorities {
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
  products: RecommendedProduct[],
  priorities: Priorities,
): RecommendedProduct[] {
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

export function focusWeights(slugs: string[], targets: string[]): Priorities {
  const wanted = targets.filter((slug) => slugs.includes(slug));
  if (wanted.length === 0) return normalizePriorities({}, slugs);
  const set = new Set(wanted);
  const rest = slugs.filter((slug) => !set.has(slug));
  const primary = Math.round(70 / Math.max(wanted.length, 1));
  const other = Math.round(30 / Math.max(rest.length, 1));
  return Object.fromEntries(
    slugs.map((slug) => [slug, set.has(slug) ? primary : other]),
  ) as Priorities;
}

export function presetsFor(slugs: string[]): { id: string; label: string; weights: Priorities }[] {
  const even = Object.fromEntries(
    slugs.map((slug) => [slug, Math.round(100 / Math.max(slugs.length, 1))]),
  ) as Priorities;

  const presets: { id: string; label: string; weights: Priorities }[] = [];
  const comfort = slugs.filter((slug) => /clamp|weight|heat|comfort/.test(slug));
  if (comfort.length > 0) {
    presets.push({ id: "comfort", label: "Maximum comfort", weights: focusWeights(slugs, comfort) });
  }
  const value = slugs.find((slug) => /price|budget|value/.test(slug));
  if (value) {
    presets.push({ id: "value", label: "Best value", weights: focusWeights(slugs, [value]) });
  }
  const sound = slugs.find((slug) => /sound|isolat|audio/.test(slug));
  if (sound) {
    presets.push({ id: "sound", label: "Best sound", weights: focusWeights(slugs, [sound]) });
  }
  presets.push({ id: "balanced", label: "Balanced", weights: even });
  return presets;
}

export function productAttributes(
  product: RecommendedProduct,
  criteria: PainCriterion[],
) {
  const rows = criteria
    .map((item) => ({ name: item.name, score: product.scores[item.slug] ?? 0 }))
    .sort((a, b) => b.score - a.score);
  return {
    strengths: rows.filter((row) => row.score >= 70).slice(0, 2),
    drawbacks: rows.filter((row) => row.score < 55).slice(0, 2),
  };
}

export function visibleUnmetNeed(
  criteria: PainCriterion[],
  products: RecommendedProduct[],
) {
  if (products.length === 0) return null;
  const comfort = criteria.filter((item) =>
    /clamp|weight|heat|comfort/.test(item.slug),
  );
  const sound = criteria.filter((item) => /sound|isolat|audio/.test(item.slug));
  if (comfort[0] && sound[0]) {
    const both = products.some((product) => {
      const comfortOk = comfort.every((item) => (product.scores[item.slug] ?? 0) >= 70);
      const soundOk = sound.every((item) => (product.scores[item.slug] ?? 0) >= 70);
      return comfortOk && soundOk;
    });
    if (!both) {
      return `No option yet that is strong on both ${comfort[0].name.toLowerCase()} and ${sound[0].name.toLowerCase()}.`;
    }
  }
  const weakest = criteria
    .map((item) => ({
      name: item.name,
      best: Math.max(...products.map((product) => product.scores[item.slug] ?? 0)),
    }))
    .sort((a, b) => a.best - b.best)[0];
  if (weakest && weakest.best < 70) {
    return `No strong option yet for ${weakest.name.toLowerCase()}.`;
  }
  return null;
}

export function applyPriorities(page: PainGraphPage, priorities: Priorities): PainGraphPage {
  return {
    ...page,
    products: rankProducts(page.products, priorities),
  };
}

export function comparisonRows(
  products: RecommendedProduct[],
  criteria: PainCriterion[],
) {
  return [
    {
      key: "match",
      name: "Match",
      values: products.map((product) => product.match),
    },
    ...criteria.map((item) => ({
      key: item.slug,
      name: item.name,
      values: products.map((product) => product.scores[item.slug] ?? 0),
    })),
  ];
}

export function rankingReasons(
  products: RecommendedProduct[],
  criteria: PainCriterion[],
  priorities: Priorities,
) {
  const [best, next] = rankProducts(products, priorities);
  if (!best || !next) return [];
  return criteria
    .map((item) => {
      const weight = priorities[item.slug] ?? 0;
      const bestScore = best.scores[item.slug] ?? 0;
      const nextScore = next.scores[item.slug] ?? 0;
      return {
        name: item.name,
        weight,
        bestName: best.name,
        nextName: next.name,
        bestScore,
        nextScore,
        delta: bestScore - nextScore,
      };
    })
    .filter((row) => row.weight > 0 && row.delta > 0)
    .sort(
      (a, b) => Math.abs(b.delta) * b.weight - Math.abs(a.delta) * a.weight,
    )
    .slice(0, 3);
}
