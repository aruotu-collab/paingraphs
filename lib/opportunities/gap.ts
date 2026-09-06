import type {
  PainCriterion,
  PainGraphPage,
  RecommendedProduct,
} from "@/lib/paingraph/types";
import { visibleUnmetNeed } from "@/lib/paingraph/rank";

export type CriterionGap = {
  slug: string;
  name: string;
  detail: string;
  best: number;
  covered: boolean;
};

export type FounderGap = {
  unmetNeed: string | null;
  criteria: CriterionGap[];
  weakest: CriterionGap | null;
  productCount: number;
  usuallyFails: string[];
  tradeoffs: string[];
};

export function founderGapFromPage(page: PainGraphPage): FounderGap {
  return founderGap(page.criteria, page.products, page.consumer);
}

export function founderGap(
  criteria: PainCriterion[],
  products: RecommendedProduct[],
  consumer?: { usuallyFails?: string[]; tradeoffs?: string[] } | null,
): FounderGap {
  const rows: CriterionGap[] = criteria.map((item) => {
    const best =
      products.length === 0
        ? 0
        : Math.max(...products.map((product) => product.scores[item.slug] ?? 0));
    return {
      slug: item.slug,
      name: item.name,
      detail: item.detail,
      best,
      covered: best >= 70,
    };
  });
  const weakest = [...rows].sort((a, b) => a.best - b.best)[0] ?? null;
  return {
    unmetNeed: visibleUnmetNeed(criteria, products),
    criteria: rows.sort((a, b) => a.best - b.best),
    weakest,
    productCount: products.length,
    usuallyFails: consumer?.usuallyFails ?? [],
    tradeoffs: consumer?.tradeoffs ?? [],
  };
}
