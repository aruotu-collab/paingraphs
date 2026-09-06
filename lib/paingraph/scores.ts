import type { painGraphScores, pains } from "@/lib/db/schema";
import type { PainScores } from "./types";

type PainRow = typeof pains.$inferSelect;
type ScoreRow = typeof painGraphScores.$inferSelect;

function num(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function scoresFromPain(
  pain: PainRow,
  evidenceCount: number,
  snapshot?: ScoreRow | null,
): PainScores {
  return {
    pain: pain.painScore,
    demand: num(snapshot?.demandScore, evidenceCount),
    growth: num(snapshot?.growthScore, pain.trend),
    buyingIntent: num(snapshot?.buyingIntentScore, pain.intentScore),
    competition: pain.competitionScore,
    affiliate: pain.affiliateScore,
    founder: num(snapshot?.founderScore, pain.productGap),
    recurrence: snapshot?.recurrenceScore ?? null,
    dissatisfaction: snapshot?.dissatisfactionScore ?? null,
    reachability: snapshot?.reachabilityScore ?? pain.organicScore,
    confidence: snapshot?.confidenceScore ?? null,
    paidAcquisition: snapshot?.paidAcquisitionScore ?? null,
  };
}

export function snapshotFromPain(
  pain: Pick<
    PainRow,
    "id" | "trend" | "intentScore" | "organicScore" | "productGap"
  >,
  evidenceCount = 0,
) {
  return {
    painId: pain.id,
    demandScore: evidenceCount,
    growthScore: pain.trend,
    buyingIntentScore: pain.intentScore,
    recurrenceScore: null,
    dissatisfactionScore: null,
    reachabilityScore: pain.organicScore,
    founderScore: pain.productGap,
    paidAcquisitionScore: null,
    confidenceScore: null,
    updatedAt: new Date(),
  };
}
