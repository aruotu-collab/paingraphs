import type { PainCriterion, RecommendedProduct } from "./types";

export type BoardRow = {
  slug: string;
  name: string;
  detail: string;
  spread: number;
  values: { productId: string; score: number }[];
};

export function boardRows(
  criteria: PainCriterion[],
  products: RecommendedProduct[],
  limit = 3,
): BoardRow[] {
  if (criteria.length === 0 || products.length === 0) return [];
  const rows = criteria.map((item) => {
    const values = products.map((product) => ({
      productId: product.id,
      score: product.scores[item.slug] ?? 0,
    }));
    const scores = values.map((row) => row.score);
    return {
      slug: item.slug,
      name: item.name,
      detail: item.detail,
      spread: Math.max(...scores) - Math.min(...scores),
      values,
    };
  });
  const ranked = [...rows].sort((left, right) => right.spread - left.spread);
  const withSpread = ranked.filter((row) => row.spread > 0);
  const pool = withSpread.length > 0 ? withSpread : rows;
  const primary = pool.find((row) => row.slug === criteria[0]?.slug);
  const rest = pool.filter((row) => row.slug !== primary?.slug);
  return [primary, ...rest]
    .filter((row): row is BoardRow => Boolean(row))
    .slice(0, Math.min(limit, pool.length));
}

export function boardLeadJob(rows: BoardRow[], fallback: PainCriterion | undefined) {
  return fallback?.name || rows[0]?.name || null;
}
