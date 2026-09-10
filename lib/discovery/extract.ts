import { CATEGORIES, CLUSTERS, PRODUCTS } from "@/lib/catalog/data";
import { clip, contentTokenList, normalizeText } from "./text";

export type ExtractedSignal = {
  title: string;
  painStatement: string;
  persona: string | null;
  context: string | null;
  jobToBeDone: string | null;
  trigger: string | null;
  frequency: string | null;
  severityLanguage: string | null;
  workaround: string | null;
  productsMentioned: string | null;
  dissatisfaction: string | null;
  moneySignal: string | null;
  willingnessToPay: string | null;
  seekingSolution: boolean;
  geography: string | null;
  categorySlug: string | null;
  clusterSlug: string | null;
  severity: number;
  buyingIntent: number;
  founderOpportunity: number;
  affiliateOpportunity: number;
  confidence: number;
  noise: boolean;
  reason: string;
};

const PAIN_CUES = [
  "hurt",
  "pain",
  "ache",
  "sting",
  "itch",
  "leak",
  "bleed",
  "fail",
  "fails",
  "failed",
  "doesn't",
  "does not",
  "can't",
  "cannot",
  "won't",
  "problem",
  "struggle",
  "worse",
  "broke",
  "broken",
  "useless",
  "disappoint",
  "rustle",
  "pinch",
  "squeeze",
  "slip",
  "fall out",
  "irritat",
  "too loud",
  "too tight",
  "too hot",
  "too heavy",
  "chafe",
  "blister",
  "stink",
  "clog",
  "hazard",
  "recall",
  "injur",
  "unsafe",
];

const SPAM_CUES = [
  "buy now",
  "limited offer",
  "click here",
  "subscribe now",
  "free trial",
  "act now",
  "promo code",
  "order today",
];

const WORKAROUND_CUES = [
  "i tried",
  "i use",
  "so i",
  "instead",
  "workaround",
  "i switched",
  "i loosened",
  "i bought",
  "i started",
  "makeshift",
  "i ended up",
];

const SEEKING_CUES = [
  "looking for",
  "need a",
  "need something",
  "recommend",
  "alternative",
  "any suggestions",
  "what should i",
  "help me find",
  "does anyone",
];

const MONEY_CUES = ["£", "$", "€", "spend", "expensive", "cheap", "price", "paid", "cost"];
const WTP_CUES = ["would pay", "willing to pay", "worth paying", "i'll pay", "budget"];

const DISSATISFACTION_CUES = [
  "hate",
  "fed up",
  "sick of",
  "waste",
  "regret",
  "never again",
  "gave up",
  "still happens",
  "comes back",
];

const FREQUENCY_PATTERNS: [RegExp, string][] = [
  [/\b(every day|daily|all day|every morning)\b/i, "daily"],
  [/\b(every week|weekly)\b/i, "weekly"],
  [/\b(after (an? )?\d+[- ]?(minutes?|hours?)|on calls|after an hour)\b/i, "during use"],
];

const PERSONA_PATTERNS: [RegExp, string][] = [
  [/\b(glasses|spectacles|frames)\b/i, "People who wear glasses"],
  [/\b(office|desk|workday|commute)\b/i, "Office and commute users"],
  [/\b(runn|gym|workout)\b/i, "Active users"],
  [/\b(parent|baby|toddler)\b/i, "Parents"],
  [/\b(incontinence|bladder|pad)\b/i, "People managing bladder leaks"],
];

const GEO_PATTERNS: [RegExp, string][] = [
  [/\b(united kingdom|britain|\buk\b)\b/i, "GB"],
  [/\b(united states|\busa\b|\bu\.s\.|\bus\b)\b/i, "US"],
  [/\bireland\b/i, "IE"],
  [/\bgermany\b/i, "DE"],
  [/\bfrance\b/i, "FR"],
  [/\baustralia\b/i, "AU"],
  [/\bcanada\b/i, "CA"],
];

