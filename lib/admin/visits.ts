import { and, desc, eq, gte, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { pageVisits } from "@/lib/db/schema";
import { ensureAdminTables } from "./db";
import { classifyVisit } from "./source";

const recent = new Map<string, number>();
const SECRET_PARAM = /^(token|code|password|secret|auth|email|magic|callbackurl|state)$/i;

export function clientIp(headerList: Headers) {
  const picks = [
    headerList.get("cf-connecting-ip"),
    headerList.get("x-real-ip"),
    headerList.get("x-vercel-forwarded-for"),
    headerList.get("x-forwarded-for")?.split(",")[0],
  ];
  const ip = picks.map((value) => value?.trim()).find(Boolean);
  return ip && ip.length < 80 ? ip : "unknown";
}

export function geoFromHeaders(headerList: Headers) {
  const country =
    headerList.get("cf-ipcountry") ||
    headerList.get("x-vercel-ip-country") ||
    null;
  const cityRaw =
    headerList.get("x-vercel-ip-city") || headerList.get("cf-ipcity") || null;
  let city = cityRaw;
  try {
    if (cityRaw) city = decodeURIComponent(cityRaw);
  } catch {
    city = cityRaw;
  }
  return {
    country: country && country !== "XX" ? country.slice(0, 8) : null,
    city: city ? city.slice(0, 80) : null,
  };
}

export function isBotUa(ua: string) {
  return /bot|crawler|spider|preview|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|bytespider|gptbot|claudebot|semrush|ahrefs|mj12/i.test(
    ua,
  );
}

function sanitizePath(raw: string) {
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return null;
  }
  const url = new URL(raw, "https://paingraphs.com");
  const kept = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!SECRET_PARAM.test(key)) kept.set(key, value.slice(0, 80));
  });
  const query = kept.toString().slice(0, 300);
  return {
    path: url.pathname.slice(0, 240) || "/",
    query: query || null,
  };
}

function skipPath(path: string) {
  return (
    path.startsWith("/_next") ||
    path.startsWith("/api/") ||
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path.startsWith("/sitemap")
  );
}

export async function recordPageVisit(input: {
  rawPath: string;
  referrer?: string | null;
  landingReferrer?: string | null;
  headers: Headers;
  userId?: string | null;
  email?: string | null;
}) {
  const parsed = sanitizePath(input.rawPath);
  if (!parsed || skipPath(parsed.path)) return;
  const ip = clientIp(input.headers);
  const ua = (input.headers.get("user-agent") || "").slice(0, 300);
  const key = `${ip}|${parsed.path}`;
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < 15000) return;
  recent.set(key, now);
  if (recent.size > 4000) recent.clear();

  await ensureAdminTables();
  const geo = geoFromHeaders(input.headers);
  const referrer = cleanReferrer(input.referrer || input.headers.get("referer"));
  const landing = cleanReferrer(input.landingReferrer) || referrer;
  const classified = classifyVisit({
    referrer,
    landingReferrer: landing,
    query: parsed.query,
    userAgent: ua,
  });

  await db.insert(pageVisits).values({
    id: crypto.randomUUID(),
    path: parsed.path,
    query: parsed.query,
    ip,
    country: geo.country,
    city: geo.city,
    userAgent: ua || null,
    referrer: referrer || null,
    source: classified.source,
    sourceHost: classified.host,
    userId: input.userId || null,
    email: input.email?.toLowerCase() || null,
    isBot: isBotUa(ua),
  });
}

function cleanReferrer(raw?: string | null) {
  if (!raw) return "";
  return raw
    .slice(0, 400)
    .replace(/([?&])(token|code|password|secret)=[^&]*/gi, "$1$2=redacted");
}

export function sourceLabel(row: {
  source?: string | null;
  sourceHost?: string | null;
  referrer?: string | null;
  query?: string | null;
  userAgent?: string | null;
}) {
  if (row.source) return { source: row.source, host: row.sourceHost ?? null };
  return classifyVisit({
    referrer: row.referrer,
    query: row.query,
    userAgent: row.userAgent,
  });
}

export async function listVisits(input: {
  ip?: string;
  path?: string;
  source?: string;
  hideBots?: boolean;
  limit?: number;
  sinceMs?: number;
}) {
  await ensureAdminTables();
  const filters = [];
  if (input.ip) filters.push(like(pageVisits.ip, `%${input.ip.slice(0, 80)}%`));
  if (input.path) filters.push(like(pageVisits.path, `%${input.path.slice(0, 120)}%`));
  if (input.source) filters.push(eq(pageVisits.source, input.source.slice(0, 40)));
  if (input.hideBots) filters.push(eq(pageVisits.isBot, false));
  if (input.sinceMs) {
    filters.push(gte(pageVisits.createdAt, new Date(input.sinceMs)));
  }
  const where = filters.length ? and(...filters) : undefined;
  return db
    .select()
    .from(pageVisits)
    .where(where)
    .orderBy(desc(pageVisits.createdAt))
    .limit(input.limit ?? 250);
}

export async function visitStats() {
  await ensureAdminTables();
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const weekRows = await db
    .select()
    .from(pageVisits)
    .where(gte(pageVisits.createdAt, weekAgo))
    .orderBy(desc(pageVisits.createdAt))
    .limit(5000);
  const counted = await db.select({ id: pageVisits.id }).from(pageVisits);
  const pages = new Map<string, number>();
  const sources = new Map<string, number>();
  const ips = new Map<
    string,
    {
      ip: string;
      country: string | null;
      hits: number;
      sources: Map<string, number>;
    }
  >();
  let day = 0;
  let humans = 0;
  for (const row of weekRows) {
    if (row.createdAt >= dayAgo) day += 1;
    if (!row.isBot) humans += 1;
    pages.set(row.path, (pages.get(row.path) ?? 0) + 1);
    const label = sourceLabel(row).source;
    sources.set(label, (sources.get(label) ?? 0) + 1);
    const seen = ips.get(row.ip) ?? {
      ip: row.ip,
      country: row.country,
      hits: 0,
      sources: new Map<string, number>(),
    };
    seen.hits += 1;
    seen.sources.set(label, (seen.sources.get(label) ?? 0) + 1);
    ips.set(row.ip, seen);
  }
  return {
    all: counted.length,
    day,
    week: weekRows.length,
    humans,
    uniqueIpsWeek: ips.size,
    topPages: [...pages.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([path, hits]) => ({ path, hits })),
    topSources: [...sources.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([source, hits]) => ({ source, hits })),
    topIps: [...ips.values()]
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 12)
      .map((row) => ({
        ip: row.ip,
        country: row.country,
        hits: row.hits,
        sources: [...row.sources.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([source, hits]) => `${source} ${hits}`)
          .join(" · "),
        primary:
          [...row.sources.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
          "Direct",
      })),
  };
}
