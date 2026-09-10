import { PAINS } from "@/lib/catalog/data";
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
}): CampaignBriefBody {
  const pain = PAINS.find((item) => item.id === input.graph.id);
  const phrases = pain?.searchPhrases ?? [];
  const title = input.graph.title.toLowerCase();
  const direct = unique([title, ...phrases.slice(0, 4), `${title} problem`]);
  const solution = unique([
    `${title} solution`,
    `best ${title}`,
    ...phrases.map((phrase) => phrase.replace(/\b(hurt|sting|fail|rub)\b/g, "relief")),
    "what helps",
  ]);
  const comparison = unique([
    `${title} vs`,
    `${title} alternative`,
    "compared to",
    ...input.productNames.slice(0, 3).map((name) => `${name} alternative`),
  ]);
  const product = unique(input.productNames.slice(0, 6));
  const landingHref = input.destinationUrl || input.graph.href;
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
    landing: {
      href: landingHref,
      note: input.destinationUrl
        ? "Use the destination you already created. PainGraphs will not invent a HopLink or marketplace search URL."
        : "Land on the public PainGraph until a real destination exists.",
    },
    cta,
    policyRisk: input.graph.sensitive
      ? "Sensitive category. Review health and personal-care ad policies before spending."
      : `Standard product research. Country ${input.country === "*" ? "unspecified" : input.country}. Confirm trademark and destination policy.`,
    tracking: [
      "Use a tracking URL you already created.",
      "Public Check price still goes through /go.",
      "Do not raise fit score because an ad pays more.",
    ],
    breakEvenCpc:
      "Not enough conversion economics yet. Break-even CPC waits for revenue per click or a recorded merchant conversion rate.",
  };
}

export function isBriefObjective(value: string): value is BriefObjective {
  return BRIEF_OBJECTIVES.includes(value as BriefObjective);
}
