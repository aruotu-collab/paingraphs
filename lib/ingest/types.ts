export type FetchedDoc = {
  sourceSlug: string;
  externalId: string;
  url: string;
  title: string;
  body: string;
  author: string | null;
  publishedAt: Date | null;
};

export type ExtractedSignal = {
  quote: string;
  problemTitle: string;
  summary: string;
  personaGuess: string | null;
  workaround: string | null;
  intensity: number;
  purchaseIntent: number;
  industryHint: string | null;
  nicheHint: string | null;
  countryHint: "UK" | "US" | "GLOBAL";
  templateSlug: string | null;
};

export type IngestMode = "full" | "cron";

export type IngestStats = {
  documents: number;
  newDocuments: number;
  signals: number;
  problems: number;
  sources: string[];
  skipped: string[];
};
