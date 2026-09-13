import { listAllPainGraphs } from "@/lib/paingraph/queries";
import { db } from "@/lib/db";
import { pains } from "@/lib/db/schema";

const STALE_MS = 30 * 24 * 60 * 60 * 1000;
const PLACEHOLDER_HELP =
  "What usually helps is still being mapped from evidence.";

export type SeoQueueRow = {
  id: string;
  title: string;
  href: string;
  publicHref: string;
  status: string;
  category: string;
  cluster: string;
  updatedAt: Date | null;
  reasons: string[];
};

export async function listSeoQueue(): Promise<SeoQueueRow[]> {
  const [graphs, rows] = await Promise.all([
    listAllPainGraphs(),
    db.select({ id: pains.id, updatedAt: pains.updatedAt }).from(pains),
  ]);
  const updated = new Map(rows.map((row) => [row.id, row.updatedAt]));
  const titles = new Map<string, number>();
  for (const graph of graphs) {
    const key = graph.title.trim().toLowerCase();
    titles.set(key, (titles.get(key) ?? 0) + 1);
  }

  const now = Date.now();
  const queue: SeoQueueRow[] = [];
  for (const graph of graphs) {
    const reasons: string[] = [];
    const stamp = updated.get(graph.id) ?? null;
    const updatedAt =
      stamp instanceof Date ? stamp : stamp ? new Date(stamp) : null;
    const updatedMs = updatedAt && !Number.isNaN(updatedAt.getTime())
      ? updatedAt.getTime()
      : 0;
    if (graph.status !== "published") {
      reasons.push("Unpublished. Not in the sitemap.");
    } else if (updatedMs && now - updatedMs > STALE_MS) {
      reasons.push("Published page is older than 30 days.");
    }
    if (graph.summary.trim().length < 80 || graph.explanation.trim().length < 80) {
      reasons.push("Thin explanation.");
    }
    if (graph.evidenceCount < 1) {
      reasons.push("No usable public evidence.");
    }
    if (graph.usuallyHelps.trim() === PLACEHOLDER_HELP) {
      reasons.push("Placeholder “what usually helps”.");
    }
    if ((titles.get(graph.title.trim().toLowerCase()) ?? 0) > 1) {
      reasons.push("Duplicate title.");
    }
    if (reasons.length === 0) continue;
    queue.push({
      id: graph.id,
      title: graph.title,
      href: `/admin/pains`,
      publicHref: graph.href,
      status: graph.status,
      category: graph.category.name,
      cluster: graph.subcategory.name,
      updatedAt,
      reasons,
    });
  }

  return queue.sort((a, b) => {
    const unpublished = Number(a.status !== "published") - Number(b.status !== "published");
    if (unpublished !== 0) return unpublished > 0 ? -1 : 1;
    return (a.updatedAt?.getTime() ?? 0) - (b.updatedAt?.getTime() ?? 0);
  });
}
