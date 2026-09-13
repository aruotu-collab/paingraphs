import { listPlacementOptions } from "@/lib/catalog/placements";
import type { ExtractedSignal } from "./extract";
import { clip, normalizeText } from "./text";

const FORUM_SOURCES = new Set(["src-hn-ask", "src-se-softwarerecs"]);
const BATCH = 6;

export function openaiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function openaiModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

function fold(value: string) {
  return normalizeText(value).replace(/\s+/g, " ").trim();
}

function quoteFromSource(raw: string, quote: string | null | undefined) {
  const needle = fold(quote || "");
  if (needle.length < 8) return null;
  const haystack = fold(raw);
  if (haystack.includes(needle)) return clip(quote || "", 280);
  const words = needle.split(" ").filter((word) => word.length > 2);
  if (words.length < 3) return null;
  const shared = words.filter((word) => haystack.includes(word)).length;
  return shared / words.length >= 0.8 ? clip(quote || "", 280) : null;
}

function clamp(value: unknown, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function textOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? clip(value, 240) : null;
}

export function groundedExtraction(
  rawText: string,
  sourceId: string | null,
  payload: Record<string, unknown>,
  allowed: { categories: Set<string>; clusters: Map<string, string> },
): ExtractedSignal {
  const quote = quoteFromSource(rawText, textOrNull(payload.quote));
  const products = textOrNull(payload.productsMentioned);
  const forum = sourceId ? FORUM_SOURCES.has(sourceId) : false;
  const noiseFlag = payload.noise === true || !quote || (forum && !products);
  const categorySlug = textOrNull(payload.categorySlug);
  const clusterSlug = textOrNull(payload.clusterSlug);
  const category =
    categorySlug && allowed.categories.has(categorySlug) ? categorySlug : null;
  const cluster =
    clusterSlug && allowed.clusters.has(clusterSlug) ? clusterSlug : null;
  const title =
    textOrNull(payload.title) ||
    clip(quote || rawText, 80);
  const painStatement =
    textOrNull(payload.painStatement) || quote || clip(rawText, 280);
  return {
    title,
    painStatement,
    persona: textOrNull(payload.persona),
    context: textOrNull(payload.trigger),
    jobToBeDone: textOrNull(payload.jobToBeDone),
    trigger: textOrNull(payload.trigger),
    frequency: null,
    severityLanguage: null,
    workaround: textOrNull(payload.workaround),
    productsMentioned: products,
    dissatisfaction: null,
    moneySignal: null,
    willingnessToPay: null,
    seekingSolution: payload.seekingSolution === true,
    geography: textOrNull(payload.geography),
    categorySlug: cluster ? allowed.clusters.get(cluster) ?? category : category,
    clusterSlug: cluster,
    severity: clamp(payload.severity, 48),
    buyingIntent: clamp(payload.buyingIntent, 40),
    founderOpportunity: clamp(payload.founderOpportunity, 50),
    affiliateOpportunity: clamp(payload.affiliateOpportunity, 40),
    confidence: noiseFlag ? 18 : clamp(payload.confidence, 55),
    noise: noiseFlag,
    reason: noiseFlag
      ? quote
        ? forum && !products
          ? "Forum text has no consumer product in the source."
          : textOrNull(payload.reason) || "Not a grounded consumer product pain."
        : "Model quote was not found in the licensed source text."
      : "Extracted from the permitted signal with OpenAI. Quote is from the source.",
    extractor: "openai",
  };
}

async function allowedPlacements() {
  const options = await listPlacementOptions();
  return {
    categories: new Set(options.map((row) => row.categorySlug)),
    clusters: new Map(options.map((row) => [row.slug, row.categorySlug])),
    labels: options.map((row) => `${row.categorySlug}/${row.slug}`),
  };
}

type SignalInput = {
  id: string;
  sourceId: string;
  rawText: string;
};

async function completeBatch(
  batch: SignalInput[],
  labels: string[],
): Promise<Record<string, unknown>[]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: openaiModel(),
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract consumer-product pains from licensed public posts. Use only the given text. A valid pain is a shopper struggling with a physical product they can buy, or a CPSC recall of a consumer product that creates a replacement need. Software-dev tooling, hiring, and generic tech stack questions are noise. Copy a quote verbatim from the text. Do not invent products, URLs, complaints, or HopLinks. Respond with json only: {\"items\":[{...}]}.",
          },
          {
            role: "user",
            content: JSON.stringify({
              allowedPlacements: labels,
              items: batch.map((item) => ({
                id: item.id,
                sourceId: item.sourceId,
                text: clip(item.rawText, 1600),
              })),
              fields: [
                "id",
                "noise",
                "reason",
                "title",
                "painStatement",
                "quote",
                "productsMentioned",
                "persona",
                "geography",
                "categorySlug",
                "clusterSlug",
                "workaround",
                "trigger",
                "jobToBeDone",
                "seekingSolution",
                "severity",
                "buyingIntent",
                "founderOpportunity",
                "affiliateOpportunity",
                "confidence",
              ],
            }),
          },
        ],
      }),
    });
    if (!response.ok) {
      console.warn("OpenAI extract failed:", response.status);
      return [];
    }
    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return [];
    const parsed = JSON.parse(content) as { items?: unknown };
    return Array.isArray(parsed.items)
      ? parsed.items.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object",
        )
      : [];
  } catch (error) {
    console.warn(
      "OpenAI extract error:",
      error instanceof Error ? error.message : error,
    );
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function extractSignalsWithOpenAI(signals: SignalInput[]) {
  if (!openaiConfigured() || signals.length === 0) return new Map<string, ExtractedSignal>();
  const allowed = await allowedPlacements();
  const out = new Map<string, ExtractedSignal>();
  for (let i = 0; i < signals.length; i += BATCH) {
    const batch = signals.slice(i, i + BATCH);
    const items = await completeBatch(batch, allowed.labels);
    const byId = new Map(
      items
        .map((item) => [String(item.id || ""), item] as const)
        .filter(([id]) => id),
    );
    for (const signal of batch) {
      const payload = byId.get(signal.id);
      if (!payload) continue;
      out.set(
        signal.id,
        groundedExtraction(signal.rawText, signal.sourceId, payload, allowed),
      );
    }
  }
  return out;
}
