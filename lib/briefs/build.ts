import { PAINS } from "@/lib/catalog/data";
import {
  breakEvenCpcCopy,
  landingReadinessNote,
} from "@/lib/paingraph/paid";
import type { PainGraph } from "@/lib/paingraph/types";

export const BRIEF_OBJECTIVES = ["traffic", "conversions", "awareness"] as const;
export type BriefObjective = (typeof BRIEF_OBJECTIVES)[number];

export type CampaignBriefBody = {
  keywords: {
    direct: string[];
    solution: string[];
    comparison: string[];
    product: string[];
  };
  negatives: string[];
  adGroups: { name: string; keywords: string[] }[];
  headlines: string[];
  descriptions: string[];
  landing: { href: string; note: string };
  cta: string;
  policyRisk: string;
  tracking: string[];
  breakEvenCpc: string;
};

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 8);
}

export function buildCampaignBrief(input: {
  graph: PainGraph;
  country: string;
  destinationUrl?: string | null;
  dailyBudget?: string | null;
  objective: BriefObjective;
  productNames: string[];
  clicks?: number;
  revenue?: number;
  conversions?: number;
  currency?: string;
}): CampaignBriefBody {
  const pain = PAINS.find((item) => item.id === input.graph.id);
  const phrases = pain?.searchPhrases ?? [];
  const title = input.graph.title.toLowerCase();
  const direct = unique([
    title,
    ...phrases.slice(0, 4),
    `${title} problem`,
    input.graph.summary.split(/[.!?]/)[0]?.toLowerCase() ?? "",
  ]);
  const solution = unique([
    `${title} solution`,
    `best ${title}`,
    ...phrases.map((phrase) =>
      phrase
        .replace(/\b(don't|do not|does not)\s+(hurt|sting|fail|rub)\b/g, "comfortable")
        .replace(/\b(hurt|sting|fail|rub)\b/g, "relief"),
    ),
    "what helps",
  ]);
  const comparison = unique([
    `${title} vs`,
    `${title} alternative`,
    "compared to",
    ...input.productNames.slice(0, 3).map((name) => `${name} alternative`),
  ]);
  const product = unique(input.productNames.slice(0, 6));
  const landing = landingReadinessNote({
    published: input.graph.status === "published",
    destinationUrl: input.destinationUrl,
    publicHref: input.graph.href,
  });
  const cta =
    input.objective === "conversions"
      ? "See the fit-ranked options"
      : input.objective === "awareness"
        ? "Understand this pain"
        : "Open the PainGraph";

  return {
    keywords: { direct, solution, comparison, product },
    negatives: unique([
      "free",
      "diy",
      "cheap knockoff",
      "torrent",
      "login",
      input.graph.sensitive ? "miracle cure" : "",
      "jobs",
      "salary",
    ]),
    adGroups: [
      { name: "Direct pain", keywords: direct },
      { name: "Solution seeking", keywords: solution },
      { name: "Comparison", keywords: comparison },
    ],
    headlines: unique([
      input.graph.title.slice(0, 30),
      "What usually helps",
      input.productNames[0]?.slice(0, 30) ?? "Ranked options",
      "Fit, not commission",
    ]),
    descriptions: unique([
      input.graph.summary.slice(0, 90),
      "Recommendations follow your preferences. Commercial links are disclosed.",
      input.dailyBudget
        ? `Draft only. Daily budget target ${input.dailyBudget}. PainGraphs does not launch ads.`
        : "Draft only. PainGraphs does not launch ads.",
    ]),
    landing,
    cta,
    policyRisk: input.graph.sensitive
      ? "Sensitive category. Review health and personal-care ad policies before spending."
      : `Standard product research. Country ${input.country === "*" ? "unspecified" : input.country}. Confirm trademark and destination policy.`,
    tracking: [
      "Use a tracking URL you already created.",
      "Public Check price still goes through /go.",
      "Do not raise fit score because an ad pays more.",
    ],
    breakEvenCpc: breakEvenCpcCopy({
      clicks: input.clicks ?? 0,
      revenue: input.revenue ?? 0,
      conversions: input.conversions ?? 0,
      currency: input.currency,
    }),
  };
}

export function isBriefObjective(value: string): value is BriefObjective {
  return BRIEF_OBJECTIVES.includes(value as BriefObjective);
}
