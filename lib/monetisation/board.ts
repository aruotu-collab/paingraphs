import { listPainTraffic } from "@/lib/admin/events";
import {
  clickCounts,
  clickVisitorCountriesByPain,
  conversionTotals,
  destinationCounts,
  destinationCountriesByPain,
} from "@/lib/destinations/store";
import { parseCountry } from "@/lib/destinations/url";
import { geographyLens } from "@/lib/geography/arbitrage";
import {
  HIGH_PAID_ACQUISITION,
  paidAcquisitionScore,
} from "@/lib/paingraph/paid";
import { listAllPainGraphs } from "@/lib/paingraph/queries";
import { ownerMatchesByPain } from "@/lib/products/store";
import { nextMonetisationAction, programmeCounts } from "@/lib/programmes/store";

export const MONEY_GAPS = [
  "all",
  "published",
  "draft",
  "needs-destination",
  "country-gap",
  "has-clicks",
  "owned",
  "high-ads",
] as const;
export type MoneyGap = (typeof MONEY_GAPS)[number];

export const MONEY_SORTS = [
  "affiliate",
  "intent",
  "ads",
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
  paid: number;
  visits: number;
  programmes: number;
  destinations: number;
  clicks: number;
  revenue: number;
  conversions: number;
  epc: number | null;
  ctr: number | null;
  owned: string[];
  markets: string[];
  destCountries: string[];
  geoGap: string[];
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

export function parseMoneyCountry(value?: string) {
  return parseCountry(value || "*");
}

export async function listMoneyBoardRows(
  gap: MoneyGap,
  sort: MoneySort,
  country = "*",
): Promise<MoneyBoardRow[]> {
  const [
    graphs,
    destinations,
    programmes,
    clicks,
    traffic,
    owned,
    revenue,
    destCountries,
    clickCountries,
  ] = await Promise.all([
    listAllPainGraphs(),
    destinationCounts(),
    programmeCounts(),
    clickCounts(),
    listPainTraffic(),
    ownerMatchesByPain(),
    conversionTotals(),
    destinationCountriesByPain(),
    clickVisitorCountriesByPain(),
  ]);
  const visits = new Map(traffic.map((row) => [row.id, row.visits]));
  const visitCountries = new Map(
    traffic.map((row) => [row.id, row.visitors.map((visitor) => visitor.country)]),
  );
  const rows = graphs.map((graph) => {
    const destCount = destinations.get(graph.id) ?? 0;
    const clickCount = clicks.get(graph.id) ?? 0;
    const visitCount = visits.get(graph.id) ?? 0;
    const money = revenue.get(graph.id) ?? { amount: 0, count: 0 };
    const geo = geographyLens({
      visitCountries: visitCountries.get(graph.id) ?? [],
      clickCountries: clickCountries.get(graph.id) ?? [],
      destinationCountries: destCountries.get(graph.id) ?? [],
    });
    const paid = paidAcquisitionScore({
      intent: graph.scores.buyingIntent,
      organic: graph.scores.reachability ?? 0,
      competition: graph.scores.competition,
      published: graph.status === "published",
      destinations: destCount,
      evidenceCount: graph.evidenceCount,
      revenue: money.amount,
      clicks: clickCount,
      sensitive: graph.sensitive,
    });
    return {
      id: graph.id,
      title: graph.title,
      href: `/marketing-agent/${graph.id}`,
      status: graph.status,
      intent: Math.round(graph.scores.buyingIntent),
      affiliate: Math.round(graph.scores.affiliate),
      founder: Math.round(graph.scores.founder),
      paid,
      visits: visitCount,
      programmes: programmes.get(graph.id) ?? 0,
      destinations: destCount,
      clicks: clickCount,
      revenue: money.amount,
      conversions: money.count,
      epc: clickCount > 0 && money.amount > 0 ? money.amount / clickCount : null,
      ctr: visitCount > 0 ? (clickCount / visitCount) * 100 : null,
      owned: owned.get(graph.id) ?? [],
      markets: geo.visitors,
      destCountries: geo.destinations,
      geoGap: geo.missingDestinations,
      next: nextMonetisationAction({
        affiliateScore: graph.scores.affiliate,
        founderScore: graph.scores.founder,
        destinations: destCount,
        programmes: programmes.get(graph.id) ?? 0,
        clicks: clickCount,
        revenue: money.amount,
        paidAcquisition: paid,
        published: graph.status === "published",
        countryGap: geo.missingDestinations[0] ?? null,
      }),
    };
  });

  const filtered = rows.filter((row) => {
    if (country !== "*") {
      const inMarket =
        row.markets.includes(country) ||
        row.destCountries.includes(country) ||
        row.geoGap.includes(country);
      if (!inMarket) return false;
    }
    if (gap === "needs-destination") return row.destinations === 0;
    if (gap === "country-gap") {
      return country === "*"
        ? row.geoGap.length > 0
        : row.geoGap.includes(country);
    }
    if (gap === "has-clicks") return row.clicks > 0;
    if (gap === "owned") return row.owned.length > 0;
    if (gap === "draft") return row.status !== "published";
    if (gap === "published") return row.status === "published";
    if (gap === "high-ads") return row.paid >= HIGH_PAID_ACQUISITION;
    return true;
  });

  return filtered.sort((a, b) => {
    if (sort === "intent") return b.intent - a.intent;
    if (sort === "ads") return b.paid - a.paid;
    if (sort === "clicks") return b.clicks - a.clicks;
    if (sort === "visits") return b.visits - a.visits;
    if (sort === "revenue") return b.revenue - a.revenue;
    return b.affiliate - a.affiliate;
  });
}

export function moneyHref(input: {
  gap?: MoneyGap;
  sort?: MoneySort;
  country?: string;
}) {
  const params = new URLSearchParams();
  if (input.gap && input.gap !== "all") params.set("gap", input.gap);
  if (input.sort && input.sort !== "affiliate") params.set("sort", input.sort);
  if (input.country && input.country !== "*") params.set("country", input.country);
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
