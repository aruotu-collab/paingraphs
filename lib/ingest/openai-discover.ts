import { RESERVED_PATHS } from "@/lib/catalog/data";
import { db } from "@/lib/db";
import {
  criteria,
  painClusters,
  pains,
  productFits,
  products,
} from "@/lib/db/schema";
import { getJson, hash, storeSignal } from "./signals";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const TARGETS = [
  {
    categoryId: "cat-electronics",
    categorySlug: "electronics",
    name: "Electronics",
    skip: [
      "headphones that do not hurt with glasses",
      "glasses-pressure",
      "over-ear clamp on spectacle arms",
      "smartphone battery drain",
      "earbuds that fall out when running",
    ],
    hint: "Wearables, phones, earbuds, chargers, laptops, smartwatches, cases, keyboards. Not another glasses/headphones-clamp page.",
  },
  {
    categoryId: "cat-personal-care",
    categorySlug: "personal-care",
    name: "Personal care",
    skip: [
      "quiet incontinence underwear",
      "thin bladder protection for work",
      "adult nappy rustle",
      "deodorant skin irritation",
      "hearing in noisy rooms",
      "knees hurt after sitting",
      "bleeding gums",
      "mouthwash will not fix breath",
      "skin cream fails",
      "itchy flaky skin that cream does not settle",
      "wake at 3am cannot stay asleep",
      "leak when sneezing pelvic floor",
    ],
    hint: "Razors, deodorant, electric toothbrushes, hair removal, menstrual care, body-worn devices. Not another incontinence-discretion page. Not skincare/sunscreen.",
  },
] as const;

type DiscoveryQuote = { quote?: string; title?: string; url?: string };

type DiscoveryProduct = {
  slug?: string;
  name?: string;
  summary?: string;
  whoFor?: string;
  searchQuery?: string;
  priceBand?: string;
  note?: string;
  scores?: Record<string, number>;
};

export type DiscoveryTopic = {
  clusterSlug?: string;
  clusterName?: string;
  clusterSummary?: string;
  slug?: string;
  title?: string;
  h1?: string;
  problem?: string;
  analysis?: string;
  whyNow?: string;
  strategy?: string;
  sensitive?: boolean;
  painScore?: number;
  intentScore?: number;
  competitionScore?: number;
  productGap?: number;
  affiliateScore?: number;
  organicScore?: number;
  criteria?: { slug?: string; name?: string; detail?: string }[];
  products?: DiscoveryProduct[];
  quotes?: DiscoveryQuote[];
};

type OpenAIResponse = {
  output?: {
    content?: { text?: string }[];
  }[];
  output_text?: string;
};

export async function ingestOpenAIDiscover() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { pains: 0, quotes: 0 };

  const existing = await db
    .select({ id: pains.id, slug: pains.slug, title: pains.title })
    .from(pains);
  const usedSlugs = new Set(existing.map((row) => row.slug));
  const usedTitles = new Set(existing.map((row) => row.title.toLowerCase()));

  let created = 0;
  let quotes = 0;
  for (const target of TARGETS) {
    const topics = await discoverTopics(key, target, usedTitles);
    for (const topic of topics) {
      try {
        const result = await publishTopic(target.categoryId, topic, usedSlugs, usedTitles);
        created += result.created;
        quotes += result.quotes;
      } catch (error) {
        console.warn(
          `discover skip ${topic.slug ?? topic.title}: ${error instanceof Error ? error.message : "error"}`,
        );
      }
    }
  }
  return { pains: created, quotes };
}

async function discoverTopics(
  key: string,
  target: (typeof TARGETS)[number],
  usedTitles: Set<string>,
): Promise<DiscoveryTopic[]> {
  const topics: DiscoveryTopic[] = [];
  const found: string[] = [];
  for (let index = 0; index < 3; index += 1) {
    const topic = await discoverOneTopic(key, target, [...target.skip, ...found, ...usedTitles]);
    if (!topic?.title) continue;
    topics.push(topic);
    found.push(topic.title);
  }
  return topics;
}

