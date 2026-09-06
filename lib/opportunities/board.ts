import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productFits } from "@/lib/db/schema";
import { listPainGraphs } from "@/lib/paingraph/queries";
import type { PainGraph } from "@/lib/paingraph/types";
import { programmeCounts } from "@/lib/programmes/store";

export type BillboardView =
  | "pain"
  | "affiliate"
  | "founder"
  | "intent"
  | "underserved";

export type BillboardRow = PainGraph & {
  productCount: number;
  programmeCount: number;
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
  return copy.sort((a, b) => b.scores.pain - a.scores.pain);
}

export async function listBillboardRows(): Promise<BillboardRow[]> {
  const [graphs, programmes, fitRows] = await Promise.all([
    listPainGraphs(),
    programmeCounts(),
    db.select({ painId: productFits.painId }).from(productFits),
  ]);
  const products = new Map<string, number>();
  for (const row of fitRows) {
    products.set(row.painId, (products.get(row.painId) ?? 0) + 1);
  }
  return graphs.map((graph) => ({
    ...graph,
    productCount: products.get(graph.id) ?? 0,
    programmeCount: programmes.get(graph.id) ?? 0,
  }));
}

export function isBillboardView(value: string | undefined): value is BillboardView {
  return (
    value === "pain" ||
    value === "affiliate" ||
    value === "founder" ||
    value === "intent" ||
    value === "underserved"
  );
}

export function filterByCategory(rows: BillboardRow[], category?: string) {
  if (!category) return rows;
  return rows.filter((row) => row.category.slug === category);
}

export async function productCountForPain(painId: string) {
  const rows = await db
    .select({ painId: productFits.painId })
    .from(productFits)
    .where(eq(productFits.painId, painId));
  return rows.length;
}
