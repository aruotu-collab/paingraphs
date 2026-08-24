import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { decodeEntities } from "@/lib/ingest/text";
import type { PageExtract } from "./types";

const USER_AGENT =
  process.env.INGEST_USER_AGENT ??
  "PainGraphs/0.1 (+https://paingraphs.com; demand-intelligence)";

const MAX_BYTES = 400_000;
const MAX_REDIRECTS = 4;
const FETCH_MS = 10_000;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.goog",
]);

export function parseProductUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Paste a product URL first.");
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("That does not look like a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs can be analysed.");
  }
  url.hash = "";
  url.username = "";
  url.password = "";
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url;
}

export async function fetchProductPage(rawUrl: string): Promise<PageExtract> {
  let current = parseProductUrl(rawUrl);
  await assertPublicUrl(current);

  let html = "";
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(current.href, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(FETCH_MS),
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("The site redirected without a location.");
      current = new URL(location, current);
      if (current.protocol !== "http:" && current.protocol !== "https:") {
        throw new Error("The site redirected to a non-web URL.");
      }
      await assertPublicUrl(current);
      continue;
    }

    if (!response.ok) {
      throw new Error(`The page returned ${response.status} and could not be read.`);
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      throw new Error("That URL is not an HTML page.");
    }
    html = await readLimitedText(response);
    break;
  }
  if (!html) throw new Error("Too many redirects from that URL.");

  return extractPage(current.href, html);
}

async function assertPublicUrl(url: URL) {
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    BLOCKED_HOSTS.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Local and internal URLs cannot be analysed.");
  }

  if (isIP(host)) {
    if (isPrivateIp(host)) {
      throw new Error("Private network addresses cannot be analysed.");
    }
    return;
  }

  let records: { address: string }[];
  try {
    records = await lookup(host, { all: true });
  } catch {
    throw new Error("That host could not be resolved.");
  }
  if (records.length === 0 || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("Private network addresses cannot be analysed.");
  }
}

function isPrivateIp(ip: string) {
  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80") ||
      normalized.startsWith("::ffff:127.") ||
      normalized.startsWith("::ffff:10.") ||
      normalized.startsWith("::ffff:192.168.") ||
      /^::ffff:169\.254\./.test(normalized) ||
      /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
    );
  }

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

async function readLimitedText(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return (await response.text()).slice(0, MAX_BYTES);
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BYTES) {
      text += decoder.decode(value, { stream: true }).slice(0, MAX_BYTES - text.length);
      await reader.cancel();
      break;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function extractPage(url: string, html: string): PageExtract {
  const title = decodeEntities(attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || "");
  const description =
    meta(html, "description") ||
    meta(html, "og:description") ||
    "";
  const siteName = meta(html, "og:site_name") || hostnameName(url);
  const ogTitle = meta(html, "og:title");
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((match) => decodeEntities(stripTags(match[1] ?? "")))
    .filter(Boolean)
    .slice(0, 4);
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const text = decodeEntities(stripTags(cleaned)).slice(0, 4000);

  if (!title && !description && text.length < 40) {
    throw new Error("The page did not expose enough public text to analyse.");
  }

  return {
    url,
    title: ogTitle || title || siteName,
    description,
    siteName,
    headings,
    text,
  };
}

function meta(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const named = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const reversed = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["']`,
    "i",
  );
  return decodeEntities(html.match(named)?.[1] || html.match(reversed)?.[1] || "");
}

function attr(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1] ?? "";
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function hostnameName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
