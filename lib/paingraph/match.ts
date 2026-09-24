import type {
  PainCriterion,
  PainEvidence,
  RecommendedProduct,
} from "./types";

export const IMPORTANCE_LABELS = [
  "Not important",
  "Slightly important",
  "Slightly important",
  "Slightly important",
  "Somewhat important",
  "Somewhat important",
  "Important",
  "Important",
  "Very important",
  "Very important",
  "Deal breaker",
] as const;

export type Importance = number;

export const CONCERN_COLORS = [
  "#e25b4c",
  "#f0a12a",
  "#d9b51a",
  "#2fbf6a",
  "#2bb8c8",
  "#4d78ff",
  "#6f5cff",
  "#e35d9a",
  "#2a9a68",
];

export function concernColor(index: number) {
  return CONCERN_COLORS[index % CONCERN_COLORS.length];
}

export function productColor(index: number) {
  return ["#2fbf6a", "#2bb8c8", "#4d78ff", "#6f5cff"][index % 4];
}

export type PainProfile = {
  importances: Record<string, number>;
  breakers: string[];
};

export type MatchBand = "Excellent" | "Strong" | "Moderate" | "Weak";

export type CellMatch = {
  slug: string;
  name: string;
  score: number;
  stars: number;
  band: MatchBand;
  reason: string;
};

export type RankedMatch = RecommendedProduct & {
  match: number;
  band: MatchBand;
  stars: number;
  bestFor: string[];
  broken: string[];
  warned: string[];
  blocked: boolean;
  loves: string[];
  regrets: string[];
  why: string;
};

export function defaultProfile(slugs: string[]): PainProfile {
  const preset = [9, 8, 6, 7, 8, 4, 7, 3, 5, 7];
  const importances: Record<string, number> = {};
  slugs.forEach((slug, index) => {
    importances[slug] = preset[index] ?? 5;
  });
  return { importances, breakers: [] };
}

export function parseProfile(raw: unknown, slugs: string[]): PainProfile {
  const fallback = defaultProfile(slugs);
  if (!raw || typeof raw !== "object") return fallback;
  const value = raw as {
    importances?: Record<string, unknown>;
    breakers?: unknown;
    [key: string]: unknown;
  };
  if (value.importances && typeof value.importances === "object") {
    const importances: Record<string, number> = {};
    const rawValues = slugs.map((slug) => Number(value.importances?.[slug] ?? 0));
    const max = Math.max(...rawValues, 0);
    const scaled = max <= 3;
    for (const slug of slugs) {
      const next = Number(value.importances[slug] ?? 0);
      importances[slug] = scaled ? fromLegacy(next) : clampLevel(next);
    }
    const breakers = Array.isArray(value.breakers)
      ? value.breakers.filter(
          (item): item is string =>
            typeof item === "string" && slugs.includes(item),
        )
      : [];
    return { importances, breakers };
  }
  const shares = slugs.map((slug) => Number(value[slug] || 0));
  const max = Math.max(...shares, 0);
  const min = Math.min(...shares.filter((share) => share > 0), max);
  if (max <= 0 || max - min <= 6) return fallback;
  const importances: Record<string, number> = {};
  slugs.forEach((slug, index) => {
    importances[slug] = clampLevel(
      Math.round((shares[index] / max) * 10),
    );
  });
  return { importances, breakers: [] };
}

export function concernName(criterion: PainCriterion) {
  const names: Record<string, string> = {
    clamp: "Temple pinch with glasses",
    weight: "Weight on your head",
    heat: "Heat on long calls",
    isolation: "Blocking outside noise",
    price: "Keeping the price down",
    noise: "Noise that gives you away",
    bulk: "Showing under clothes",
    absorbency: "Lasting long enough",
    comfort: "Comfort against the skin",
    sting: "Sting around the eyes",
    wear: "Sitting under makeup",
    cast: "White film",
    protection: "Staying on after sweat",
    motion: "Looking threatening",
    pickup: "Picking up hair",
    schedule: "Running without you",
    width: "Room over the joint",
    seam: "A seam on the joint",
    cushion: "Cushion for standing",
    look: "Looking like shoes you will wear",
    range: "Range that lasts the commute",
    hills: "Hills and stop-start",
    lift: "Lifting and carrying",
    weather: "Cold and wet days",
  };
  if (criterion.name && criterion.name.toLowerCase() !== criterion.slug) {
    return criterion.name;
  }
  return names[criterion.slug] || criterion.name;
}

export function importanceLabel(value: number) {
  return IMPORTANCE_LABELS[clampLevel(value)] || "Important";
}

export function matchBand(score: number): MatchBand {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Moderate";
  return "Weak";
}

export function matchStars(score: number) {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 40) return 2;
  return 1;
}

export function evidenceConfidence(evidenceCount: number) {
  if (evidenceCount >= 20) return "High";
  if (evidenceCount >= 8) return "Medium";
  return "Low";
}

export function rankMatches(
  products: RecommendedProduct[],
  criteria: PainCriterion[],
  profile: PainProfile,
): RankedMatch[] {
  const slugs = criteria.map((item) => item.slug);
  const ranked = products.map((product) =>
    scoreProduct(product, criteria, profile, slugs),
  );
  return ranked.sort((left, right) => {
    if (left.blocked !== right.blocked) return left.blocked ? 1 : -1;
    if (right.match !== left.match) return right.match - left.match;
    return left.name.localeCompare(right.name);
  });
}

