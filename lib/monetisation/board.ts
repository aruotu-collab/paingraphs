import { listPainTraffic } from "@/lib/admin/events";
import {
  clickCounts,
  conversionTotals,
  destinationCounts,
} from "@/lib/destinations/store";
import { listAllPainGraphs } from "@/lib/paingraph/queries";
import { ownerMatchesByPain } from "@/lib/products/store";
import { nextMonetisationAction, programmeCounts } from "@/lib/programmes/store";

export const MONEY_GAPS = [
  "all",
  "needs-destination",
  "has-clicks",
  "owned",
  "draft",
  "published",
] as const;
export type MoneyGap = (typeof MONEY_GAPS)[number];

export const MONEY_SORTS = [
  "affiliate",
  "intent",
  "clicks",
  "visits",
  "revenue",
] as const;
export type MoneySort = (typeof MONEY_SORTS)[number];

export type MoneyBoardRow = {
  id: string;
  title: string;
  href: string;
  status: string;
  intent: number;
  affiliate: number;
  founder: number;
  visits: number;
  programmes: number;
  destinations: number;
  clicks: number;
  revenue: number;
  conversions: number;
  epc: number | null;
  ctr: number | null;
  owned: string[];
  next: string;
};

export function parseMoneyGap(value?: string): MoneyGap {
  return MONEY_GAPS.includes(value as MoneyGap) ? (value as MoneyGap) : "all";
}

export function parseMoneySort(value?: string): MoneySort {
  return MONEY_SORTS.includes(value as MoneySort)
    ? (value as MoneySort)
    : "affiliate";
}

export async function listMoneyBoardRows(
  gap: MoneyGap,
  sort: MoneySort,
): Promise<MoneyBoardRow[]> {
  const [graphs, destinations, programmes, clicks, traffic, owned, revenue] =
    await Promise.all([
      listAllPainGraphs(),
      destinationCounts(),
      programmeCounts(),
      clickCounts(),
      listPainTraffic(),
      ownerMatchesByPain(),
      conversionTotals(),
    ]);
  const visits = new Map(traffic.map((row) => [row.id, row.visits]));
  const rows = graphs.map((graph) => {
    const destCount = destinations.get(graph.id) ?? 0;
    const clickCount = clicks.get(graph.id) ?? 0;
    const visitCount = visits.get(graph.id) ?? 0;
    const money = revenue.get(graph.id) ?? { amount: 0, count: 0 };
    return {
      id: graph.id,
      title: graph.title,
      href: `/marketing-agent/${graph.id}`,
      status: graph.status,
      intent: Math.round(graph.scores.buyingIntent),
      affiliate: Math.round(graph.scores.affiliate),
      founder: Math.round(graph.scores.founder),
      visits: visitCount,
      programmes: programmes.get(graph.id) ?? 0,
      destinations: destCount,
      clicks: clickCount,
      revenue: money.amount,
      conversions: money.count,
      epc: clickCount > 0 && money.amount > 0 ? money.amount / clickCount : null,
      ctr: visitCount > 0 ? (clickCount / visitCount) * 100 : null,
      owned: owned.get(graph.id) ?? [],
      next: nextMonetisationAction({
        affiliateScore: graph.scores.affiliate,
        founderScore: graph.scores.founder,
        destinations: destCount,
        programmes: programmes.get(graph.id) ?? 0,
        clicks: clickCount,
        revenue: money.amount,
      }),
    };
  });

  const filtered = rows.filter((row) => {
    if (gap === "needs-destination") return row.destinations === 0;
    if (gap === "has-clicks") return row.clicks > 0;
    if (gap === "owned") return row.owned.length > 0;
    if (gap === "draft") return row.status !== "published";
    if (gap === "published") return row.status === "published";
    return true;
  });

  return filtered.sort((a, b) => {
    if (sort === "intent") return b.intent - a.intent;
    if (sort === "clicks") return b.clicks - a.clicks;
    if (sort === "visits") return b.visits - a.visits;
    if (sort === "revenue") return b.revenue - a.revenue;
    return b.affiliate - a.affiliate;
  });
}

export function moneyHref(input: { gap?: MoneyGap; sort?: MoneySort }) {
  const params = new URLSearchParams();
  if (input.gap && input.gap !== "all") params.set("gap", input.gap);
  if (input.sort && input.sort !== "affiliate") params.set("sort", input.sort);
  const query = params.toString();
  return query ? `/marketing-agent?${query}` : "/marketing-agent";
}

export function formatMoney(amount: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
