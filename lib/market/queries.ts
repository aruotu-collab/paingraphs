import { desc, eq } from "drizzle-orm";
import { ensureCatalog } from "@/lib/catalog/sync";
import { db } from "@/lib/db";
import {
  categories,
  criteria,
  painClusters,
  painSignals,
  pains,
  productFits,
  products,
} from "@/lib/db/schema";
import { informativeQuotes, isInformativeQuote } from "./quotes";
import type { MarketPain, PainPage, Priorities } from "./types";
import { rankProducts } from "./match";

export function painHref(
  categorySlug: string,
  clusterSlug: string,
  painSlug: string,
) {
  return `/${categorySlug}/${clusterSlug}/${painSlug}`;
}

export async function listMarketPains(): Promise<MarketPain[]> {
  await ensureCatalog();
  const rows = await db
    .select({
      pain: pains,
      cluster: painClusters,
      category: categories,
    })
    .from(pains)
    .innerJoin(painClusters, eq(pains.clusterId, painClusters.id))
    .innerJoin(categories, eq(painClusters.categoryId, categories.id))
    .where(eq(pains.status, "published"))
    .orderBy(desc(pains.opportunity));

  const signalRows = await db.select().from(painSignals);
  const counts = new Map<string, number>();
  for (const row of signalRows) {
    if (!isInformativeQuote({ quote: row.rawQuote, source: row.sourceLabel })) continue;
    counts.set(row.painId, (counts.get(row.painId) ?? 0) + 1);
  }

  return rows.map(({ pain, cluster, category }) =>
    toMarketPain(pain, cluster, category, counts.get(pain.id) ?? 0),
  );
}

export async function getPainPage(
  categorySlug: string,
  clusterSlug: string,
  painSlug: string,
): Promise<PainPage | null> {
  const items = await listMarketPains();
  const item = items.find(
    (pain) =>
      pain.category.slug === categorySlug &&
      pain.cluster.slug === clusterSlug &&
      pain.slug === painSlug,
  );
  if (!item) return null;

  const [criterionRows, signalRows, fitRows] = await Promise.all([
    db.select().from(criteria).where(eq(criteria.painId, item.id)),
    db.select().from(painSignals).where(eq(painSignals.painId, item.id)),
    db
      .select({ fit: productFits, product: products })
      .from(productFits)
      .innerJoin(products, eq(productFits.productId, products.id))
      .where(eq(productFits.painId, item.id)),
  ]);

  const related = items.filter(
    (pain) => pain.cluster.slug === item.cluster.slug && pain.id !== item.id,
  );

  const productCards = fitRows.map(({ fit, product }) => {
    const scores = JSON.parse(fit.scores) as Record<string, number>;
    return {
      id: product.id,
      name: product.name,
      summary: product.summary,
      whoFor: product.whoFor,
      searchQuery: product.searchQuery,
      priceBand: product.priceBand,
      scores,
      note: fit.note,
      match: average(Object.values(scores)),
    };
  });

  return {
    ...item,
    criteria: criterionRows.map((row) => ({
      slug: row.slug,
      name: row.name,
      detail: row.detail,
    })),
    signals: informativeQuotes(
      signalRows.map((row) => ({
        quote: row.rawQuote,
        source: row.sourceLabel,
        url: row.sourceUrl,
      })),
      `${item.title} ${item.h1} ${item.problem}`,
    ),
    products: productCards.sort((a, b) => b.match - a.match),
    related,
  };
}

export function applyPriorities(page: PainPage, priorities: Priorities): PainPage {
  return {
    ...page,
    products: rankProducts(page.products, priorities),
  };
}

export async function listCategories() {
  const items = await listMarketPains();
  const map = new Map<
    string,
    { slug: string; name: string; summary: string; pains: MarketPain[] }
  >();
  for (const pain of items) {
    const existing = map.get(pain.category.slug);
    if (existing) {
      existing.pains.push(pain);
      continue;
    }
    map.set(pain.category.slug, {
      slug: pain.category.slug,
      name: pain.category.name,
      summary: "",
      pains: [pain],
    });
  }
  return [...map.values()];
}

function toMarketPain(
  pain: typeof pains.$inferSelect,
  cluster: typeof painClusters.$inferSelect,
  category: typeof categories.$inferSelect,
  evidenceCount: number,
): MarketPain {
  return {
    id: pain.id,
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
    evidenceCount,
    category: { slug: category.slug, name: category.name },
    cluster: { slug: cluster.slug, name: cluster.name },
    href: painHref(category.slug, cluster.slug, pain.slug),
  };
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
