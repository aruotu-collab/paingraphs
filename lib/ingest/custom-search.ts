import { PAINS } from "@/lib/catalog/data";
import { cleanComplaintQuote, looksLikeSpokenComplaint } from "@/lib/market/quotes";
import { getJson, hash, storeSignal } from "./signals";

type SearchItem = {
  title?: string;
  snippet?: string;
  link?: string;
};

export async function ingestCustomSearch() {
  const key = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY ?? process.env.YOUTUBE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return { stored: 0, competitionHints: 0 };

  let stored = 0;
  let competitionHints = 0;
  for (const pain of PAINS) {
    const query = pain.searchPhrases[0];
    if (!query) continue;
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", key);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", query);
    url.searchParams.set("num", "5");
    const data = await getJson<{
      items?: SearchItem[];
      searchInformation?: { totalResults?: string };
    }>(url);

    const total = Number(data.searchInformation?.totalResults ?? 0);
    if (total > 0) {
      const added = await storeSignal({
        id: `cse-vol-${pain.id}-${hash(query)}`,
        painId: pain.id,
        rawQuote: `Web index for “${query}”: about ${total.toLocaleString("en-GB")} results. Use as a competition hint, not search demand.`,
        sourceKind: "cse",
        sourceLabel: "Custom Search index size",
      });
      if (added) competitionHints += 1;
    }

    for (const item of (data.items ?? []).slice(0, 3)) {
      const text = cleanComplaintQuote(item.snippet || item.title || "");
      if (text.length < 28 || !looksLikeSpokenComplaint(text)) continue;
      const added = await storeSignal({
        id: `cse-${pain.id}-${hash(item.link ?? text)}`,
        painId: pain.id,
        rawQuote: text,
        sourceKind: "cse",
        sourceLabel: "Custom Search result",
        sourceUrl: item.link ?? null,
      });
      if (added) stored += 1;
    }
  }
  return { stored, competitionHints };
}
