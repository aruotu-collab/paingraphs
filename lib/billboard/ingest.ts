import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { billboardTopics } from "@/lib/db/schema";
import { getJson } from "@/lib/ingest/signals";
import { billboardCategory, normalizeCategorySlug } from "./categories";
import { ensureBillboardTables } from "./db";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const CHART_SIZE = 20;

type OpenAIResponse = {
  output?: {
    content?: { text?: string }[];
  }[];
  output_text?: string;
};

type RawTopic = {
  rank?: number;
  title?: string;
  problem?: string;
  whyNow?: string;
  why_now?: string;
  categorySlug?: string;
  category_slug?: string;
  searchPhrase?: string;
  search_phrase?: string;
  evidence?: string;
  sources?: { title?: string; url?: string }[];
  heat?: number;
  intent?: number;
  pain?: number;
};

export async function ingestBillboard() {
  await ensureBillboardTables();
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { updated: 0, chartDate: todayUtc(), skipped: "no-openai-key" };

  const chartDate = todayUtc();
  let topics = await discoverChart(key, CHART_SIZE);
  if (topics.length === 0) {
    topics = await discoverChart(key, 12);
  }
  if (topics.length === 0) {
    console.warn("billboard ingest empty; keeping yesterday's ranks");
    return { updated: 0, chartDate, skipped: "empty-chart" };
  }

  const seen = new Set<string>();
  const now = new Date();
  let updated = 0;

  for (const [index, raw] of topics.entries()) {
    const title = (raw.title ?? "").trim();
    if (title.length < 8) continue;
    const slug = topicSlug(title);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const categorySlug = normalizeCategorySlug(raw.categorySlug ?? raw.category_slug ?? "");
    const category = billboardCategory(categorySlug);
    const rank = clampRank(raw.rank ?? index + 1, index + 1);
    const id = `bb-${slug}`;
    const [existing] = await db
      .select()
      .from(billboardTopics)
      .where(eq(billboardTopics.id, id));

    const daysOnChart =
      existing && existing.chartDate !== chartDate
        ? existing.daysOnChart + 1
        : existing?.daysOnChart ?? 1;

    const values = {
      slug,
      title: title.slice(0, 120),
      problem: cleanText(raw.problem ?? title, 420),
      whyNow: cleanText(raw.whyNow ?? raw.why_now ?? "", 280) || "People are searching this now.",
      categorySlug: category.slug,
      categoryName: category.name,
      searchPhrase: cleanText(raw.searchPhrase ?? raw.search_phrase ?? title, 120),
      evidence: cleanText(raw.evidence ?? "", 280) || "Public search and complaint volume.",
      sources: JSON.stringify(cleanSources(raw.sources)),
      heat: clampScore(raw.heat, 80),
      intent: clampScore(raw.intent, 74),
      pain: clampScore(raw.pain, 82),
      rank,
      daysOnChart,
      chartDate,
      lastSeenAt: now,
    };

    if (existing) {
      await db.update(billboardTopics).set(values).where(eq(billboardTopics.id, id));
    } else {
      await db.insert(billboardTopics).values({
        id,
        painId: null,
        firstSeenAt: now,
        ...values,
      });
    }
    updated += 1;
  }

  if (updated > 0) {
    await db
      .update(billboardTopics)
      .set({ rank: 0 })
      .where(and(ne(billboardTopics.chartDate, chartDate), ne(billboardTopics.rank, 0)));
  }

  return { updated, chartDate };
}

async function discoverChart(key: string, size: number): Promise<RawTopic[]> {
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
      input: `Search the public web for the ${size} most popular consumer product-fit pain points people are searching for and complaining about right now.

This is a Billboard Hot 100 style chart of PAIN TOPICS, not products and not best-of lists.
Each topic must be a specific daily lived problem, styled like "Headphones that do not hurt with glasses".
Skip brands, skip Reddit, skip medical diagnosis, skip "best X 2026" listicles.

Allowed category_slug values only: electronics, personal-care, skincare, home, clothes, shoes.

Return JSON only (no markdown):
{"topics":[{
  "rank":1,
  "title":"Earbuds that do not fall out when running",
  "problem":"2 sentences on the lived problem.",
  "whyNow":"1 sentence on why this is being searched now.",
  "category_slug":"electronics",
  "search_phrase":"earbuds that stay in while running",
  "evidence":"What public search, forums, or reviews show this is popular.",
  "sources":[{"title":"page title","url":"https://..."}],
  "heat":92,
  "intent":84,
  "pain":88
}]}

Rules: exactly ${size} distinct topics, ranks 1-${size}, 1 source URL each, scores 1-99. Keep every string short. Valid JSON only.`,
    }),
  });

  return parseTopics(outputText(data)).slice(0, size);
}

export function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function cleanText(value: string, max: number) {
  return value
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/\((https?:\/\/[^)]+)\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function topicSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function clampScore(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.min(99, Math.round(number)));
}

function clampRank(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.min(CHART_SIZE, Math.round(number)));
}

function cleanSources(rows?: { title?: string; url?: string }[]) {
  return (rows ?? [])
    .map((row) => ({
      title: (row.title ?? "").trim().slice(0, 80),
      url: safeUrl(row.url),
    }))
    .filter((row): row is { title: string; url: string } => Boolean(row.url))
    .slice(0, 3);
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

function outputText(data: OpenAIResponse) {
  if (data.output_text?.trim()) return data.output_text;
  return (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((block) => block.text ?? "")
    .join("\n");
}

function parseTopics(text: string): RawTopic[] {
  const parsed = parseJson(text) as { topics?: RawTopic[] };
  if (Array.isArray(parsed.topics) && parsed.topics.length) return parsed.topics;
  return salvageTopics(text);
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
      `billboard json: ${error instanceof Error ? error.message : "parse failed"}`,
    );
    return {};
  }
}

function salvageTopics(text: string): RawTopic[] {
  const start = text.search(/"topics"\s*:/);
  if (start < 0) return [];
  const bracket = text.indexOf("[", start);
  if (bracket < 0) return [];
  let chunk = text.slice(bracket);
  const last = chunk.lastIndexOf("}");
  if (last < 0) return [];
  chunk = `${chunk.slice(0, last + 1)}]`;
  try {
    const topics = JSON.parse(chunk) as RawTopic[];
    return Array.isArray(topics) ? topics : [];
  } catch {
    return [];
  }
}
