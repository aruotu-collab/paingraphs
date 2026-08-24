import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  countries,
  industries,
  niches,
  painSignals,
  personas,
  problemLinks,
  problems,
  problemScores,
  rawDocuments,
  sources,
  workarounds,
} from "@/lib/db/schema";

export type Opportunity = {
  slug: string;
  title: string;
  summary: string;
  industry: string;
  niche: string;
  country: string;
  persona: string;
  demand: number;
  pain: number;
  intent: number;
  competition: number;
  growth: number;
  buildability: number;
  score: number;
  confidence: number;
  signalCount: number;
  trend: number[];
  workarounds: string[];
  solutions: { name: string; gap: string }[];
  quotes: { source: string; date: string; text: string; url: string }[];
  why: string;
};

const STOP = new Set(["the", "a", "an", "in", "for", "and", "of", "to"]);

export async function searchOpportunities(query: string) {
  const items = await listOpportunities();
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const words = q.split(/\s+/).filter((word) => word.length > 1 && !STOP.has(word));
  return items
    .map((item) => {
      const haystack = [
        item.title,
        item.industry,
        item.niche,
        item.country,
        item.persona,
        item.summary,
        ...item.quotes.map((quote) => quote.text),
        ...item.workarounds,
      ]
        .join(" ")
        .toLowerCase();
      const hits = words.filter((word) => haystack.includes(word)).length;
      return { item, hits };
    })
    .filter(({ hits, item }) => {
      const haystack = [
        item.title,
        item.industry,
        item.niche,
        item.persona,
        item.summary,
        ...item.quotes.map((quote) => quote.text),
      ]
        .join(" ")
        .toLowerCase();
      const specificWords = words.filter((word) => word.length > 2);
      if (specificWords.length === 0) return hits > 0;
      return specificWords.some((word) => haystack.includes(word));
    })
    .sort((a, b) => b.hits - a.hits || b.item.score - a.item.score)
    .map(({ item }) => item);
}

export async function getOpportunity(slug: string) {
  const items = await listOpportunities();
  return items.find((item) => item.slug === slug) ?? null;
}

export async function radarItems() {
  const items = await listOpportunities();
  return [...items].sort((a, b) => b.growth - a.growth).slice(0, 4);
}

async function listOpportunities(): Promise<Opportunity[]> {
  const problemRows = await db.select().from(problems);
  if (problemRows.length === 0) return [];

  const [scoreRows, linkRows, industryRows, nicheRows, personaRows, countryRows, workaroundRows, quoteRows] =
    await Promise.all([
      db.select().from(problemScores).orderBy(desc(problemScores.scoredAt)),
      db.select().from(problemLinks),
      db.select().from(industries),
      db.select().from(niches),
      db.select().from(personas),
      db.select().from(countries),
      db.select().from(workarounds),
      db
        .select({
          problemId: painSignals.problemId,
          quote: painSignals.quote,
          publishedAt: rawDocuments.publishedAt,
          url: rawDocuments.url,
          source: sources.name,
        })
        .from(painSignals)
        .innerJoin(rawDocuments, eq(painSignals.documentId, rawDocuments.id))
        .innerJoin(sources, eq(rawDocuments.sourceId, sources.id))
        .where(
          and(
            isNotNull(painSignals.problemId),
            ne(painSignals.quote, "[not-a-pain]"),
          ),
        ),
    ]);

  const latestScore = new Map<string, (typeof scoreRows)[number]>();
  for (const score of scoreRows) {
    if (!latestScore.has(score.problemId)) latestScore.set(score.problemId, score);
  }

  const industryById = Object.fromEntries(industryRows.map((row) => [row.id, row]));
  const nicheById = Object.fromEntries(nicheRows.map((row) => [row.id, row]));
  const personaById = Object.fromEntries(personaRows.map((row) => [row.id, row]));
  const countryById = Object.fromEntries(countryRows.map((row) => [row.id, row]));

  const items: Opportunity[] = [];
  for (const problem of problemRows) {
    const score = latestScore.get(problem.id);
    if (!score || score.signalCount <= 0) continue;
    const link = linkRows.find((row) => row.problemId === problem.id);
    const evidence = quoteRows
      .filter((row) => row.problemId === problem.id)
      .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
    const quotes = evidence.slice(0, 8).map((row) => ({
      source: row.source,
      date: formatRelative(row.publishedAt),
      text: row.quote,
      url: row.url,
    }));
    if (quotes.length === 0) continue;

    const namedWorkarounds = workaroundRows
      .filter((row) => row.problemId === problem.id)
      .map((row) => row.name);

    items.push({
      slug: problem.slug,
      title: problem.title,
      summary: problem.summary ?? "",
      industry: (link?.industryId && industryById[link.industryId]?.name) || "Software",
      niche: (link?.nicheId && nicheById[link.nicheId]?.name) || "Founders",
      country: (link?.countryId && countryById[link.countryId]?.code) || "GLOBAL",
      persona:
        (link?.personaId && personaById[link.personaId]?.name) || "Founder",
      demand: score.demand,
      pain: score.pain,
      intent: score.intent,
      competition: score.competition,
      growth: score.growth,
      buildability: score.buildability,
      score: score.opportunity,
      confidence: score.confidence ?? 0,
      signalCount: score.signalCount,
      trend: trendFrom(evidence.map((row) => row.publishedAt)),
      workarounds: namedWorkarounds,
      solutions: namedWorkarounds.map((name) => ({
        name,
        gap: "Named as a current workaround in live evidence.",
      })),
      quotes,
      why: score.rationale ?? problem.summary ?? "Ranked from live public demand signals.",
    });
  }

  return items.sort((a, b) => b.score - a.score);
}

function trendFrom(dates: (Date | null)[]) {
  const buckets = Array.from({ length: 12 }, () => 0);
  const now = new Date();
  for (const date of dates) {
    if (!date) {
      buckets[11] += 1;
      continue;
    }
    const months =
      (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    if (months >= 0 && months < 12) buckets[11 - months] += 1;
  }
  const max = Math.max(...buckets, 1);
  return buckets.map((value) => Math.round((value / max) * 100) || (value > 0 ? 8 : 0));
}

function formatRelative(date: Date | null) {
  if (!date) return "recent";
  const days = Math.round((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.round(days / 365);
  return `${years}y ago`;
}
