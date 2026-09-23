import {
  concernName,
  defaultProfile,
  rankMatches,
} from "@/lib/paingraph/match";
import { visibleUnmetNeed } from "@/lib/paingraph/rank";
import type {
  PainCriterion,
  PainGraphPage,
  RecommendedProduct,
} from "@/lib/paingraph/types";
import { dealBreakerGaps } from "./match-lens";

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
  dealBreakers: { slug: string; name: string }[];
  surviving: { name: string; match: number }[];
};

export function founderGapFromPage(page: PainGraphPage): FounderGap {
  return founderGap(page.criteria, page.products, page.consumer, page);
}

export function founderGap(
  criteria: PainCriterion[],
  products: RecommendedProduct[],
  consumer?: { usuallyFails?: string[]; tradeoffs?: string[] } | null,
  page?: PainGraphPage,
): FounderGap {
  const rows: CriterionGap[] = criteria.map((item) => {
    const best =
      products.length === 0
        ? 0
        : Math.max(...products.map((product) => product.scores[item.slug] ?? 0));
    return {
      slug: item.slug,
      name: concernName(item),
      detail: item.detail,
      best,
      covered: best >= 70,
    };
  });
  const weakest = [...rows].sort((a, b) => a.best - b.best)[0] ?? null;
  const slugs = criteria.map((item) => item.slug);
  const ranked = rankMatches(products, criteria, defaultProfile(slugs));
  const dealBreakers = page ? dealBreakerGaps(page) : [];
  const unmetNeed =
    dealBreakers.length > 0
      ? `If ${dealBreakers.map((item) => item.name.toLowerCase()).join(" or ")} is a deal breaker, no current kind survives.`
      : visibleUnmetNeed(criteria, products);
  return {
    unmetNeed,
    criteria: rows.sort((a, b) => a.best - b.best),
    weakest,
    productCount: products.length,
    usuallyFails: consumer?.usuallyFails ?? [],
    tradeoffs: consumer?.tradeoffs ?? [],
    dealBreakers,
    surviving: ranked
      .filter((item) => !item.blocked)
      .map((item) => ({ name: item.name, match: item.match })),
  };
}
