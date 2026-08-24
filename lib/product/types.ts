export type ProblemDna = {
  name: string;
  solves: string;
  forWho: string;
  when: string;
  competingAgainst: string;
  keywords: string[];
  summary: string;
};

export type PageExtract = {
  url: string;
  title: string;
  description: string;
  siteName: string;
  headings: string[];
  text: string;
};

export type ConversationMatch = {
  id: string;
  fit: number;
  intent: number;
  recency: number;
  why: string;
  quote: string;
  source: string;
  url: string;
  date: string;
  problemTitle: string;
  problemSlug: string;
};

export type ProductSnapshot = {
  id: string;
  url: string;
  name: string;
  dna: ProblemDna;
  matches: ConversationMatch[];
  analysedAt: string;
};
