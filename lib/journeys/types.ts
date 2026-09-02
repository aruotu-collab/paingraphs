export type ProductDna = {
  name: string;
  solves: string;
  forWho: string;
  when: string;
  competingAgainst: string;
  price: string;
  keywords: string[];
  summary: string;
  mechanism?: string;
  outcomes?: string[];
  audiences?: string[];
};

export type PageExtract = {
  url: string;
  title: string;
  description: string;
  siteName: string;
  headings: string[];
  text: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  kind: "yesno" | "scale" | "choice" | "price";
  options?: string[];
};

export type MetaAngle = {
  name: string;
  primaryText: string;
  headline: string;
  cta: string;
  creativeBrief: string;
};

export type CampaignPack = {
  meta: {
    objective: string;
    pain: string;
    audience: string;
    destinationUrl: string;
    trackingUrl: string;
    angles: MetaAngle[];
  };
  google: {
    campaignName: string;
    keywords: string[];
    negatives: string[];
    headlines: string[];
    descriptions: string[];
    destinationUrl: string;
    budgetHint: string;
    conversionEvents: string[];
  };
  email: { subject: string; preview: string; body: string };
  seo: { title: string; keywords: string[]; outline: string[] };
  organic?: {
    keywords: string[];
    articles: string[];
    faqs: string[];
    internalLinks: string[];
    calendar: string[];
    videoScript: string;
  };
  affiliate?: { name: string; url: string; reasons: string[] };
};

export type PainHypothesisView = {
  id?: string;
  slug?: string;
  title: string;
  h1: string;
  problem: string;
  audience: string;
  analysis: string;
  unmetNeed: string;
  matchScore: number;
  origin: "catalog" | "inside-out";
  catalogHref?: string;
  customerLanguage: string[];
  questions: QuizQuestion[];
  campaignPack: CampaignPack;
  locked?: boolean;
};

export type ProductScanView = {
  scanId: string | null;
  signedIn: boolean;
  url: string;
  dna: ProductDna;
  items: PainHypothesisView[];
};
