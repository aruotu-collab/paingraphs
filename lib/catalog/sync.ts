import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  affiliateProgrammes,
  categories,
  criteria,
  painClusters,
  painGraphScores,
  painSignals,
  pains,
  productFits,
  products,
} from "@/lib/db/schema";
import { ensureIdentityTables } from "@/lib/identity/db";
import { snapshotFromPain } from "@/lib/paingraph/scores";
import { allowedJoinUrl, PROGRAMMES } from "@/lib/programmes/catalog";
import { CATEGORIES, CLUSTERS, PAINS, PRODUCTS } from "./data";

let ready: Promise<void> | null = null;

export async function ensureCatalog() {
  if (!ready) {
    ready = writeCatalog().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function writeCatalog() {
  await ensureIdentityTables();
  for (const category of CATEGORIES) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoUpdate({
        target: categories.id,
        set: { slug: category.slug, name: category.name, summary: category.summary },
      });
  }
  for (const cluster of CLUSTERS) {
    await db
      .insert(painClusters)
      .values(cluster)
      .onConflictDoUpdate({
        target: painClusters.id,
        set: {
          categoryId: cluster.categoryId,
          slug: cluster.slug,
          name: cluster.name,
          summary: cluster.summary,
        },
      });
  }
  for (const product of PRODUCTS) {
    await db
      .insert(products)
      .values(product)
      .onConflictDoUpdate({
        target: products.id,
        set: {
          slug: product.slug,
          name: product.name,
          summary: product.summary,
          whoFor: product.whoFor,
          searchQuery: product.searchQuery,
          priceBand: product.priceBand,
        },
      });
  }

  for (const programme of PROGRAMMES) {
    const joinUrl = allowedJoinUrl(programme.joinUrl);
    await db
      .insert(affiliateProgrammes)
      .values({
        id: programme.id,
        productId: programme.productId,
        name: programme.name,
        kind: programme.kind,
        status: programme.status,
        country: programme.country,
        joinUrl,
        note: programme.note,
      })
      .onConflictDoUpdate({
        target: affiliateProgrammes.id,
        set: {
          name: programme.name,
          kind: programme.kind,
          status: programme.status,
          country: programme.country,
          joinUrl,
          note: programme.note,
        },
      });
  }

  for (const pain of PAINS) {
    await db
      .insert(pains)
      .values({
        id: pain.id,
        clusterId: pain.clusterId,
        slug: pain.slug,
        title: pain.title,
        h1: pain.h1,
        problem: pain.problem,
        analysis: pain.analysis,
        whyNow: pain.whyNow,
        strategy: pain.strategy,
        stage: pain.stage,
        painScore: pain.painScore,
        intentScore: pain.intentScore,
        competitionScore: pain.competitionScore,
        productGap: pain.productGap,
        affiliateScore: pain.affiliateScore,
        organicScore: pain.organicScore,
        opportunity: pain.opportunity,
        trend: pain.trend,
        sensitive: pain.sensitive,
        status: "published",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pains.id,
        set: {
          title: pain.title,
          h1: pain.h1,
          problem: pain.problem,
          analysis: pain.analysis,
          whyNow: pain.whyNow,
          strategy: pain.strategy,
          painScore: pain.painScore,
          intentScore: pain.intentScore,
          competitionScore: pain.competitionScore,
          productGap: pain.productGap,
          affiliateScore: pain.affiliateScore,
          organicScore: pain.organicScore,
          sensitive: pain.sensitive,
        },
      });

    const snapshot = snapshotFromPain(pain);
    await db
      .insert(painGraphScores)
      .values(snapshot)
      .onConflictDoUpdate({
        target: painGraphScores.painId,
        set: {
          growthScore: snapshot.growthScore,
          buyingIntentScore: snapshot.buyingIntentScore,
          reachabilityScore: snapshot.reachabilityScore,
          founderScore: snapshot.founderScore,
          updatedAt: snapshot.updatedAt,
        },
      });

    for (const item of pain.criteria) {
      await db
        .insert(criteria)
        .values({
          id: `${pain.id}-${item.slug}`,
          painId: pain.id,
          slug: item.slug,
          name: item.name,
          detail: item.detail,
        })
        .onConflictDoUpdate({
          target: criteria.id,
          set: { name: item.name, detail: item.detail, slug: item.slug },
        });
    }

    for (const fit of pain.products) {
      await db
        .insert(productFits)
        .values({
          id: `${fit.productId}-${pain.id}`,
          productId: fit.productId,
          painId: pain.id,
          scores: JSON.stringify(fit.scores),
          note: fit.note,
        })
        .onConflictDoUpdate({
          target: productFits.id,
          set: { scores: JSON.stringify(fit.scores), note: fit.note },
        });
    }

    const existing = await db
      .select({ id: painSignals.id })
      .from(painSignals)
      .where(and(eq(painSignals.painId, pain.id), eq(painSignals.sourceKind, "composite")));
    if (existing.length === 0) {
      await db.insert(painSignals).values(
        pain.signals.map((signal, index) => ({
          id: `${pain.id}-seed-${index}`,
          painId: pain.id,
          rawQuote: signal.rawQuote,
          sourceKind: signal.sourceKind,
          sourceLabel: signal.sourceLabel,
          sourceUrl: null,
          publishedAt: null,
        })),
      );
    }
  }
}
