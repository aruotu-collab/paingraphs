import { eq } from "drizzle-orm";
import { billboardCategory } from "@/lib/billboard/categories";
import { db } from "@/lib/db";
import {
  billboardTopics,
  categories,
  painClusters,
  pains,
} from "@/lib/db/schema";
import {
  publishTopic,
  type DiscoveryTopic,
} from "@/lib/ingest/openai-discover";
import { getJson } from "@/lib/ingest/signals";
import { painHref } from "@/lib/market/queries";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

type OpenAIResponse = {
  output?: {
    content?: { text?: string }[];
  }[];
  output_text?: string;
};

export async function prepareBillboardTopic(topicId: string) {
  const [topic] = await db
    .select()
    .from(billboardTopics)
    .where(eq(billboardTopics.id, topicId));
  if (!topic) return { error: "That topic is no longer on the billboard." };

  if (topic.painId) {
    const href = await painPageHref(topic.painId);
    if (href) return { href };
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return { error: "OpenAI is not configured." };

  const category = billboardCategory(topic.categorySlug);
  const expanded = await expandTopic(key, topic);
  if (!expanded?.title) {
    return { error: "Could not expand this pain yet. Try again later." };
  }

  const existing = await db
    .select({ id: pains.id, slug: pains.slug, title: pains.title })
    .from(pains);
  const usedSlugs = new Set(existing.map((row) => row.slug));
  const usedTitles = new Set(existing.map((row) => row.title.toLowerCase()));

  const result = await publishTopic(category.id, expanded, usedSlugs, usedTitles);
  if (result.created === 0) {
    const already = existing.find(
      (row) =>
        row.slug === slugFrom(expanded.slug ?? expanded.title ?? "") ||
        row.title.toLowerCase() === (expanded.title ?? "").trim().toLowerCase(),
    );
    if (already) {
      await db
        .update(billboardTopics)
        .set({ painId: already.id })
        .where(eq(billboardTopics.id, topic.id));
      const href = await painPageHref(already.id);
      if (href) return { href };
    }
    return { error: "Could not prepare this pain with enough evidence yet." };
  }

  const painId = `pain-${slugFrom(expanded.slug ?? expanded.title ?? topic.slug)}`.slice(0, 64);
  await db
    .update(billboardTopics)
    .set({ painId })
    .where(eq(billboardTopics.id, topic.id));

  const href = await painPageHref(painId);
  if (!href) return { error: "Prepared, but the pain page is not ready yet." };
  return { href };
}

async function expandTopic(
  key: string,
  topic: typeof billboardTopics.$inferSelect,
): Promise<DiscoveryTopic | null> {
  const data = await getJson<OpenAIResponse>("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    signal: AbortSignal.timeout(90000),
    body: JSON.stringify({
      model: MODEL,
      tool_choice: "required",
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
      input: `Expand this consumer pain topic into a full PainGraphs shopper page. Search the public web for real first-person complaints.

Topic: ${topic.title}
Problem: ${topic.problem}
Why now: ${topic.whyNow}
Category: ${topic.categoryName}
Search phrase: ${topic.searchPhrase}

Style it like "Headphones that do not hurt with glasses": a specific daily pain, not a best-of list.
Do not invent reviews. Skip reddit. Do not invent tracking URLs or affiliate hop links.

Return JSON only (one object, no markdown):
{"topic":{
  "clusterSlug":"earbuds",
  "clusterName":"Earbuds",
  "clusterSummary":"Fit and fall-out during movement.",
  "slug":"${topic.slug}",
  "title":"${topic.title.replace(/"/g, "")}",
  "h1":"A shopper-facing headline.",
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

  const parsed = parseJson(outputText(data)) as { topic?: DiscoveryTopic } & DiscoveryTopic;
  return parsed.topic ?? (parsed.title ? parsed : null);
}

async function painPageHref(painId: string) {
  const [row] = await db
    .select({
      painSlug: pains.slug,
      clusterSlug: painClusters.slug,
      categorySlug: categories.slug,
    })
    .from(pains)
    .innerJoin(painClusters, eq(pains.clusterId, painClusters.id))
    .innerJoin(categories, eq(painClusters.categoryId, categories.id))
    .where(eq(pains.id, painId));
  if (!row) return null;
  return painHref(row.categorySlug, row.clusterSlug, row.painSlug);
}

function slugFrom(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
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
  } catch {
    return {};
  }
}
