export type BillboardSource = {
  title: string;
  url: string;
};

export type BillboardTopic = {
  id: string;
  slug: string;
  title: string;
  problem: string;
  whyNow: string;
  categorySlug: string;
  categoryName: string;
  searchPhrase: string;
  evidence: string;
  sources: BillboardSource[];
  heat: number;
  intent: number;
  pain: number;
  rank: number;
  daysOnChart: number;
  chartDate: string;
  painId: string | null;
  painHref: string | null;
};
