export type Opportunity = {
  slug: string;
  title: string;
  industry: string;
  niche: string;
  country: string;
  persona: string;
  demand: number;
  pain: number;
  intent: number;
  competition: number;
  growth: number;
  buildability: number;
  score: number;
  confidence: number;
  signalCount: number;
  trend: number[];
  workarounds: string[];
  solutions: { name: string; gap: string }[];
  quotes: { source: string; date: string; text: string }[];
  why: string;
};

export const sampleOpportunities: Opportunity[] = [
  {
    slug: "automated-client-reporting",
    title: "Automated client reporting",
    industry: "Professional services",
    niche: "Agencies",
    country: "US",
    persona: "Agency owner",
    demand: 92,
    pain: 88,
    intent: 94,
    competition: 61,
    growth: 34,
    buildability: 81,
    score: 89,
    confidence: 78,
    signalCount: 1842,
    trend: [42, 44, 48, 51, 55, 58, 63, 68, 71, 76, 81, 89],
    workarounds: ["Manual slide decks", "VA transcription", "Notion docs"],
    solutions: [
      { name: "Generic meeting notes tools", gap: "Weak client-ready formatting" },
      { name: "BI dashboards", gap: "Too heavy for agencies" },
    ],
    quotes: [
      {
        source: "Reddit",
        date: "12 days ago",
        text: "Our agency spends hours turning client calls into status reports. Has anyone automated this?",
      },
      {
        source: "GitHub Discussions",
        date: "3 weeks ago",
        text: "We stitch Zoom transcripts into Google Docs every Friday. There has to be a better way.",
      },
    ],
    why: "High commercial intent, users currently stitch together three tools, and mention volume is up 34% in 90 days.",
  },
  {
    slug: "freelancer-invoice-chasing",
    title: "Freelancer invoice chasing",
    industry: "Freelance",
    niche: "Independent contractors",
    country: "UK",
    persona: "Freelancer",
    demand: 96,
    pain: 91,
    intent: 86,
    competition: 72,
    growth: 21,
    buildability: 94,
    score: 87,
    confidence: 84,
    signalCount: 3210,
    trend: [61, 63, 64, 66, 68, 70, 72, 74, 78, 81, 84, 87],
    workarounds: ["Spreadsheets", "Late-night email chases", "Accounting software reminders"],
    solutions: [
      { name: "Generic invoicing apps", gap: "Reminders feel awkward and get ignored" },
    ],
    quotes: [
      {
        source: "Reddit",
        date: "5 days ago",
        text: "I spend more time chasing invoices than doing the work. I'll pay for something that does this politely but firmly.",
      },
    ],
    why: "Very high frequency, software-solvable, and existing tools leave a gap around chase tone and persistence.",
  },
  {
    slug: "airbnb-turnover-coordination",
    title: "Airbnb turnover coordination",
    industry: "Hospitality",
    niche: "Short-term rental hosts",
    country: "US",
    persona: "Property manager",
    demand: 78,
    pain: 95,
    intent: 90,
    competition: 48,
    growth: 62,
    buildability: 76,
    score: 90,
    confidence: 71,
    signalCount: 964,
    trend: [28, 30, 31, 34, 38, 44, 49, 55, 62, 71, 80, 90],
    workarounds: ["WhatsApp groups", "Shared calendars", "Paper checklists"],
    solutions: [
      { name: "PMS platforms", gap: "Overkill and poor cleaner UX" },
    ],
    quotes: [
      {
        source: "Forum",
        date: "2 days ago",
        text: "Every Friday I coordinate cleaners across three portals. Missed turnovers cost me a night's revenue.",
      },
    ],
    why: "Fastest-growing cluster in the sample set, high pain, and relatively weak software coverage.",
  },
  {
    slug: "lead-follow-up-leakage",
    title: "Lead follow-up leakage",
    industry: "Real estate",
    niche: "Estate agents",
    country: "UK",
    persona: "Branch manager",
    demand: 88,
    pain: 92,
    intent: 91,
    competition: 66,
    growth: 18,
    buildability: 85,
    score: 92,
    confidence: 80,
    signalCount: 2130,
    trend: [70, 71, 72, 74, 76, 77, 79, 82, 84, 87, 90, 92],
    workarounds: ["Phone calls", "WhatsApp", "Spreadsheet trackers"],
    solutions: [
      { name: "Estate CRMs", gap: "Follow-up still depends on staff memory" },
    ],
    quotes: [
      {
        source: "Forum",
        date: "8 days ago",
        text: "We get loads of enquiries but staff don't follow them up properly. Jobs are going cold.",
      },
    ],
    why: "Strong buying language, recurring operational cost, and a clear software-shaped gap in existing CRMs.",
  },
  {
    slug: "trades-quote-follow-up",
    title: "Quote follow-up for small trades",
    industry: "Construction",
    niche: "Independent trades",
    country: "UK",
    persona: "Owner-operator",
    demand: 84,
    pain: 86,
    intent: 93,
    competition: 44,
    growth: 27,
    buildability: 88,
    score: 91,
    confidence: 76,
    signalCount: 1477,
    trend: [48, 50, 52, 55, 57, 61, 64, 69, 73, 79, 85, 91],
    workarounds: ["WhatsApp", "Notebook quotes", "Manual callbacks"],
    solutions: [
      { name: "Job management apps", gap: "Built for offices, not vans" },
    ],
    quotes: [
      {
        source: "Reddit",
        date: "4 days ago",
        text: "Any tradespeople using something that automatically chases quotes? We're losing jobs because I'm terrible at following up.",
      },
    ],
    why: "Explicit request for software, correct persona, and few incumbents mentioned in the sample conversations.",
  },
];

export function searchOpportunities(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return sampleOpportunities;

  const stop = new Set(["the", "a", "an", "in", "for", "and", "of", "to"]);
  const words = q.split(/\s+/).filter((word) => word.length > 1 && !stop.has(word));

  const scored = sampleOpportunities
    .map((item) => {
      const haystack = [item.title, item.industry, item.niche, item.country, item.persona]
        .join(" ")
        .toLowerCase();
      const hits = words.filter((word) => haystack.includes(word)).length;
      return { item, hits };
    })
    .filter(({ hits, item }) => {
      const haystack = [item.title, item.industry, item.niche, item.persona]
        .join(" ")
        .toLowerCase();
      const specificWords = words.filter((word) => word.length > 2);
      if (specificWords.length === 0) return hits > 0;
      return specificWords.some((word) => haystack.includes(word));
    })
    .sort((a, b) => b.hits - a.hits)
    .map(({ item }) => item);

  return scored;
}

export function getOpportunity(slug: string) {
  return sampleOpportunities.find((item) => item.slug === slug);
}

export const radarItems = [...sampleOpportunities]
  .sort((a, b) => b.growth - a.growth)
  .slice(0, 4);
