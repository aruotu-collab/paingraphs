import type { MarketPain } from "@/lib/market/types";

export type MonetizationRoute = "affiliate" | "founder" | "hybrid" | "watch";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** How strong the problem is, before money. */
export function demandScore(pain: MarketPain) {
  const evidence = Math.min(100, pain.evidenceCount * 6);
  const trend = Math.min(100, Math.max(0, pain.trend) * 1.6);
  return clamp(
    pain.painScore * 0.34 +
      pain.intentScore * 0.26 +
      evidence * 0.14 +
      trend * 0.14 +
      pain.organicScore * 0.12,
  );
}

export function underservedScore(pain: MarketPain) {
  return clamp(
    pain.painScore * 0.28 +
      pain.productGap * 0.36 +
      (100 - pain.competitionScore) * 0.36,
  );
}

export function monetizationRoute(pain: MarketPain): MonetizationRoute {
  if (pain.affiliateScore >= 70 && pain.productGap >= 65) return "hybrid";
  if (pain.affiliateScore >= 70) return "affiliate";
  if (pain.productGap >= 65) return "founder";
  return "watch";
}

/** Practical sort key: demand worth monetizing. */
export function painToMoneyScore(pain: MarketPain) {
  const demand = demandScore(pain);
  return clamp(
    demand * 0.4 +
      pain.affiliateScore * 0.3 +
      (100 - pain.competitionScore) * 0.18 +
      pain.intentScore * 0.12,
  );
}

export function moneyScoreForOffer(input: {
  productFit: number;
  pain: Pick<MarketPain, "intentScore" | "affiliateScore" | "competitionScore">;
  gravity?: number | null;
  commissionAmount?: string | null;
  recurring?: boolean;
}) {
  const payout = parsePayout(input.commissionAmount);
  const gravity = Math.min(100, (input.gravity ?? 20) * 2);
  const recurring = input.recurring ? 12 : 0;
  return clamp(
    input.productFit * 0.32 +
      input.pain.intentScore * 0.18 +
      input.pain.affiliateScore * 0.14 +
      payout * 0.16 +
      gravity * 0.1 +
      recurring +
      (100 - input.pain.competitionScore) * 0.1,
  );
}

export function performanceScoreForOffer(input: {
  gravity?: number | null;
  commissionAmount?: string | null;
  recurring?: boolean;
}) {
  const payout = parsePayout(input.commissionAmount);
  const gravity = Math.min(100, (input.gravity ?? 10) * 2.2);
  return clamp(gravity * 0.55 + payout * 0.35 + (input.recurring ? 15 : 0));
}

function parsePayout(raw?: string | null) {
  if (!raw) return 40;
  const num = Number(String(raw).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return 40;
  if (num <= 1) return clamp(num * 100);
  return clamp(20 + Math.min(num, 200) / 2);
}

export function opportunityLens(pain: MarketPain) {
  const demand = demandScore(pain);
  const underserved = underservedScore(pain);
  const money = painToMoneyScore(pain);
  const route = monetizationRoute(pain);
  return { demand, underserved, money, route };
}

/** Commission pounds per landing visitor. */
export function revenuePerVisitor(commissionPence: number, visitors: number) {
  if (visitors <= 0) return 0;
  return Math.round((commissionPence / 100 / visitors) * 100) / 100;
}
