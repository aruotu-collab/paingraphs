import { eq } from "drizzle-orm";
import { CLICKBANK_PAINS, clickbankHop } from "@/lib/affiliate/clickbank";
import { db } from "@/lib/db";
import { criteria, pains, productFits, products } from "@/lib/db/schema";
import { publishTopic } from "@/lib/ingest/openai-discover";
import { getJson, hash } from "./signals";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

type OpenAIResponse = {
  output?: {
    content?: { text?: string }[];
  }[];
  output_text?: string;
};

type QuoteHit = { quote?: string; title?: string; url?: string };

export async function ingestClickbankDiscover() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !process.env.CLICKBANK_NICKNAME) return { pains: 0, quotes: 0 };

  const rows = await db
    .select({ id: pains.id, slug: pains.slug, title: pains.title })
    .from(pains);
  const usedSlugs = new Set(rows.map((row) => row.slug));
  const usedTitles = new Set(rows.map((row) => row.title.toLowerCase()));

  let created = 0;
  let quotes = 0;
  for (const target of CLICKBANK_PAINS) {
    if (await clusterHasPain(target.categoryId, target.clusterSlug)) continue;
    try {
      const found = mergeQuotes(await findQuotes(key, target.quoteQuery), target);
      if (found.length < 2) {
        console.warn(`clickbank skip ${target.vendor}: quotes=${found.length}`);
        continue;
      }
      const result = await publishTopic(
        target.categoryId,
        {
          clusterSlug: target.clusterSlug,
          clusterName: target.clusterName,
          clusterSummary: target.clusterSummary,
          slug: target.slug,
          title: target.title,
          h1: target.h1,
          problem: target.problem,
          analysis: target.analysis,
          whyNow: target.whyNow,
          strategy: "affiliate now → own product later",
          sensitive: true,
          painScore: 86,
          intentScore: 82,
          competitionScore: 48,
          productGap: 58,
          affiliateScore: 80,
          organicScore: 78,
          criteria: [...target.criteria],
          products: target.products.map((product) => ({ ...product })),
          quotes: found,
        },
        usedSlugs,
        usedTitles,
      );
      created += result.created;
      quotes += result.quotes;
      if (result.created > 0 && canAttachHop(target)) {
        await attachClickbankOffer(target);
      }
    } catch (error) {
      console.warn(
        `clickbank skip ${target.vendor}: ${error instanceof Error ? error.message : "error"}`,
      );
    }
  }
  return { pains: created, quotes };
}

function canAttachHop(target: (typeof CLICKBANK_PAINS)[number]) {
  if ("skipHop" in target && target.skipHop) return false;
  if ("requiresApproval" in target && target.requiresApproval) return false;
  return true;
}

function mergeQuotes(
  found: QuoteHit[],
  target: (typeof CLICKBANK_PAINS)[number],
) {
  const fallback = "fallbackQuotes" in target ? [...target.fallbackQuotes] : [];
  const seen = new Set<string>();
  const out: QuoteHit[] = [];
  for (const row of [...fallback, ...found]) {
    const quote = (row.quote ?? "").trim();
    if (quote.length < 24 || seen.has(quote)) continue;
    seen.add(quote);
    out.push(row);
  }
  return out.slice(0, 6);
}

async function clusterHasPain(categoryId: string, clusterSlug: string) {
  const clusterId = `cl-${categoryId.replace("cat-", "")}-${clusterSlug}`.slice(0, 64);
  const existing = await db
    .select({ id: pains.id })
    .from(pains)
    .where(eq(pains.clusterId, clusterId))
    .limit(1);
  return existing.length > 0;
}

async function findQuotes(key: string, query: string): Promise<QuoteHit[]> {
  const data = await getJson<OpenAIResponse>("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({
      model: MODEL,
      tool_choice: "required",
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
      input: `Search the public web for first-person consumer complaints about: "${query}". Prefer forums, reviews, Q&A, YouTube comments, Trustpilot, Head-Fi, Hacker News. Skip reddit. Skip sales letters and miracle-cure pages. Do not invent quotes.

Return JSON only: {"quotes":[{"quote":"verbatim first-person complaint under 180 chars","title":"page title","url":"https://..."}]}
4 items. Quotes must be real.`,
    }),
  });

  const text = outputText(data);
  const parsed = parseJson(text) as { quotes?: QuoteHit[] };
  const quotes = (parsed.quotes ?? []).filter(
    (row) => (row.quote ?? "").trim().length >= 24 && row.url,
  );
  console.warn(`clickbank quotes for ${query.slice(0, 40)}: ${quotes.length}`);
  return quotes.slice(0, 6);
}

async function attachClickbankOffer(target: (typeof CLICKBANK_PAINS)[number]) {
  const painId = `pain-${target.slug}`.slice(0, 64);
  const productSlug = `${target.slug}-${target.vendor}`.slice(0, 64);
  const productId = `prod-${hash(productSlug)}`;
  const criterionRows = await db
    .select({ slug: criteria.slug })
    .from(criteria)
    .where(eq(criteria.painId, painId));
  const scores: Record<string, number> = {};
  for (const item of criterionRows) scores[item.slug] = 52;

  await db
    .insert(products)
    .values({
      id: productId,
      slug: productSlug,
      name: target.offerName,
      summary: target.offerSummary,
      whoFor: target.whoFor,
      searchQuery: clickbankHop(target.vendor, target.slug),
      priceBand: target.priceBand,
    })
    .onConflictDoNothing();
  await db
    .insert(productFits)
    .values({
      id: `${productId}-${painId}`,
      productId,
      painId,
      scores: JSON.stringify(scores),
      note: target.note,
    })
    .onConflictDoNothing();
}

function outputText(data: OpenAIResponse) {
  if (data.output_text?.trim()) return data.output_text;
  return (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((block) => block.text ?? "")
    .join("\n");
}

function parseJson(text: string) {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const json = stripped.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return {};
  try {
    return JSON.parse(json) as unknown;
  } catch (error) {
    console.warn(
      `clickbank json: ${error instanceof Error ? error.message : "parse failed"}`,
    );
    return {};
  }
}
