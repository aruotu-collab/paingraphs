export type PainScores = {
  pain: number;
  demand: number;
  growth: number;
  buyingIntent: number;
  competition: number;
  affiliate: number;
  founder: number;
  recurrence: number | null;
  dissatisfaction: number | null;
  reachability: number | null;
  confidence: number | null;
  paidAcquisition: number | null;
};

export type PainGraph = {
  id: string;
  slug: string;
  title: string;
  h1: string;
  summary: string;
  explanation: string;
  whyNow: string | null;
  usuallyHelps: string;
  href: string;
  evidenceCount: number;
  sensitive: boolean;
  status: string;
  scores: PainScores;
  category: { slug: string; name: string };
  subcategory: { slug: string; name: string };
};

export type RecommendedProduct = {
  id: string;
  name: string;
  summary: string;
  whoFor: string;
  priceBand: string | null;
  scores: Record<string, number>;
  note: string;
  match: number;
  destinationUrl: string | null;
};

export type PainCriterion = {
  slug: string;
  name: string;
  detail: string;
};

export type PainEvidence = {
  quote: string;
  source: string;
  url: string | null;
};

export type DiagnosticOption = {
  id: string;
  label: string;
  emphasize: string[];
  factors: string[];
  profileLabel: string;
};

export type DiagnosticQuestion = {
  id: string;
  prompt: string;
  options: DiagnosticOption[];
};

export type ConsumerIntel = {
  whyItHappens: string;
  triedFirst: string[];
  usuallyFails: string[];
  mistakes: string[];
  tradeoffs: string[];
  profile: string | null;
  recentlyChanged: string | null;
  diagnostic: DiagnosticQuestion[];
};

export type PainGraphPage = PainGraph & {
  criteria: PainCriterion[];
  evidence: PainEvidence[];
  products: RecommendedProduct[];
  related: PainGraph[];
  consumer: ConsumerIntel;
};

export type Priorities = Record<string, number>;
