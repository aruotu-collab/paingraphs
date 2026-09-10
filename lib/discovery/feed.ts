import { addDiscoverySignal } from "./store";

const MAX_BODY = 400_000;
const MAX_ITEMS = 25;

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

function fromJson(value: unknown): ParsedSignal[] {
  if (typeof value === "string" && value.trim().length >= 12) {
    return [{ rawText: value.trim() }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => fromJson(item)).slice(0, MAX_ITEMS);
  }
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.signals)) return fromJson(record.signals);
  if (Array.isArray(record.items)) return fromJson(record.items);
  const text =
    (typeof record.text === "string" && record.text) ||
    (typeof record.rawText === "string" && record.rawText) ||
    (typeof record.quote === "string" && record.quote) ||
    (typeof record.title === "string" && record.title) ||
    "";
  if (text.trim().length < 12) return [];
  const url =
    (typeof record.url === "string" && record.url) ||
    (typeof record.link === "string" && record.link) ||
    null;
  return [
    {
      rawText: text.trim().slice(0, 4000),
      sourceUrl: url,
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
      block.match(/<(description|summary)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ?? "";
    const link =
      block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ||
      block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ||
      null;
    const text = `${stripTags(title)}. ${stripTags(desc)}`.replace(/\s+/g, " ").trim();
    if (text.length < 12) return [];
    return [{ rawText: text.slice(0, 4000), sourceUrl: link?.trim() ?? null }];
  });
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").trim();
}

export async function fetchLicensedFeed(feedUrl: string) {
  const url = publicFeedUrl(feedUrl);
  if (!url) return { error: "Feed URL is not a public http(s) address.", items: [] };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "error",
      signal: controller.signal,
      headers: { accept: "application/json, application/rss+xml, application/atom+xml, text/xml, text/plain" },
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
    if (result.error) errors.push(`${source.id}: ${result.error}`);
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
  return { fetched, queued, errors };
}
