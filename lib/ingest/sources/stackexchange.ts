import { fetchJson } from "../http";
import { clip, decodeEntities, sleep } from "../text";
import type { FetchedDoc } from "../types";

type SeItem = {
  question_id?: number;
  title?: string;
  excerpt?: string;
  creation_date?: number;
  owner?: { display_name?: string };
};

type SeResponse = { items?: SeItem[]; error_message?: string };

const SITES: Record<string, string> = {
  stackoverflow: "https://stackoverflow.com/questions/",
  softwarerecs: "https://softwarerecs.stackexchange.com/questions/",
  freelancing: "https://freelancing.stackexchange.com/questions/",
  webapps: "https://webapps.stackexchange.com/questions/",
};

async function search(site: string, query: string, pagesize: number) {
  const url = new URL("https://api.stackexchange.com/2.3/search/excerpts");
  url.searchParams.set("order", "desc");
  url.searchParams.set("sort", "relevance");
  url.searchParams.set("q", query);
  url.searchParams.set("site", site);
  url.searchParams.set("pagesize", String(pagesize));
  const data = await fetchJson<SeResponse>(url.toString());
  const base = SITES[site] ?? `https://${site}.stackexchange.com/questions/`;
  return (data.items ?? [])
    .filter((item) => item.question_id && item.title)
    .map((item) => {
      const title = decodeEntities(item.title ?? "");
      const excerpt = decodeEntities(item.excerpt ?? "");
      return {
        sourceSlug: "stackexchange",
        externalId: `${site}-${item.question_id}`,
        url: `${base}${item.question_id}`,
        title,
        body: clip(`${title}\n\n${excerpt}`),
        author: item.owner?.display_name ?? null,
        publishedAt: item.creation_date
          ? new Date(item.creation_date * 1000)
          : null,
      } satisfies FetchedDoc;
    });
}

export async function fetchStackExchange(mode: "full" | "cron"): Promise<FetchedDoc[]> {
  const pagesize = mode === "cron" ? 5 : 10;
  const pairs =
    mode === "cron"
      ? [
          ["softwarerecs", "looking for software to automate"],
          ["stackoverflow", "tool to chase invoices"],
          ["freelancing", "getting clients to pay invoices"],
        ]
      : [
          ["softwarerecs", "looking for software to automate invoicing"],
          ["softwarerecs", "client reporting tool for agency"],
          ["stackoverflow", "automatically follow up unpaid invoices"],
          ["freelancing", "chasing late invoices"],
          ["webapps", "quote follow up crm for trades"],
          ["stackoverflow", "airbnb cleaner scheduling"],
        ];

  const docs: FetchedDoc[] = [];
  const seen = new Set<string>();
  for (const [site, query] of pairs) {
    const hits = await search(site, query, pagesize);
    for (const doc of hits) {
      if (seen.has(doc.externalId)) continue;
      seen.add(doc.externalId);
      docs.push(doc);
    }
    await sleep(220);
  }
  return docs;
}
