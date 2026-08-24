import { fetchJson } from "../http";
import { clip, decodeEntities, sleep } from "../text";
import type { FetchedDoc } from "../types";

type HnHit = {
  objectID: string;
  title?: string | null;
  story_title?: string | null;
  story_text?: string | null;
  comment_text?: string | null;
  author?: string | null;
  created_at?: string | null;
  url?: string | null;
};

type HnResponse = { hits?: HnHit[] };

const ASK_SKIP =
  /who is hiring|who wants to be hired|what are you working on|freelancer\? seeking freelancer|monthly who/i;

function toDoc(hit: HnHit): FetchedDoc | null {
  const title = decodeEntities(hit.title || hit.story_title || "");
  const body = decodeEntities(hit.story_text || hit.comment_text || title);
  if (!title && body.length < 40) return null;
  if (ASK_SKIP.test(title)) return null;
  if (/^(show hn|tell hn|launch hn|how hn):/i.test(title)) return null;
  return {
    sourceSlug: "hn",
    externalId: hit.objectID,
    url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
    title: title || "Hacker News discussion",
    body: clip(body),
    author: hit.author ?? null,
    publishedAt: hit.created_at ? new Date(hit.created_at) : null,
  };
}

async function search(query: string, tags: string, hitsPerPage: number) {
  const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
  if (query) url.searchParams.set("query", query);
  url.searchParams.set("tags", tags);
  url.searchParams.set("hitsPerPage", String(hitsPerPage));
  const data = await fetchJson<HnResponse>(url.toString());
  return (data.hits ?? []).map(toDoc).filter((doc): doc is FetchedDoc => Boolean(doc));
}

export async function fetchHackerNews(mode: "full" | "cron"): Promise<FetchedDoc[]> {
  const askLimit = mode === "cron" ? 20 : 50;
  const targetedLimit = mode === "cron" ? 6 : 12;
  const docs: FetchedDoc[] = [];
  const seen = new Set<string>();

  const ask = await search("", "ask_hn", askLimit);
  for (const doc of ask) {
    if (seen.has(doc.externalId)) continue;
    seen.add(doc.externalId);
    docs.push(doc);
  }
  await sleep(200);

  const targeted = [
    '"looking for a tool"',
    '"looking for a saas"',
    '"is there a tool"',
    '"alternative to"',
    '"invoice chasing"',
    '"client reporting"',
    '"follow up quotes"',
    '"freelancer invoice"',
    "UK freelancer VAT",
    '"estate agent" CRM',
  ].slice(0, mode === "cron" ? 4 : 10);

  for (const query of targeted) {
    const tags = /invoice|reporting|quotes|freelancer|VAT|estate/i.test(query)
      ? "story"
      : "ask_hn";
    const hits = await search(query, tags, targetedLimit);
    for (const doc of hits) {
      if (seen.has(doc.externalId)) continue;
      seen.add(doc.externalId);
      docs.push(doc);
    }
    await sleep(180);
  }

  return docs;
}
