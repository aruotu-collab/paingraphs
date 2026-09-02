import { ensureCatalog } from "@/lib/catalog/sync";
import { db } from "@/lib/db";
import { pains } from "@/lib/db/schema";
import { publishTopic } from "@/lib/ingest/openai-discover";
import { REDDIT_PAINS } from "@/lib/ingest/reddit-pains";

export async function ingestRedditDiscover() {
  await ensureCatalog();
  const rows = await db
    .select({ id: pains.id, slug: pains.slug, title: pains.title })
    .from(pains);
  const usedSlugs = new Set(rows.map((row) => row.slug));
  const usedTitles = new Set(rows.map((row) => row.title.toLowerCase()));

  let created = 0;
  let quotes = 0;
  for (const target of REDDIT_PAINS) {
    if (usedSlugs.has(target.slug) || usedTitles.has(target.title.toLowerCase())) {
      continue;
    }
    const found = target.fallbackQuotes.filter((row) => row.quote.trim().length >= 24);
    if (found.length < 2) {
      console.warn(`reddit skip ${target.slug}: quotes=${found.length}`);
      continue;
    }
    try {
      const result = await publishTopic(
        target.categoryId,
        {
          clusterSlug: target.clusterSlug,
          clusterName: target.clusterName,
          clusterSummary: target.clusterSummary,
          slug: target.slug,
          title: target.title,
          h1: target.h1,
          problem: target.problem,
          analysis: target.analysis,
          whyNow: target.whyNow,
          strategy: "affiliate now → own product later",
          sensitive: target.sensitive,
          painScore: 84,
          intentScore: 80,
          competitionScore: 52,
          productGap: 64,
          affiliateScore: 62,
          organicScore: 80,
          criteria: [...target.criteria],
          products: target.products.map((product) => ({ ...product })),
          quotes: found,
        },
        usedSlugs,
        usedTitles,
      );
      created += result.created;
      quotes += result.quotes;
    } catch (error) {
      console.warn(
        `reddit skip ${target.slug}: ${error instanceof Error ? error.message : "error"}`,
      );
    }
  }
  return { pains: created, quotes };
}
