import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clickCounts,
  conversionTotals,
  destinationCounts,
} from "@/lib/destinations/store";
import { painGraphScores, painSignals, pains } from "@/lib/db/schema";
import { clampScore, paidAcquisitionScore } from "./paid";
import { isInformativeQuote } from "./quotes";

export async function recalculatePainScores() {
  const [painRows, signalRows, destinations, clicks, revenue] = await Promise.all([
    db.select().from(pains),
    db.select().from(painSignals),
    destinationCounts(),
    clickCounts(),
    conversionTotals(),
  ]);
  const counts = new Map<string, number>();
  const kinds = new Map<string, Set<string>>();
  for (const row of signalRows) {
    if (!isInformativeQuote({ quote: row.rawQuote, source: row.sourceLabel })) {
      continue;
    }
    counts.set(row.painId, (counts.get(row.painId) ?? 0) + 1);
    const set = kinds.get(row.painId) ?? new Set<string>();
    set.add(row.sourceKind);
    kinds.set(row.painId, set);
  }

  let updated = 0;
  for (const pain of painRows) {
    const evidence = counts.get(pain.id) ?? 0;
    const diversity = kinds.get(pain.id)?.size ?? 0;
    const demand = clampScore(20 + evidence * 12);
    const confidence = clampScore(30 + evidence * 10 + diversity * 8);
    const money = revenue.get(pain.id) ?? { amount: 0, count: 0 };
    const paid = paidAcquisitionScore({
      intent: pain.intentScore,
      organic: pain.organicScore,
      competition: pain.competitionScore,
      published: pain.status === "published",
      destinations: destinations.get(pain.id) ?? 0,
      evidenceCount: evidence,
      revenue: money.amount,
      clicks: clicks.get(pain.id) ?? 0,
      sensitive: pain.sensitive,
    });
    const now = new Date();
    await db
      .insert(painGraphScores)
      .values({
        painId: pain.id,
        demandScore: demand,
        growthScore: pain.trend,
        buyingIntentScore: pain.intentScore,
        reachabilityScore: pain.organicScore,
        founderScore: pain.productGap,
        paidAcquisitionScore: paid,
        confidenceScore: confidence,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: painGraphScores.painId,
        set: {
          demandScore: demand,
          paidAcquisitionScore: paid,
          confidenceScore: confidence,
          updatedAt: now,
        },
      });
    await db
      .update(pains)
      .set({
        opportunity: clampScore((pain.painScore + pain.intentScore + demand) / 3),
      })
      .where(eq(pains.id, pain.id));
    updated += 1;
  }
  return { updated };
}
