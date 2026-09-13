import { desc, eq } from "drizzle-orm";
import { PAINS } from "@/lib/catalog/data";
import { ensureCatalog } from "@/lib/catalog/sync";
import { db } from "@/lib/db";
import {
  categories,
  criteria,
  painClusters,
  painGraphScores,
  painSignals,
  pains,
  productFits,
  products,
} from "@/lib/db/schema";
import { informativeQuotes, isInformativeQuote } from "@/lib/paingraph/quotes";
import { listDestinationsForPain } from "@/lib/destinations/store";
import { goHref, pickPublicDestination } from "@/lib/destinations/url";
import { consumerIntelFor } from "./consumer";
import { painHref } from "./path";
import { scoresFromPain } from "./scores";
import type { PainGraph, PainGraphPage } from "./types";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function toGraph(
  pain: typeof pains.$inferSelect,
  cluster: typeof painClusters.$inferSelect,
  category: typeof categories.$inferSelect,
  evidenceCount: number,
  snapshot?: typeof painGraphScores.$inferSelect | null,
): PainGraph {
  return {
    id: pain.id,
    slug: pain.slug,
    title: pain.title,
    h1: pain.h1,
    summary: pain.problem,
    explanation: pain.analysis,
    whyNow: pain.whyNow,
    usuallyHelps: pain.strategy,
    href: painHref(category.slug, cluster.slug, pain.slug),
    evidenceCount,
    sensitive: pain.sensitive,
    status: pain.status,
    scores: scoresFromPain(pain, evidenceCount, snapshot),
    category: { slug: category.slug, name: category.name },
    subcategory: { slug: cluster.slug, name: cluster.name },
  };
}

export async function listPainGraphs(): Promise<PainGraph[]> {
  const graphs = await listPainGraphRecords();
  return graphs.filter((graph) => graph.status === "published");
}

export async function getPainGraph(id: string) {
  const graphs = await listPainGraphs();
  return graphs.find((graph) => graph.id === id) ?? null;
}

export async function getAnyPainGraph(id: string) {
  const graphs = await listAllPainGraphs();
  return graphs.find((graph) => graph.id === id) ?? null;
}

export async function listAllPainGraphs(): Promise<PainGraph[]> {
  return listPainGraphRecords();
}

async function listPainGraphRecords(): Promise<PainGraph[]> {
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
    .orderBy(desc(pains.opportunity));

  const [signalRows, scoreRows] = await Promise.all([
    db.select().from(painSignals),
    db.select().from(painGraphScores),
  ]);
  const counts = new Map<string, number>();
  for (const row of signalRows) {
    if (!isInformativeQuote({ quote: row.rawQuote, source: row.sourceLabel })) continue;
    counts.set(row.painId, (counts.get(row.painId) ?? 0) + 1);
  }
  const snapshots = new Map(scoreRows.map((row) => [row.painId, row]));

  return rows.map(({ pain, cluster, category }) =>
    toGraph(
      pain,
      cluster,
      category,
      counts.get(pain.id) ?? 0,
      snapshots.get(pain.id),
    ),
  );
}

export async function listCategories() {
  const graphs = await listPainGraphs();
  const map = new Map<
    string,
    { slug: string; name: string; pains: PainGraph[] }
  >();
  for (const graph of graphs) {
    const existing = map.get(graph.category.slug);
    if (existing) {
      existing.pains.push(graph);
      continue;
    }
    map.set(graph.category.slug, {
      slug: graph.category.slug,
      name: graph.category.name,
      pains: [graph],
    });
  }
  return [...map.values()];
}

export async function getPainGraphPage(
  categorySlug: string,
  clusterSlug: string,
  painSlug: string,
  visitorCountry?: string | null,
): Promise<PainGraphPage | null> {
  const graphs = await listPainGraphs();
  const graph = graphs.find(
    (item) =>
      item.category.slug === categorySlug &&
      item.subcategory.slug === clusterSlug &&
      item.slug === painSlug,
  );
  if (!graph) return null;

  const [criterionRows, signalRows, fitRows, destinations] = await Promise.all([
    db.select().from(criteria).where(eq(criteria.painId, graph.id)),
    db.select().from(painSignals).where(eq(painSignals.painId, graph.id)),
    db
      .select({ fit: productFits, product: products })
      .from(productFits)
      .innerJoin(products, eq(productFits.productId, products.id))
      .where(eq(productFits.painId, graph.id)),
    listDestinationsForPain(graph.id),
  ]);
  const productCards = fitRows.map(({ fit, product }) => {
    const scores = JSON.parse(fit.scores) as Record<string, number>;
    const destination = pickPublicDestination(
      destinations,
      product.id,
      visitorCountry,
    );
    return {
      id: product.id,
      name: product.name,
      summary: product.summary,
      whoFor: product.whoFor,
      priceBand: product.priceBand,
      scores,
      note: fit.note,
      match: average(Object.values(scores)),
      destinationUrl: destination ? goHref(destination.id) : null,
    };
  });

  const mappedCriteria = criterionRows.map((row) => ({
    slug: row.slug,
    name: row.name,
    detail: row.detail,
  }));

  return {
    ...graph,
    criteria: mappedCriteria,
    evidence: informativeQuotes(
      signalRows.map((row) => ({
        quote: row.rawQuote,
        source: row.sourceLabel,
        url: row.sourceUrl,
      })),
    ),
    products: productCards.sort((a, b) => b.match - a.match),
    related: relatedGraphs(graph, graphs),
    consumer: consumerIntelFor(
      PAINS.find((pain) => pain.id === graph.id)?.consumer,
      graph.explanation,
      graph.whyNow,
      mappedCriteria,
    ),
  };
}

function relatedGraphs(graph: PainGraph, graphs: PainGraph[]) {
  const named = (PAINS.find((pain) => pain.id === graph.id)?.related ?? [])
    .map((id) => graphs.find((item) => item.id === id))
    .filter((item): item is PainGraph => Boolean(item));
  if (named.length > 0) return named;

  const sameCluster = graphs.filter(
    (item) =>
      item.subcategory.slug === graph.subcategory.slug && item.id !== graph.id,
  );
  if (sameCluster.length > 0) return sameCluster;

  const sameCategory = graphs.filter(
    (item) => item.category.slug === graph.category.slug && item.id !== graph.id,
  );
  if (sameCategory.length > 0) return sameCategory.slice(0, 4);

  return graphs.filter((item) => item.id !== graph.id).slice(0, 4);
}

export { painHref } from "./path";
