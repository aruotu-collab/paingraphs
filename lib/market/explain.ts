import type { PainPage, Priorities } from "./types";

export function isEvenWeights(shares: Priorities, slugs: string[]) {
  const values = slugs.map((slug) => shares[slug] ?? 0);
  if (values.length === 0) return true;
  return Math.max(...values) - Math.min(...values) <= 4;
}

export function readWeights(
  criteria: PainPage["criteria"],
  shares: Priorities,
) {
  const ranked = [...criteria].sort(
    (a, b) => (shares[b.slug] ?? 0) - (shares[a.slug] ?? 0),
  );
  const even = isEvenWeights(
    shares,
    criteria.map((item) => item.slug),
  );
  if (even || !ranked[0]) {
    return {
      even: true,
      headline: "You have not chosen a priority yet.",
      body: "Every factor still counts the same, so this is a middle-of-the-road ranking. If one problem is why you opened this page, move that slider first and the order will change.",
    };
  }
  const top = ranked[0];
  const second = ranked[1];
  const last = ranked[ranked.length - 1];
  const secondLine =
    second && (shares[second.slug] ?? 0) >= 18
      ? `${second.name} is your second priority. ${last.name} matters least on this pass, so a product can be weaker there and still rank well.`
      : `${last.name} matters least on this pass, so a product can be weaker there and still rank well.`;
  return {
    even: false,
    headline: `You care most about ${top.name.toLowerCase()} (${shares[top.slug]}% of this ranking).`,
    body: secondLine,
  };
}

export function explainFit(
  product: PainPage["products"][number],
  criteria: PainPage["criteria"],
  shares: Priorities,
) {
  const rows = criteria.map((item) => ({
    slug: item.slug,
    name: item.name,
    weight: shares[item.slug] ?? 0,
    score: product.scores[item.slug] ?? 0,
  }));
  const cared = rows.filter((row) => row.weight >= 12);
  const pool = cared.length > 0 ? cared : rows;
  const best = [...pool].sort((a, b) => b.score - a.score)[0];
  const worst = [...pool].sort((a, b) => a.score - b.score)[0];
  return { rows, best, worst };
}
