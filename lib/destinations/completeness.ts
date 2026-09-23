import { listPainGraphs } from "@/lib/paingraph/queries";
import { listDestinationsForPain, productsForPain } from "./store";

export type DestinationGap = {
  id: string;
  title: string;
  href: string;
  status: string;
  products: number;
  linked: number;
  missing: string[];
};

export async function listDestinationGaps(): Promise<DestinationGap[]> {
  const graphs = await listPainGraphs();
  const rows = await Promise.all(
    graphs.map(async (graph) => {
      const [products, destinations] = await Promise.all([
        productsForPain(graph.id),
        listDestinationsForPain(graph.id),
      ]);
      const linkedIds = new Set(
        destinations
          .filter((row) => row.url?.trim())
          .map((row) => row.productId),
      );
      const missing = products
        .filter((product) => !linkedIds.has(product.id))
        .map((product) => product.name);
      return {
        id: graph.id,
        title: graph.title,
        href: graph.href,
        status: graph.status,
        products: products.length,
        linked: products.length - missing.length,
        missing,
      };
    }),
  );
  return rows.sort(
    (left, right) =>
      right.missing.length - left.missing.length ||
      left.title.localeCompare(right.title),
  );
}
