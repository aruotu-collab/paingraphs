export const HIGH_PAID_ACQUISITION = 70;

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function paidAcquisitionScore(input: {
  intent: number;
  organic: number;
  competition: number;
  published: boolean;
  destinations: number;
  evidenceCount: number;
  revenue: number;
  clicks: number;
  sensitive: boolean;
}) {
  let score =
    input.intent * 0.42 +
    input.organic * 0.22 +
    (100 - input.competition) * 0.16;
  if (input.published) score += 6;
  if (input.destinations > 0) score += 8;
  if (input.evidenceCount > 0) score += Math.min(6, input.evidenceCount * 2);
  if (input.clicks > 0 && input.revenue > 0) score += 10;
  else if (input.clicks > 0) score += 4;
  if (input.sensitive) score -= 18;
  return clampScore(score);
}

export function breakEvenCpcCopy(input: {
  clicks: number;
  revenue: number;
  conversions: number;
  currency?: string;
}) {
  if (input.clicks <= 0 || input.revenue <= 0) {
    return "Not enough conversion economics yet. Break-even CPC waits for revenue per click or a recorded merchant conversion rate.";
  }
  const epc = input.revenue / input.clicks;
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: input.currency || "GBP",
    maximumFractionDigits: 2,
  }).format(epc);
  const rate = ((input.conversions / input.clicks) * 100).toFixed(1);
  return `Recorded EPC is ${formatted} from ${input.conversions} conversion${input.conversions === 1 ? "" : "s"} on ${input.clicks} click${input.clicks === 1 ? "" : "s"} (${rate}% recorded rate). Conservative break-even CPC is about ${formatted} if ads land on a destination you already own. PainGraphs does not invent CPC or launch ads.`;
}

export function landingReadinessNote(input: {
  published: boolean;
  destinationUrl?: string | null;
  publicHref: string;
}) {
  if (!input.published) {
    return {
      href: input.destinationUrl || input.publicHref,
      note: "PainGraph is unpublished. Do not spend until the public page is live. PainGraphs will not invent a HopLink or marketplace search URL.",
    };
  }
  if (input.destinationUrl) {
    return {
      href: input.destinationUrl,
      note: "Use the destination you already created. PainGraphs will not invent a HopLink or marketplace search URL.",
    };
  }
  return {
    href: input.publicHref,
    note: "Land on the public PainGraph until a real destination exists.",
  };
}
