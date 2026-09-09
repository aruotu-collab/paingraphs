import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { affiliateDestinations, productFits } from "@/lib/db/schema";
import { listPainGraphs } from "@/lib/paingraph/queries";
import type { PainGraph } from "@/lib/paingraph/types";
import { programmeCounts } from "@/lib/programmes/store";

export type BillboardView =
  | "pain"
  | "affiliate"
  | "founder"
  | "intent"
  | "underserved"
  | "growth"
  | "competition";

export type BillboardRow = PainGraph & {
  productCount: number;
  programmeCount: number;
  countries: string[];
};

export type BillboardFilters = {
  category?: string;
  country?: string;
  products?: "any" | "none" | "some";
  programmes?: "any" | "none" | "some";
  minIntent?: number;
};

export function sortBillboard(graphs: BillboardRow[], view: BillboardView) {
  const copy = [...graphs];
  if (view === "affiliate") {
    return copy.sort((a, b) => b.scores.affiliate - a.scores.affiliate);
  }
  if (view === "founder") {
    return copy.sort((a, b) => b.scores.founder - a.scores.founder);
  }
  if (view === "intent") {
    return copy.sort((a, b) => b.scores.buyingIntent - a.scores.buyingIntent);
  }
  if (view === "underserved") {
    return copy.sort((a, b) => {
      const gapA = a.scores.founder + (100 - a.scores.competition);
      const gapB = b.scores.founder + (100 - b.scores.competition);
      return gapB - gapA;
    });
  }
  if (view === "growth") {
    return copy.sort((a, b) => b.scores.growth - a.scores.growth);
  }
  if (view === "competition") {
    return copy.sort((a, b) => a.scores.competition - b.scores.competition);
  }
  return copy.sort((a, b) => b.scores.pain - a.scores.pain);
}

export async function listBillboardRows(): Promise<BillboardRow[]> {
  const [graphs, programmes, fitRows, destinationRows] = await Promise.all([
    listPainGraphs(),
    programmeCounts(),
    db.select({ painId: productFits.painId }).from(productFits),
    db
      .select({
        painId: affiliateDestinations.painId,
        country: affiliateDestinations.country,
      })
      .from(affiliateDestinations),
  ]);
  const products = new Map<string, number>();
  for (const row of fitRows) {
    products.set(row.painId, (products.get(row.painId) ?? 0) + 1);
  }
  const countries = new Map<string, Set<string>>();
  for (const row of destinationRows) {
    const set = countries.get(row.painId) ?? new Set<string>();
    if (row.country && row.country !== "*") set.add(row.country);
    countries.set(row.painId, set);
  }
  return graphs.map((graph) => ({
    ...graph,
    productCount: products.get(graph.id) ?? 0,
    programmeCount: programmes.get(graph.id) ?? 0,
    countries: [...(countries.get(graph.id) ?? [])],
  }));
}

export function isBillboardView(value: string | undefined): value is BillboardView {
  return (
    value === "pain" ||
    value === "affiliate" ||
    value === "founder" ||
    value === "intent" ||
    value === "underserved" ||
    value === "growth" ||
    value === "competition"
  );
}

export function filterByCategory(rows: BillboardRow[], category?: string) {
  return filterBillboard(rows, { category });
}

export function filterBillboard(rows: BillboardRow[], filters: BillboardFilters) {
  return rows.filter((row) => {
    if (filters.category && row.category.slug !== filters.category) return false;
    if (
      filters.country &&
      filters.country !== "*" &&
      row.countries.length > 0 &&
      !row.countries.includes(filters.country)
    ) {
      return false;
    }
    if (filters.products === "none" && row.productCount > 0) return false;
    if (filters.products === "some" && row.productCount === 0) return false;
    if (filters.programmes === "none" && row.programmeCount > 0) return false;
    if (filters.programmes === "some" && row.programmeCount === 0) return false;
    if (
      typeof filters.minIntent === "number" &&
      row.scores.buyingIntent < filters.minIntent
    ) {
      return false;
    }
    return true;
  });
}

export function parseBillboardFilters(query: {
  category?: string;
  country?: string;
  products?: string;
  programmes?: string;
  minIntent?: string;
}): BillboardFilters {
  const minIntent = Number(query.minIntent);
  return {
    category: query.category || undefined,
    country: query.country && query.country !== "*" ? query.country : undefined,
    products:
      query.products === "none" || query.products === "some"
        ? query.products
        : "any",
    programmes:
      query.programmes === "none" || query.programmes === "some"
        ? query.programmes
        : "any",
    minIntent: Number.isFinite(minIntent) && minIntent > 0 ? minIntent : undefined,
  };
}

export async function productCountForPain(painId: string) {
  const rows = await db
    .select({ painId: productFits.painId })
    .from(productFits)
    .where(eq(productFits.painId, painId));
  return rows.length;
}