const CLUSTER_CUES: { slug: string; categorySlug: string; cues: string[] }[] = [
  {
    slug: "headphones",
    categorySlug: "electronics",
    cues: ["headphone", "headset", "earcup", "over-ear", "on-ear", "temple", "glasses"],
  },
  {
    slug: "discreet-protection",
    categorySlug: "personal-care",
    cues: ["incontinence", "bladder", "rustle", "pad", "underwear", "leak"],
  },
  {
    slug: "sunscreen",
    categorySlug: "skincare",
    cues: ["sunscreen", "spf", "sting", "white cast", "uv"],
  },
  {
    slug: "vacuum",
    categorySlug: "home",
    cues: ["vacuum", "hoover", "pet hair", "too loud"],
  },
  {
    slug: "all-day-fit",
    categorySlug: "shoes",
    cues: ["shoe", "blister", "insole", "standing", "heel"],
  },
];

function hasCue(haystack: string, cues: string[]) {
  return cues.some((cue) => haystack.includes(cue));
}

function firstMatchingSentence(text: string, test: (sentence: string) => boolean) {
  const parts = text.split(/(?<=[.?!])\s+/);
  return parts.find((part) => test(part))?.trim() ?? null;
}

function titleFrom(statement: string, raw: string) {
  const source = statement || raw;
  const clipped = source.replace(/\s+/g, " ").trim();
  const sentence = clipped.match(/^.{8,90}?[.?!]/)?.[0] ?? clipped.slice(0, 80);
  return sentence.replace(/["“”]/g, "").trim().replace(/[.]+$/, "");
}

function mentionFrom(text: string, lower: string) {
  const named = PRODUCTS.filter((product) =>
    lower.includes(product.name.toLowerCase()),
  ).map((product) => product.name);
  const generics = [
    "headphones",
    "earbuds",
    "sunscreen",
    "underwear",
    "vacuum",
    "shoes",
    "cream",
    "pads",
  ].filter((word) => lower.includes(word));
  const found = [...new Set([...named, ...generics])];
  return found.length ? found.join(", ") : null;
}

function placeFrom(lower: string) {
  for (const cluster of CLUSTER_CUES) {
    if (cluster.cues.some((cue) => lower.includes(cue))) {
      return cluster;
    }
  }
  for (const cluster of CLUSTERS) {
    if (lower.includes(cluster.name.toLowerCase()) || lower.includes(cluster.slug)) {
      const category = CATEGORIES.find((item) => item.id === cluster.categoryId);
      return { slug: cluster.slug, categorySlug: category?.slug ?? "" };
    }
  }
  for (const category of CATEGORIES) {
    if (lower.includes(category.name.toLowerCase()) || lower.includes(category.slug)) {
      return { slug: "", categorySlug: category.slug };
    }
  }
  return null;
}

export function extractSignal(input: {
  rawText: string;
  persona?: string | null;
  geography?: string | null;
  lenient?: boolean;
}): ExtractedSignal {
  const raw = clip(input.rawText, 4000);
  const lower = normalizeText(raw);
  const words = contentTokenList(raw);
  const spam = hasCue(lower, SPAM_CUES) || (raw.match(/https?:\/\//g) ?? []).length > 2;
  const painHits = PAIN_CUES.filter((cue) => lower.includes(cue)).length;
  const seeking = hasCue(lower, SEEKING_CUES);
  const noise =
    words.length < 4 ||
    spam ||
    (painHits === 0 && !seeking && !input.lenient && raw.length < 40);

  const painStatement =
    firstMatchingSentence(raw, (sentence) =>
      PAIN_CUES.some((cue) => sentence.toLowerCase().includes(cue)),
    ) || raw.replace(/\s+/g, " ").trim().slice(0, 280);

  const workaround =
    firstMatchingSentence(raw, (sentence) =>
      WORKAROUND_CUES.some((cue) => sentence.toLowerCase().includes(cue)),
    ) ||
    (hasCue(lower, WORKAROUND_CUES) ? painStatement : null);

  const dissatisfaction =
    firstMatchingSentence(raw, (sentence) =>
      DISSATISFACTION_CUES.some((cue) => sentence.toLowerCase().includes(cue)),
    ) || null;

  const seekingSolution = seeking;
  const moneySignal = hasCue(lower, MONEY_CUES)
    ? firstMatchingSentence(raw, (sentence) =>
        MONEY_CUES.some((cue) => sentence.toLowerCase().includes(cue)),
      )
    : null;
  const willingnessToPay = hasCue(lower, WTP_CUES)
    ? firstMatchingSentence(raw, (sentence) =>
        WTP_CUES.some((cue) => sentence.toLowerCase().includes(cue)),
      )
    : null;

  let persona = input.persona?.trim() || null;
  if (!persona) {
    persona = PERSONA_PATTERNS.find(([pattern]) => pattern.test(raw))?.[1] ?? null;
  }

  let geography = input.geography?.trim() || null;
  if (!geography) {
    geography = GEO_PATTERNS.find(([pattern]) => pattern.test(raw))?.[1] ?? null;
  }

  const frequency = FREQUENCY_PATTERNS.find(([pattern]) => pattern.test(raw))?.[1] ?? null;
  const severityLanguage =
    firstMatchingSentence(raw, (sentence) =>
      /\b(unbearable|worse|severe|throbbing|after \d+|can't wear)\b/i.test(sentence),
    ) || null;
  const trigger =
    firstMatchingSentence(raw, (sentence) =>
      /\b(after|when|during|on (calls|flights|commute)|sitting|walking)\b/i.test(
        sentence,
      ),
    ) || null;
  const place = placeFrom(lower);
  const productsMentioned = mentionFrom(raw, lower);
  const jobToBeDone =
    firstMatchingSentence(raw, (sentence) =>
      SEEKING_CUES.some((cue) => sentence.toLowerCase().includes(cue)),
    ) ||
    firstMatchingSentence(raw, (sentence) =>
      /\b(so i can|so that|i need|i want)\b/i.test(sentence),
    );

  let confidence = 28;
  if (painHits) confidence += Math.min(24, painHits * 8);
  if (workaround) confidence += 8;
  if (seekingSolution) confidence += 10;
  if (geography) confidence += 6;
  if (place?.slug) confidence += 8;
  if (persona) confidence += 6;
  if (productsMentioned) confidence += 4;
  if (noise) confidence = Math.min(confidence, 25);
  confidence = Math.max(10, Math.min(88, confidence));

  const severity = Math.max(
    35,
    Math.min(90, 48 + painHits * 6 + (severityLanguage ? 10 : 0)),
  );
  const buyingIntent = Math.max(
    20,
    Math.min(
      88,
      40 + (seekingSolution ? 18 : 0) + (moneySignal ? 10 : 0) + (willingnessToPay ? 12 : 0),
    ),
  );
  const founderOpportunity = Math.max(
    30,
    Math.min(85, 50 + (workaround ? 8 : 0) + (dissatisfaction ? 10 : 0) - (productsMentioned ? 6 : 0)),
  );
  const affiliateOpportunity = Math.max(
    20,
    Math.min(80, 36 + (productsMentioned ? 16 : 0) + (seekingSolution ? 10 : 0)),
  );

  return {
    title: titleFrom(painStatement, raw),
    painStatement,
    persona,
    context: frequency || trigger,
    jobToBeDone,
    trigger,
    frequency,
    severityLanguage,
    workaround,
    productsMentioned,
    dissatisfaction,
    moneySignal,
    willingnessToPay,
    seekingSolution,
    geography,
    categorySlug: place?.categorySlug || null,
    clusterSlug: place?.slug || null,
    severity,
    buyingIntent,
    founderOpportunity,
    affiliateOpportunity,
    confidence,
    noise,
    reason: noise
      ? spam
        ? "Promotional or link-heavy text."
        : painHits === 0
          ? "No pain language found."
          : "Too little usable text."
      : "Extracted from the permitted signal only.",
  };
}

export function parseExtraction(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value) as ExtractedSignal;
  } catch {
    return null;
  }
}
