import { and, count, desc, eq, inArray } from "drizzle-orm";
import { ensureCatalog } from "@/lib/catalog/sync";
import { db } from "@/lib/db";
import {
  categories,
  pageEvents,
  pageVisits,
  painClusters,
  pains,
} from "@/lib/db/schema";
import { painHref } from "@/lib/paingraph/path";
import { clientIp, isBotUa, sourceLabel } from "./visits";
import { ensureAdminTables } from "./db";

export const PAINGRAPH_CLICK = "paingraph_click";

const recent = new Map<string, number>();

export async function recordPageEvent(input: {
  kind: string;
  path: string;
  painId?: string | null;
  headers: Headers;
  userId?: string | null;
  email?: string | null;
}) {
  if (input.kind !== PAINGRAPH_CLICK) return;
  const path = input.path.startsWith("/") ? input.path.slice(0, 240) : null;
  if (!path) return;
  const ip = clientIp(input.headers);
  const ua = input.headers.get("user-agent") || "";
  if (isBotUa(ua)) return;
  const key = `${ip}|${input.kind}|${path}`;
  const now = Date.now();
  if (now - (recent.get(key) ?? 0) < 8000) return;
  recent.set(key, now);
  if (recent.size > 4000) recent.clear();

  await ensureAdminTables();
  await db.insert(pageEvents).values({
    id: crypto.randomUUID(),
    kind: input.kind,
    path,
    painId: input.painId || null,
    ip,
    userId: input.userId || null,
    email: input.email?.toLowerCase() || null,
  });
}

export type PainVisitor = {
  ip: string;
  hits: number;
  source: string;
  sources: string;
  country: string | null;
  city: string | null;
};

export type PainTrafficRow = {
  id: string;
  title: string;
  href: string;
  visits: number;
  clicks: number;
  visitors: PainVisitor[];
};

export async function listPainTraffic(): Promise<PainTrafficRow[]> {
  await ensureAdminTables();
  try {
    await ensureCatalog();
  } catch (error) {
    console.warn("Pain traffic catalog:", error);
  }
  const catalog = await db
    .select({
      id: pains.id,
      title: pains.title,
      slug: pains.slug,
      clusterSlug: painClusters.slug,
      categorySlug: categories.slug,
    })
    .from(pains)
    .innerJoin(painClusters, eq(pains.clusterId, painClusters.id))
    .innerJoin(categories, eq(painClusters.categoryId, categories.id))
    .where(eq(pains.status, "published"))
    .catch(() => []);

  const hrefs = catalog.map((pain) =>
    painHref(pain.categorySlug, pain.clusterSlug, pain.slug),
  );
  const [visitRows, clickRows, detailRows] = await Promise.all([
    db
      .select({ path: pageVisits.path, hits: count() })
      .from(pageVisits)
      .where(eq(pageVisits.isBot, false))
      .groupBy(pageVisits.path)
      .catch(() => []),
    db
      .select({
        painId: pageEvents.painId,
        path: pageEvents.path,
        hits: count(),
      })
      .from(pageEvents)
      .where(eq(pageEvents.kind, PAINGRAPH_CLICK))
      .groupBy(pageEvents.painId, pageEvents.path)
      .catch(() => []),
    hrefs.length === 0
      ? Promise.resolve([])
      : db
          .select({
            path: pageVisits.path,
            ip: pageVisits.ip,
            country: pageVisits.country,
            city: pageVisits.city,
            source: pageVisits.source,
            sourceHost: pageVisits.sourceHost,
            referrer: pageVisits.referrer,
            query: pageVisits.query,
            userAgent: pageVisits.userAgent,
          })
          .from(pageVisits)
          .where(and(eq(pageVisits.isBot, false), inArray(pageVisits.path, hrefs)))
          .orderBy(desc(pageVisits.createdAt))
          .limit(8000)
          .catch(() => []),
  ]);

  const visitsByPath = new Map<string, number>();
  for (const row of visitRows) {
    visitsByPath.set(row.path, Number(row.hits) || 0);
  }
  const clicksByPain = new Map<string, number>();
  const clicksByPath = new Map<string, number>();
  for (const row of clickRows) {
    const hits = Number(row.hits) || 0;
    if (row.painId) {
      clicksByPain.set(row.painId, (clicksByPain.get(row.painId) ?? 0) + hits);
    }
    clicksByPath.set(row.path, (clicksByPath.get(row.path) ?? 0) + hits);
  }
  const visitorsByPath = groupVisitorsByPath(detailRows);

  const rows = catalog.map((pain) => {
    const href = painHref(pain.categorySlug, pain.clusterSlug, pain.slug);
    return {
      id: pain.id,
      title: pain.title,
      href,
      visits: visitsByPath.get(href) ?? 0,
      clicks: clicksByPain.get(pain.id) ?? clicksByPath.get(href) ?? 0,
      visitors: visitorsByPath.get(href) ?? [],
    };
  });

  rows.sort((a, b) => b.visits - a.visits || b.clicks - a.clicks || a.title.localeCompare(b.title));
  return rows;
}

export async function painTrafficTotals() {
  const rows = await listPainTraffic();
  return {
    visits: rows.reduce((sum, row) => sum + row.visits, 0),
    clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
    pages: rows.length,
  };
}

function groupVisitorsByPath(
  rows: {
    path: string;
    ip: string;
    country: string | null;
    city: string | null;
    source: string | null;
    sourceHost: string | null;
    referrer: string | null;
    query: string | null;
    userAgent: string | null;
  }[],
) {
  const byPath = new Map<string, Map<string, PainVisitor & { sourceHits: Map<string, number> }>>();
  for (const row of rows) {
    const pathMap =
      byPath.get(row.path) ??
      new Map<string, PainVisitor & { sourceHits: Map<string, number> }>();
    const label = sourceLabel(row).source;
    const seen = pathMap.get(row.ip) ?? {
      ip: row.ip,
      hits: 0,
      source: label,
      sources: "",
      country: row.country,
      city: row.city,
      sourceHits: new Map<string, number>(),
    };
    seen.hits += 1;
    seen.country = seen.country || row.country;
    seen.city = seen.city || row.city;
    seen.sourceHits.set(label, (seen.sourceHits.get(label) ?? 0) + 1);
    pathMap.set(row.ip, seen);
    byPath.set(row.path, pathMap);
  }

  const out = new Map<string, PainVisitor[]>();
  for (const [path, ips] of byPath) {
    out.set(
      path,
      [...ips.values()]
        .map((row) => {
          const ranked = [...row.sourceHits.entries()].sort((a, b) => b[1] - a[1]);
          return {
            ip: row.ip,
            hits: row.hits,
            source: ranked[0]?.[0] ?? row.source,
            sources: ranked.map(([source, hits]) => `${source} ${hits}`).join(" · "),
            country: row.country,
            city: row.city,
          };
        })
        .sort((a, b) => b.hits - a.hits),
    );
  }
  return out;
}