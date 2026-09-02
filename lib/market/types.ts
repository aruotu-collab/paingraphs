export type MarketPain = {
  id: string;
  slug: string;
  title: string;
  h1: string;
  problem: string;
  analysis: string;
  whyNow: string | null;
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
  evidenceCount: number;
  category: { slug: string; name: string };
  cluster: { slug: string; name: string };
  href: string;
};

export type PainPage = MarketPain & {
  criteria: { slug: string; name: string; detail: string }[];
  signals: { quote: string; source: string; url: string | null }[];
  products: {
    id: string;
    name: string;
    summary: string;
    whoFor: string;
    searchQuery: string;
    priceBand: string | null;
    scores: Record<string, number>;
    note: string;
    match: number;
  }[];
  related: MarketPain[];
};

export type Priorities = Record<string, number>;