async function discoverOneTopic(
  key: string,
  target: (typeof TARGETS)[number],
  skip: string[],
): Promise<DiscoveryTopic | null> {
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
      input: `Search the public web for ONE widespread consumer product-fit problem in ${target.name}. ${target.hint}

Style it like "Headphones that do not hurt with glasses": a specific daily pain, not a best-of list.
Do not invent reviews. Skip reddit. Skip: ${skip.join("; ")}.

Return JSON only (one object, no markdown):
{"topic":{
  "clusterSlug":"earbuds",
  "clusterName":"Earbuds",
  "clusterSummary":"Fit and fall-out during movement.",
  "slug":"earbuds-fall-out-running",
  "title":"Earbuds that do not fall out when running",
  "h1":"Earbuds that stay in when you run",
  "problem":"2 sentences on the lived problem.",
  "analysis":"3 sentences on the real tradeoff.",
  "whyNow":"1 sentence.",
  "strategy":"affiliate now → own product later",
  "sensitive":false,
  "painScore":88,
  "intentScore":84,
  "competitionScore":50,
  "productGap":62,
  "affiliateScore":78,
  "organicScore":80,
  "criteria":[{"slug":"fit","name":"Fit","detail":"Why this axis matters."}],
  "products":[{"slug":"wingtip-sport","name":"Wingtip sport earbud","summary":"What it is.","whoFor":"Best if fall-out is the main problem.","searchQuery":"sport earbuds that stay in","priceBand":"£30–£120","note":"Tradeoff.","scores":{"fit":90}}],
  "quotes":[{"quote":"verbatim first-person complaint under 180 chars","title":"page title","url":"https://..."}]
}}

Rules: 4 criteria, 3 product archetypes not brands, 4 real quotes with URLs.`,
    }),
  });

  const text = outputText(data);
  const parsed = parseJson(text) as { topic?: DiscoveryTopic } & DiscoveryTopic;
  const topic = parsed.topic ?? (parsed.title ? parsed : null);
  if (!topic?.title) {
    console.warn(`discover ${target.categorySlug} empty raw=${text.slice(0, 180)}`);
    return null;
  }
  console.warn(`discover ${target.categorySlug}: ${topic.title}`);
  return topic;
}

