import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { painGraphScores, painSignals, pains } from "@/lib/db/schema";
import { isInformativeQuote } from "./quotes";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function recalculatePainScores() {
  const [painRows, signalRows] = await Promise.all([
    db.select().from(pains),
    db.select().from(painSignals),
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
    const demand = clamp(20 + evidence * 12);
    const confidence = clamp(30 + evidence * 10 + diversity * 8);
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
        confidenceScore: confidence,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: painGraphScores.painId,
        set: {
          demandScore: demand,
          confidenceScore: confidence,
          updatedAt: now,
        },
      });
    await db
      .update(pains)
      .set({ opportunity: clamp((pain.painScore + pain.intentScore + demand) / 3) })
      .where(eq(pains.id, pain.id));
    updated += 1;
  }
  return { updated };
}
