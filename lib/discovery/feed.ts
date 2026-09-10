import { addDiscoverySignal } from "./store";

const MAX_BODY = 400_000;
const MAX_ITEMS = 25;
const FETCH_MS = 12_000;

export function publicFeedUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "metadata.google.internal" ||
    host.startsWith("[")
  ) {
    return null;
  }
  if (
    /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)
  ) {
    return null;
  }
  return url.toString();
}

type ParsedSignal = {
  rawText: string;
  sourceUrl?: string | null;
  persona?: string | null;
  geography?: string | null;
};

function decodeMarkup(value: string) {
  const unescaped = value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&");
  return unescaped
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function fromJson(value: unknown): ParsedSignal[] {
  if (typeof value === "string" && value.trim().length >= 12) {
    return [{ rawText: decodeMarkup(value).slice(0, 4000) }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => fromJson(item)).slice(0, MAX_ITEMS);
  }
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.signals)) return fromJson(record.signals);
  if (Array.isArray(record.items)) return fromJson(record.items);
  if (Array.isArray(record.hits)) return fromJson(record.hits);
  if (Array.isArray(record.data)) return fromJson(record.data);

  const title = firstString(record, ["title"]);
  const body = firstString(record, [
    "text",
    "rawText",
    "quote",
    "excerpt",
    "body",
    "story_text",
    "comment_text",
    "description",
    "summary",
  ]);
  const parts = [decodeMarkup(title), decodeMarkup(body)].filter(Boolean);
  const rawText = [...new Set(parts)].join(". ").slice(0, 4000);
  if (rawText.length < 12) return [];

  const objectId =
    typeof record.objectID === "string"
      ? record.objectID
      : typeof record.objectID === "number"
        ? String(record.objectID)
        : "";
  const url =
    firstString(record, ["url", "link", "story_url"]) ||
    (objectId ? `https://news.ycombinator.com/item?id=${objectId}` : "");

  return [
    {
      rawText,
      sourceUrl: url || null,
      persona: typeof record.persona === "string" ? record.persona : null,
      geography: typeof record.geography === "string" ? record.geography : null,
    },
  ];
}

function fromXml(body: string): ParsedSignal[] {
  const items = body.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];
  return items.slice(0, MAX_ITEMS).flatMap((block) => {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const desc =
      block.match(/<(description|summary|content)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ??
      "";
    const link =
      block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ||
      block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ||
      null;
    const text = [decodeMarkup(title), decodeMarkup(desc)]
      .filter(Boolean)
      .join(". ")
      .slice(0, 4000);
    if (text.length < 12) return [];
    return [{ rawText: text, sourceUrl: link ? decodeMarkup(link) : null }];
  });
}

function userAgent() {
  return process.env.INGEST_USER_AGENT || "PainGraphs/0.1 (+https://paingraphs.com)";
}

export async function fetchLicensedFeed(feedUrl: string) {
  const url = publicFeedUrl(feedUrl);
  if (!url) return { error: "Feed URL is not a public http(s) address.", items: [] };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "error",
      signal: controller.signal,
      headers: {
        accept:
          "application/json, application/rss+xml, application/atom+xml, text/xml, text/plain",
        "user-agent": userAgent(),
      },
    });
    if (!response.ok) {
      return { error: `Feed returned ${response.status}.`, items: [] };
    }
    const text = (await response.text()).slice(0, MAX_BODY);
    const type = response.headers.get("content-type") || "";
    if (type.includes("json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
      return { items: fromJson(JSON.parse(text)) };
    }
    return { items: fromXml(text) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feed fetch failed.";
    return { error: message.slice(0, 160), items: [] };
  } finally {
    clearTimeout(timer);
  }
}

export async function ingestLicensedFeeds(
  sources: {
    id: string;
    feedUrl?: string | null;
    enabled: boolean;
    commercialUse: string;
    accessMethod: string;
    lastIngestedAt?: Date | null;
    frequencyHours: number;
  }[],
) {
  let fetched = 0;
  let queued = 0;
  const errors: string[] = [];
  const ingestedIds: string[] = [];
  const now = Date.now();
  for (const source of sources) {
    if (!source.enabled || source.commercialUse !== "permitted") continue;
    if (source.accessMethod !== "api" && source.accessMethod !== "feed") continue;
    if (!source.feedUrl) continue;
    const wait = (source.frequencyHours || 24) * 60 * 60 * 1000;
    if (source.lastIngestedAt && now - source.lastIngestedAt.getTime() < wait) {
      continue;
    }
    const result = await fetchLicensedFeed(source.feedUrl);
    fetched += 1;
    if (result.error) {
      errors.push(`${source.id}: ${result.error}`);
      continue;
    }
    ingestedIds.push(source.id);
    for (const item of result.items) {
      await addDiscoverySignal({
        sourceId: source.id,
        rawText: item.rawText,
        sourceUrl: item.sourceUrl,
        persona: item.persona,
        geography: item.geography,
      });
      queued += 1;
    }
  }
  return { fetched, queued, errors, ingestedIds };
}
