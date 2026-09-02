export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  summary: string;
};

export type CatalogCluster = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  summary: string;
};

export type CatalogCriterion = {
  slug: string;
  name: string;
  detail: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  whoFor: string;
  searchQuery: string;
  priceBand: string;
};

export type CatalogFit = {
  productId: string;
  scores: Record<string, number>;
  note: string;
};

export type CatalogSignal = {
  rawQuote: string;
  sourceKind: "composite" | "youtube" | "review" | "search" | "first-party";
  sourceLabel: string;
};

export type CatalogPain = {
  id: string;
  clusterId: string;
  slug: string;
  title: string;
  h1: string;
  problem: string;
  analysis: string;
  whyNow: string;
  strategy: string;
  stage: number;
  painScore: number;
  intentScore: number;
  competitionScore: number;
  productGap: number;
  affiliateScore: number;
  organicScore: number;
  opportunity: number;
  trend: number;
  sensitive: boolean;
  related: string[];
  searchPhrases: string[];
  youtubeQueries: string[];
  criteria: CatalogCriterion[];
  products: CatalogFit[];
  signals: CatalogSignal[];
};
