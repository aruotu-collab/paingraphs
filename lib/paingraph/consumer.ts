import type { CatalogConsumerIntel } from "@/lib/catalog/types";
import type {
  ConsumerIntel,
  DiagnosticQuestion,
  PainCriterion,
} from "./types";

export function consumerIntelFor(
  catalog: CatalogConsumerIntel | undefined,
  explanation: string,
  whyNow: string | null,
  criteria: PainCriterion[],
): ConsumerIntel {
  if (catalog) {
    return {
      whyItHappens: catalog.whyItHappens,
      triedFirst: catalog.triedFirst,
      usuallyFails: catalog.usuallyFails,
      mistakes: catalog.mistakes,
      tradeoffs: catalog.tradeoffs,
      profile: catalog.profile,
      recentlyChanged: catalog.recentlyChanged ?? null,
      diagnostic: catalog.diagnostic,
    };
  }
  return {
    whyItHappens: explanation,
    triedFirst: [],
    usuallyFails: [],
    mistakes: [],
    tradeoffs: criteria.slice(0, 3).map((item) => item.detail),
    profile: whyNow,
    recentlyChanged: null,
    diagnostic: fallbackDiagnostic(criteria),
  };
}

function fallbackDiagnostic(criteria: PainCriterion[]): DiagnosticQuestion[] {
  const options = criteria.slice(0, 5).map((item) => ({
    id: item.slug,
    label: item.name,
    emphasize: [item.slug],
    factors: [item.name.toLowerCase()],
    profileLabel: item.name,
  }));
  if (options.length === 0) return [];
  return [
    {
      id: "bother",
      prompt: "What bothers you most?",
      options,
    },
    {
      id: "frequency",
      prompt: "How often does this show up?",
      options: [
        {
          id: "sometimes",
          label: "Occasionally",
          emphasize: [],
          factors: [],
          profileLabel: "occasional",
        },
        {
          id: "weekly",
          label: "Several times a week",
          emphasize: options[0] ? [options[0].id] : [],
          factors: [],
          profileLabel: "several times a week",
        },
        {
          id: "daily",
          label: "Daily",
          emphasize: criteria.slice(0, 2).map((item) => item.slug),
          factors: criteria.slice(0, 2).map((item) => item.name.toLowerCase()),
          profileLabel: "daily",
        },
        {
          id: "constant",
          label: "Most of the day",
          emphasize: criteria.slice(0, 3).map((item) => item.slug),
          factors: criteria.slice(0, 3).map((item) => item.name.toLowerCase()),
          profileLabel: "most of the day",
        },
      ],
    },
  ];
}