export async function publishTopic(
  categoryId: string,
  topic: DiscoveryTopic,
  usedSlugs: Set<string>,
  usedTitles: Set<string>,
) {
  const clusterSlug = safeSlug(topic.clusterSlug ?? topic.clusterName ?? "", "cluster");
  const painSlug = safeSlug(topic.slug ?? topic.title ?? "", "pain");
  const title = (topic.title ?? "").trim();
  if (!clusterSlug || !painSlug || title.length < 12) {
    console.warn(`discover skip incomplete title=${title || "?"}`);
    return { created: 0, quotes: 0 };
  }
  if (RESERVED_PATHS.has(clusterSlug) || RESERVED_PATHS.has(painSlug)) {
    console.warn(`discover skip reserved ${painSlug}`);
    return { created: 0, quotes: 0 };
  }
  if (usedSlugs.has(painSlug) || usedTitles.has(title.toLowerCase())) {
    console.warn(`discover skip existing ${painSlug}`);
    return { created: 0, quotes: 0 };
  }
  if ((topic.quotes ?? []).length < 2) {
    console.warn(`discover skip few quotes ${painSlug} n=${topic.quotes?.length ?? 0}`);
    return { created: 0, quotes: 0 };
  }

  const clusterId = `cl-${categoryId.replace("cat-", "")}-${clusterSlug}`.slice(0, 64);
  const painId = `pain-${painSlug}`.slice(0, 64);
  const criterionRows = (topic.criteria ?? [])
    .map((item) => ({
      slug: safeSlug(item.slug ?? item.name ?? "", "axis"),
      name: (item.name ?? "Fit").trim().slice(0, 48),
      detail: (item.detail ?? "").trim().slice(0, 180),
    }))
    .filter((item) => item.slug && item.name && item.detail)
    .slice(0, 5);
  if (criterionRows.length < 3) return { created: 0, quotes: 0 };

  await db
    .insert(painClusters)
    .values({
      id: clusterId,
      categoryId,
      slug: clusterSlug,
      name: (topic.clusterName ?? clusterSlug).trim().slice(0, 48),
      summary: (topic.clusterSummary ?? title).trim().slice(0, 160),
    })
    .onConflictDoUpdate({
      target: painClusters.id,
      set: {
        name: (topic.clusterName ?? clusterSlug).trim().slice(0, 48),
        summary: (topic.clusterSummary ?? title).trim().slice(0, 160),
      },
    });

  const painScore = clampScore(topic.painScore, 82);
  const intentScore = clampScore(topic.intentScore, 78);
  const organicScore = clampScore(topic.organicScore, 76);
  const opportunity = Math.round((painScore + intentScore + organicScore) / 3);

  await db.insert(pains).values({
    id: painId,
    clusterId,
    slug: painSlug,
    title,
    h1: (topic.h1 ?? title).trim().slice(0, 120),
    problem: (topic.problem ?? "").trim().slice(0, 420),
    analysis: (topic.analysis ?? "").trim().slice(0, 900),
    whyNow: (topic.whyNow ?? "").trim().slice(0, 280),
    strategy: (topic.strategy ?? "affiliate now → own product later").trim().slice(0, 80),
    stage: 3,
    painScore,
    intentScore,
    competitionScore: clampScore(topic.competitionScore, 52),
    productGap: clampScore(topic.productGap, 60),
    affiliateScore: clampScore(topic.affiliateScore, 74),
    organicScore,
    opportunity,
    trend: 18,
    sensitive: Boolean(topic.sensitive),
    status: "published",
    updatedAt: new Date(),
  });

  for (const item of criterionRows) {
    await db.insert(criteria).values({
      id: `${painId}-${item.slug}`,
      painId,
      slug: item.slug,
      name: item.name,
      detail: item.detail,
    });
  }

  for (const product of (topic.products ?? []).slice(0, 3)) {
    const productSlug = `${painSlug}-${safeSlug(product.slug ?? product.name ?? "", "opt")}`;
    if (!productSlug || !product.name) continue;
    const productId = `prod-${hash(productSlug)}`;
    const scores: Record<string, number> = {};
    for (const item of criterionRows) {
      scores[item.slug] = clampScore(product.scores?.[item.slug], 60);
    }
    await db
      .insert(products)
      .values({
        id: productId,
        slug: productSlug.slice(0, 64),
        name: product.name.trim().slice(0, 80),
        summary: (product.summary ?? "").trim().slice(0, 220) || title,
        whoFor: (product.whoFor ?? "Best if this is your main constraint.").trim().slice(0, 160),
        searchQuery: (product.searchQuery ?? title).trim().slice(0, 120),
        priceBand: (product.priceBand ?? "").trim().slice(0, 40) || null,
      })
      .onConflictDoNothing();
    await db
      .insert(productFits)
      .values({
        id: `${productId}-${painId}`,
        productId,
        painId,
        scores: JSON.stringify(scores),
        note: (product.note ?? "").trim().slice(0, 200) || "Scored against this page's criteria.",
      })
      .onConflictDoNothing();
  }

  let storedQuotes = 0;
  for (const row of (topic.quotes ?? []).slice(0, 6)) {
    const quote = cleanQuote(row.quote ?? "");
    if (quote.length < 24) continue;
    const added = await storeSignal({
      id: `openai-disc-${painId}-${hash(quote)}`,
      painId,
      rawQuote: quote,
      ...quoteSource(row.url),
    });
    if (added) storedQuotes += 1;
  }

  usedSlugs.add(painSlug);
  usedTitles.add(title.toLowerCase());
  return { created: 1, quotes: storedQuotes };
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
      `discover json: ${error instanceof Error ? error.message : "parse failed"} at ${json.length} chars`,
    );
    return {};
  }
}

function safeSlug(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || fallback;
}

function clampScore(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.min(99, Math.round(number)));
}

function cleanQuote(value: string) {
  return value.replace(/^#+\s+/gm, "").replace(/^\*\s+/gm, "").replace(/\s+/g, " ").trim();
}

function quoteSource(value?: string | null) {
  const sourceUrl = safeUrl(value);
  if (sourceUrl && /(?:^|\.)reddit\.com$/i.test(new URL(sourceUrl).hostname)) {
    return { sourceKind: "reddit", sourceLabel: "Reddit", sourceUrl };
  }
  return { sourceKind: "openai", sourceLabel: "OpenAI discovery", sourceUrl };
}

function safeUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
