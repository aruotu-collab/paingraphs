import { overlap } from "@/lib/ingest/text";
import { campaignPackForPain, defaultQuestions } from "./campaign";
import type { PainHypothesisView, ProductDna } from "./types";
import type { MarketPain, PainPage } from "@/lib/market/types";

export function scoreCatalogPains(dna: ProductDna, pains: MarketPain[]) {
  const query = [
    dna.name,
    dna.solves,
    dna.forWho,
    dna.when,
    dna.summary,
    ...dna.keywords,
  ]
    .filter((value) => value && value !== "Not stated on the page")
    .join(" ");

  return pains
    .map((pain) => {
      const hay = `${pain.title} ${pain.h1} ${pain.problem} ${pain.analysis} ${pain.cluster.name}`;
      const score = Math.round(
        (overlap(query, hay) * 0.7 + overlap(dna.solves, pain.problem) * 0.3) * 100,
      );
      return { pain, score };
    })
    .filter((row) => row.score >= 18)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
}

export function catalogToHypothesis(
  pain: MarketPain,
  score: number,
  page: PainPage | null,
): PainHypothesisView {
  const quotes = page?.signals.slice(0, 3).map((item) => item.quote) ?? [];
  const packPage = page ?? {
    ...pain,
    criteria: [],
    signals: [],
    products: [],
    related: [],
  };
  return {
    title: pain.title,
    h1: pain.h1,
    problem: pain.problem,
    audience: `${pain.category.name} · ${pain.cluster.name}`,
    analysis: pain.analysis,
    unmetNeed: page?.products[0]?.note ?? pain.strategy,
    matchScore: score,
    origin: "catalog",
    catalogHref: pain.href,
    customerLanguage: quotes,
    questions: defaultQuestions(pain.title),
    campaignPack: campaignPackForPain(packPage),
  };
}
