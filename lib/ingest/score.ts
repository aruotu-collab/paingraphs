export function scoreSignals(
  signals: {
    intensity: number | null;
    purchaseIntent: number | null;
    publishedAt: Date | null;
    quote: string;
  }[],
  workaroundCount: number,
) {
  const count = Math.max(signals.length, 1);
  const avg = (pick: (signal: (typeof signals)[number]) => number) =>
    signals.reduce((sum, signal) => sum + pick(signal), 0) / count;

  const now = Date.now();
  const day = 86_400_000;
  const recent = signals.filter(
    (signal) => signal.publishedAt && now - signal.publishedAt.getTime() < 45 * day,
  ).length;
  const older = signals.length - recent;

  const demand = clamp(
    28 + Math.log2(count + 1) * 18 + Math.min(recent * 4, 20),
  );
  const pain = clamp(avg((signal) => (signal.intensity ?? 0.6) * 100));
  const intent = clamp(avg((signal) => (signal.purchaseIntent ?? 0.5) * 100));

  const productMentions = signals.filter((signal) =>
    /\b(salesforce|hubspot|quickbooks|xero|notion|jira|asana|monday)\b/i.test(
      signal.quote,
    ),
  ).length;
  const noTool = signals.filter((signal) =>
    /no (good |decent )?(tool|software|saas)|is there (a|an) (tool|app)/i.test(
      signal.quote,
    ),
  ).length;
  const competition = clamp(58 + productMentions * 8 - noTool * 10 - (workaroundCount > 0 ? 6 : 0));
  const growth = clamp(
    older > 0 ? 20 + (recent / Math.max(older, 1)) * 28 : 24 + Math.min(recent * 6, 40),
  );
  const buildability = clamp(72 + (workaroundCount > 0 ? 8 : 0) + (intent > 70 ? 6 : 0));
  const reachability = 74;
  const solutionGap = clamp(100 - competition * 0.55);
  const opportunity = clamp(
    demand * 0.24 +
      pain * 0.18 +
      intent * 0.2 +
      (100 - competition) * 0.1 +
      growth * 0.16 +
      buildability * 0.12,
  );
  const confidence = clamp(38 + Math.min(count, 8) * 7 + (count >= 3 ? 8 : 0));

  const rationale = [
    `${count} live signal${count === 1 ? "" : "s"}`,
    intent >= 70 ? "buying language present" : "mostly exploratory demand",
    workaroundCount > 0 ? "people already hacking around it" : "workaround unclear",
    noTool > 0 ? "callouts that no good tool exists" : null,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    demand: round(demand),
    pain: round(pain),
    intent: round(intent),
    competition: round(competition),
    growth: round(growth),
    buildability: round(buildability),
    reachability: round(reachability),
    solutionGap: round(solutionGap),
    opportunity: round(opportunity),
    confidence: round(confidence),
    signalCount: signals.length,
    rationale: `${rationale}.`,
  };
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function round(value: number) {
  return Math.round(value);
}
