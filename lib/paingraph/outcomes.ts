import { clampScore } from "./paid";

export function outcomeScore(input: {
  clicks: number;
  revenue: number;
  conversions: number;
}) {
  if (input.clicks <= 0 || input.revenue <= 0) return 0;
  const epc = input.revenue / input.clicks;
  return clampScore(Math.min(8, input.conversions * 2 + Math.min(3, epc)));
}

export function commercialAffiliateScore(base: number, outcome: number) {
  return clampScore(base + outcome);
}
