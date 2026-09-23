import { listPainTraffic } from "@/lib/admin/events";
import {
  concernName,
  defaultProfile,
  rankMatches,
  type PainProfile,
} from "@/lib/paingraph/match";
import { getPainGraphPage, listPainGraphs } from "@/lib/paingraph/queries";
import type { PainGraph, PainGraphPage } from "@/lib/paingraph/types";

export type MatchSnapshot = {
  graph: PainGraph;
  page: PainGraphPage;
  profile: PainProfile;
  topConcerns: string[];
  surviving: { id: string; name: string; match: number }[];
  blocked: { id: string; name: string }[];
  shopReady: { id: string; name: string }[];
  dealBreakers: { slug: string; name: string }[];
  clicks: number;
};

export function matchSnapshot(
  page: PainGraphPage,
  profile?: PainProfile,
): Omit<MatchSnapshot, "graph" | "page" | "clicks"> {
  const slugs = page.criteria.map((item) => item.slug);
  const used = profile ?? defaultProfile(slugs);
  const ranked = rankMatches(page.products, page.criteria, used);
  const topConcerns = [...page.criteria]
    .sort(
      (left, right) =>
        (used.importances[right.slug] ?? 0) - (used.importances[left.slug] ?? 0),
    )
    .slice(0, 3)
    .map((item) => concernName(item));
  return {
    profile: used,
    topConcerns,
    surviving: ranked
      .filter((item) => !item.blocked)
      .map((item) => ({ id: item.id, name: item.name, match: item.match })),
    blocked: ranked
      .filter((item) => item.blocked)
      .map((item) => ({ id: item.id, name: item.name })),
    shopReady: ranked
      .filter((item) => Boolean(item.destinationUrl))
      .map((item) => ({ id: item.id, name: item.name })),
    dealBreakers: dealBreakerGaps(page),
  };
}

export function dealBreakerGaps(page: PainGraphPage) {
  const slugs = page.criteria.map((item) => item.slug);
  const baseline = defaultProfile(slugs);
  return page.criteria
    .filter((item) => {
      const profile: PainProfile = {
        importances: { ...baseline.importances, [item.slug]: 10 },
        breakers: [item.slug],
      };
      const ranked = rankMatches(page.products, page.criteria, profile);
      return ranked.length > 0 && ranked.every((product) => product.blocked);
    })
    .map((item) => ({ slug: item.slug, name: concernName(item) }));
}

export async function listMatchLenses(): Promise<MatchSnapshot[]> {
  const [graphs, traffic] = await Promise.all([
    listPainGraphs(),
    listPainTraffic().catch(() => []),
  ]);
  const clicks = new Map(traffic.map((row) => [row.id, row.clicks]));
  const pages = await Promise.all(
    graphs.map((graph) =>
      getPainGraphPage(graph.category.slug, graph.subcategory.slug, graph.slug),
    ),
  );
  return pages
    .filter((page): page is PainGraphPage => Boolean(page))
    .map((page) => ({
      graph: page,
      page,
      clicks: clicks.get(page.id) ?? 0,
      ...matchSnapshot(page),
    }));
}