export function cellMatch(
  product: RecommendedProduct,
  criterion: PainCriterion,
): CellMatch {
  const score = product.scores[criterion.slug] ?? 0;
  return {
    slug: criterion.slug,
    name: concernName(criterion),
    score,
    stars: matchStars(score),
    band: matchBand(score),
    reason: cellReason(product, criterion, score),
  };
}

export function profileShares(profile: PainProfile, slugs: string[]) {
  const weights = slugs.map((slug) => weightFor(slug, profile));
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return Object.fromEntries(slugs.map((slug) => [slug, 0])) as Record<
      string,
      number
    >;
  }
  return Object.fromEntries(
    slugs.map((slug, index) => [
      slug,
      Math.round((weights[index] / total) * 100),
    ]),
  ) as Record<string, number>;
}

export function quotePatterns(evidence: PainEvidence[]) {
  return evidence.slice(0, 4).map((item) => item.quote);
}

function scoreProduct(
  product: RecommendedProduct,
  criteria: PainCriterion[],
  profile: PainProfile,
  slugs: string[],
): RankedMatch {
  let weighted = 0;
  let weight = 0;
  for (const slug of slugs) {
    const share = weightFor(slug, profile);
    if (share <= 0) continue;
    const score = product.scores[slug];
    if (score == null) continue;
    weighted += score * share;
    weight += share;
  }
  const match = weight
    ? Math.round(weighted / weight)
    : Math.round(average(Object.values(product.scores)));
  const named = (slug: string) =>
    concernName(criteria.find((item) => item.slug === slug) || {
      slug,
      name: slug,
      detail: "",
    });
  const broken = slugs.filter(
    (slug) => isBreaker(slug, profile) && (product.scores[slug] ?? 0) < 62,
  );
  const warned = slugs.filter((slug) => {
    if (!isBreaker(slug, profile)) return false;
    const score = product.scores[slug] ?? 0;
    return score >= 62 && score < 75;
  });
  const loves = criteria
    .filter((item) => (product.scores[item.slug] ?? 0) >= 75)
    .map((item) => concernName(item));
  const regrets = criteria
    .filter((item) => (product.scores[item.slug] ?? 0) < 55)
    .map((item) => concernName(item));
  const bestFor = criteria
    .filter((item) => weightFor(item.slug, profile) > 0)
    .sort(
      (left, right) =>
        (product.scores[right.slug] ?? 0) - (product.scores[left.slug] ?? 0),
    )
    .filter((item) => (product.scores[item.slug] ?? 0) >= 70)
    .slice(0, 3)
    .map((item) => concernName(item).toLowerCase());
  return {
    ...product,
    match,
    band: matchBand(match),
    stars: matchStars(match),
    bestFor: bestFor.length > 0 ? bestFor : loves.slice(0, 2).map((item) => item.toLowerCase()),
    broken: broken.map(named),
    warned: warned.map(named),
    blocked: broken.length > 0,
    loves,
    regrets,
    why: whyMatch(product, criteria, profile, match),
  };
}

function whyMatch(
  product: RecommendedProduct,
  criteria: PainCriterion[],
  profile: PainProfile,
  match: number,
) {
  const wanted = criteria
    .filter((item) => weightFor(item.slug, profile) > 0)
    .sort(
      (left, right) =>
        weightFor(right.slug, profile) - weightFor(left.slug, profile),
    );
  const strong = wanted.filter((item) => (product.scores[item.slug] ?? 0) >= 70);
  const weak = wanted.filter((item) => (product.scores[item.slug] ?? 0) < 55);
  const parts = [
    `${matchBand(match)} match for what you said matters.`,
    product.note.trim() || product.summary,
  ];
  if (strong[0]) {
    parts.push(
      `Strong for ${concernName(strong[0]).toLowerCase()}.`,
    );
  }
  if (weak[0]) {
    parts.push(
      `Weaker for ${concernName(weak[0]).toLowerCase()}.`,
    );
  }
  return parts.join(" ");
}

function cellReason(
  product: RecommendedProduct,
  criterion: PainCriterion,
  score: number,
) {
  const concern = concernName(criterion).toLowerCase();
  const band = matchBand(score);
  const lead =
    band === "Excellent"
      ? `Excellent match for ${concern}.`
      : band === "Strong"
        ? `Strong match for ${concern}.`
        : band === "Moderate"
          ? `Moderate match for ${concern}.`
          : `Weak match for ${concern}.`;
  const note = product.note.trim() || product.whoFor;
  return `${lead} ${note} This is a suitability match, not a medical result.`;
}

function isBreaker(slug: string, profile: PainProfile) {
  return profile.breakers.includes(slug) || (profile.importances[slug] ?? 0) >= 10;
}

function weightFor(slug: string, profile: PainProfile) {
  if (isBreaker(slug, profile)) return 12;
  return clampLevel(profile.importances[slug] ?? 0);
}

function fromLegacy(value: number) {
  if (value <= 0) return 0;
  if (value === 1) return 4;
  if (value === 2) return 7;
  return 9;
}

function clampLevel(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(10, Math.round(number)));
}

function average(values: number[]) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (usable.length === 0) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}
