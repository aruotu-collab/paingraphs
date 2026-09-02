import { PAINS } from "@/lib/catalog/data";
import { SITE_URL } from "@/lib/site";
import { overlap } from "./text";
import { googleServiceAccountToken } from "./google-auth";
import { getJson, hash, storeSignal } from "./signals";

type SearchRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

export async function ingestSearchConsole() {
  const token = await googleServiceAccountToken(
    "https://www.googleapis.com/auth/webmasters.readonly",
  );
  const site = encodeURIComponent(
    process.env.GSC_SITE_URL ?? `${SITE_URL.replace(/\/$/, "")}/`,
  );
  if (!token) return 0;

  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 28);
  const data = await getJson<{ rows?: SearchRow[] }>(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        startDate: iso(start),
        endDate: iso(end),
        dimensions: ["query"],
        rowLimit: 250,
      }),
    },
  );

  let stored = 0;
  for (const row of data.rows ?? []) {
    const query = row.keys?.[0]?.trim();
    if (!query) continue;
    const pain = matchPain(query);
    if (!pain) continue;
    const impressions = Math.round(row.impressions ?? 0);
    const clicks = Math.round(row.clicks ?? 0);
    const added = await storeSignal({
      id: `gsc-${pain.id}-${hash(query)}`,
      painId: pain.id,
      rawQuote: `${query} · ${impressions} impressions, ${clicks} clicks, position ${Math.round(row.position ?? 0)}`,
      sourceKind: "gsc",
      sourceLabel: "Search Console",
      sourceUrl: null,
    });
    if (added) stored += 1;
  }
  return stored;
}

function matchPain(query: string) {
  let best = { pain: PAINS[0], score: 0 };
  for (const pain of PAINS) {
    const haystack = [pain.title, pain.h1, ...pain.searchPhrases].join(" ");
    const score = Math.max(
      overlap(query, haystack),
      ...pain.searchPhrases.map((phrase) => overlap(query, phrase)),
    );
    if (score > best.score) best = { pain, score };
  }
  return best.score >= 0.4 ? best.pain : null;
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}
