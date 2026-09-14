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
      opening: catalog.opening?.trim() || null,
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
    opening: null,
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
  const jobs = criteria.slice(0, 5).map((item) => ({
    id: item.slug,
    label: item.name,
    emphasize: [item.slug],
    factors: [item.name.toLowerCase()],
    profileLabel: item.name,
  }));
  if (jobs.length === 0) return [];
  const lead = jobs.slice(0, 2).map((item) => item.id);
  const leadNames = jobs.slice(0, 2).map((item) => item.label.toLowerCase());
  return [
    {
      id: "bother",
      prompt: "What bothers you most?",
      ask: "When this happens, what bothers you most? Pick from the list.",
      chart: "What bothers you",
      control: "list",
      options: jobs.map((option) => ({
        ...option,
        hear: `${option.label}. I’ll put that first for you.`,
        nextAsk: "How bad is it? Drag until it feels right.",
      })),
    },
    {
      id: "severity",
      prompt: "How bad is it?",
      ask: "How bad is it?",
      chart: "How bad",
      control: "slider",
      sliderLow: "A bit annoying",
      sliderHigh: "I have to stop",
      options: [
        {
          id: "nudge",
          label: "A bit annoying — I live with it",
          emphasize: [],
          factors: [],
          profileLabel: "a bit annoying",
          hear: "A bit annoying. We should still fix it. You should not have to ignore it.",
          nextAsk: "How often does this happen? Drag to match.",
        },
        {
          id: "adjust",
          label: "I keep working around it",
          emphasize: lead,
          factors: leadNames,
          profileLabel: "you work around it",
          hear: "You keep working around it. That means it is not really working.",
          nextAsk: "How often does this happen? Drag to match.",
        },
        {
          id: "off",
          label: "I stop using it to feel better",
          emphasize: lead,
          factors: leadNames,
          profileLabel: "you stop using it",
          hear: "You stop using it. The next one has to last as long as you need.",
          nextAsk: "How often did you need it to work? Drag to match.",
        },
        {
          id: "stop",
          label: "It stops my day",
          emphasize: criteria.slice(0, 3).map((item) => item.slug),
          factors: criteria.slice(0, 3).map((item) => item.name.toLowerCase()),
          profileLabel: "it stops your day",
          hear: "It stops your day. Feeling okay is the whole point.",
          nextAsk: "How often does this happen? Drag to match.",
        },
      ],
    },
    {
      id: "frequency",
      prompt: "How often does this happen?",
      ask: "How often does this happen?",
      chart: "How often",
      control: "slider",
      sliderLow: "Now and then",
      sliderHigh: "Most of the day",
      options: [
        {
          id: "sometimes",
          label: "Now and then",
          emphasize: [],
          factors: [],
          profileLabel: "now and then",
          hear: "Now and then. We still need to know why, so the next buy is not a guess.",
          nextAsk: "When does this matter most?",
        },
        {
          id: "weekly",
          label: "A few times a week",
          emphasize: jobs[0] ? [jobs[0].id] : [],
          factors: [],
          profileLabel: "a few times a week",
          hear: "A few times a week. Often enough that the wrong pair will keep costing you.",
          nextAsk: "When does this matter most?",
        },
        {
          id: "daily",
          label: "Every day",
          emphasize: lead,
          factors: leadNames,
          profileLabel: "every day",
          hear: "Every day. Then we should not guess.",
          nextAsk: "When does this matter most?",
        },
        {
          id: "constant",
          label: "Most of the day",
          emphasize: criteria.slice(0, 3).map((item) => item.slug),
          factors: criteria.slice(0, 3).map((item) => item.name.toLowerCase()),
          profileLabel: "most of the day",
          hear: "Most of the day. The fit has to be right, or you will keep taking it off.",
          nextAsk: "When does this matter most?",
        },
      ],
    },
    {
      id: "stakes",
      prompt: "When does this matter most?",
      ask: "When does this matter most?",
      chart: "When it matters",
      control: "choice",
      options: [
        {
          id: "work",
          label: "At work or a long day out",
          emphasize: lead,
          factors: leadNames,
          profileLabel: "at work",
          hear: "At work. Then a wrong buy keeps costing you. We should not guess from a generic list.",
        },
        {
          id: "home",
          label: "At home",
          emphasize: jobs[0] ? [jobs[0].id] : [],
          factors: jobs[0] ? [jobs[0].label.toLowerCase()] : [],
          profileLabel: "at home",
          hear: "At home. Feeling okay can come first. We still need to know why, so you don't buy the same miss in a nicer pack.",
        },
        {
          id: "out",
          label: "Out in public",
          emphasize: lead,
          factors: leadNames,
          profileLabel: "out in public",
          hear: "Out in public. How it looks and how it feels both matter. A #1 list often hides that.",
        },
        {
          id: "always",
          label: "All of those",
          emphasize: criteria.slice(0, 3).map((item) => item.slug),
          factors: criteria.slice(0, 3).map((item) => item.name.toLowerCase()),
          profileLabel: "most of the time",
          hear: "All of those. Then we start with what bothers you most, and we say the downside out loud.",
        },
      ],
    },
  ];
}
