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

export type ProgrammeKind = "brand" | "retailer" | "network" | "merchant";

export type ProgrammeStatus =
  | "confirmed"
  | "likely"
  | "merchant_needs_confirmation"
  | "sku_needs_confirmation"
  | "none"
  | "manual_research";

export type CatalogProgramme = {
  id: string;
  productId: string;
  name: string;
  kind: ProgrammeKind;
  status: ProgrammeStatus;
  country: string | null;
  joinUrl: string | null;
  note: string;
};

export type CatalogFit = {
  productId: string;
  scores: Record<string, number>;
  note: string;
};

export type CatalogDiagnosticOption = {
  id: string;
  label: string;
  emphasize: string[];
  factors: string[];
  profileLabel: string;
};

export type CatalogDiagnosticQuestion = {
  id: string;
  prompt: string;
  options: CatalogDiagnosticOption[];
};

export type CatalogConsumerIntel = {
  whyItHappens: string;
  triedFirst: string[];
  usuallyFails: string[];
  mistakes: string[];
  tradeoffs: string[];
  profile: string;
  recentlyChanged?: string | null;
  diagnostic: CatalogDiagnosticQuestion[];
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
  consumer?: CatalogConsumerIntel;
};
