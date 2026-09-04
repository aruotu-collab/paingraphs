import { desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  billboardFavourites,
  billboardTopics,
  categories,
  painClusters,
  pains,
} from "@/lib/db/schema";
import { painHref } from "@/lib/market/queries";
import { ensureBillboardTables } from "./db";
import type { BillboardSource, BillboardTopic } from "./types";

export async function listChartTopics(): Promise<BillboardTopic[]> {
  await ensureBillboardTables();
  const rows = await db
    .select()
    .from(billboardTopics)
    .where(gt(billboardTopics.rank, 0))
    .orderBy(billboardTopics.rank);
  return hydrateTopics(rows);
}

export async function listFavouriteTopics(userId: string): Promise<BillboardTopic[]> {
  await ensureBillboardTables();
  const rows = await db
    .select({ topic: billboardTopics })
    .from(billboardFavourites)
    .innerJoin(billboardTopics, eq(billboardFavourites.topicId, billboardTopics.id))
    .where(eq(billboardFavourites.userId, userId))
    .orderBy(desc(billboardFavourites.createdAt));
  return hydrateTopics(rows.map((row) => row.topic));
}

export async function listFavouriteIds(userId?: string | null) {
  if (!userId) return [];
  await ensureBillboardTables();
  const rows = await db
    .select({ topicId: billboardFavourites.topicId })
    .from(billboardFavourites)
    .where(eq(billboardFavourites.userId, userId));
  return rows.map((row) => row.topicId);
}

export async function getChartDate() {
  const topics = await listChartTopics();
  return topics[0]?.chartDate ?? null;
}

async function hydrateTopics(
  rows: (typeof billboardTopics.$inferSelect)[],
): Promise<BillboardTopic[]> {
  const painIds = rows.map((row) => row.painId).filter((id): id is string => Boolean(id));
  const hrefs = new Map<string, string>();
  if (painIds.length > 0) {
    const published = await db
      .select({
        id: pains.id,
        painSlug: pains.slug,
        clusterSlug: painClusters.slug,
        categorySlug: categories.slug,
      })
      .from(pains)
      .innerJoin(painClusters, eq(pains.clusterId, painClusters.id))
      .innerJoin(categories, eq(painClusters.categoryId, categories.id));
    for (const pain of published) {
      if (painIds.includes(pain.id)) {
        hrefs.set(pain.id, painHref(pain.categorySlug, pain.clusterSlug, pain.painSlug));
      }
    }
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    problem: row.problem,
    whyNow: row.whyNow,
    categorySlug: row.categorySlug,
    categoryName: row.categoryName,
    searchPhrase: row.searchPhrase,
    evidence: cleanDisplayText(row.evidence),
    sources: parseSources(row.sources),
    heat: row.heat,
    intent: row.intent,
    pain: row.pain,
    rank: row.rank,
    daysOnChart: row.daysOnChart,
    chartDate: row.chartDate,
    painId: row.painId,
    painHref: row.painId ? hrefs.get(row.painId) ?? null : null,
  }));
}

function cleanDisplayText(value: string) {
  const cleaned = value
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/\((https?:\/\/[^)]+)\)/g, "")
    .replace(/^\(+|\)+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleaned)) return "";
  return cleaned;
}

function parseSources(value: string): BillboardSource[] {
  try {
    const parsed = JSON.parse(value) as BillboardSource[];
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.url).slice(0, 3)
      : [];
  } catch {
    return [];
  }
}
