import type { MarketPain } from "@/lib/market/types";

export function band(score: number, high = 80, mid = 55) {
  if (score >= high) return "High";
  if (score >= mid) return "Medium";
  return "Low";
}

export function founderBand(pain: Pick<MarketPain, "productGap" | "trend">) {
  if (pain.productGap >= 80 && pain.trend >= 20) return "Very high";
  if (pain.productGap >= 65) return "High";
  if (pain.productGap >= 45) return "Medium";
  return "Low";
}

export function trendLabel(trend: number) {
  if (trend >= 35) return "Rising";
  if (trend >= 15) return "Growing";
  if (trend > 0) return "Steady";
  return "Cooling";
}

export function marketplaceLabels(pain: MarketPain) {
  return {
    affiliate: band(pain.affiliateScore),
    founder: founderBand(pain),
    trend: trendLabel(pain.trend),
    rising: pain.trend >= 20,
  };
}
