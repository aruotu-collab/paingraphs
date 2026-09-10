import { overlapScore } from "@/lib/discovery/text";
import type { PainGraph } from "@/lib/paingraph/types";

export type ProductMatch = {
  graph: PainGraph;
  score: number;
  highIntent: boolean;
  rising: boolean;
};

export function matchProductToPains(
  product: {
    name: string;
    description: string;
    problemsSolved?: string | null;
    features?: string | null;
    categorySlug?: string | null;
    positioning?: string | null;
  },
  graphs: PainGraph[],
): ProductMatch[] {
  const query = [
    product.name,
    product.description,
    product.problemsSolved,
    product.features,
    product.positioning,
    product.categorySlug,
  ]
    .filter(Boolean)
    .join(" ");
  return graphs
    .map((graph) => {
      const score = Math.max(
        overlapScore(query, `${graph.title} ${graph.summary}`),
        overlapScore(product.name, graph.title),
        product.categorySlug && graph.category.slug === product.categorySlug
          ? 0.22
          : 0,
      );
      return {
        graph,
        score,
        highIntent: graph.scores.buyingIntent >= 75,
        rising: graph.scores.growth >= 40,
      };
    })
    .filter((row) => row.score >= 0.16)
    .sort((a, b) => b.score - a.score || b.graph.scores.buyingIntent - a.graph.scores.buyingIntent);
}

export function matchSummary(matches: ProductMatch[]) {
  return {
    total: matches.length,
    highIntent: matches.filter((row) => row.highIntent).length,
    rising: matches.filter((row) => row.rising).length,
  };
}
