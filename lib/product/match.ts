import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  painSignals,
  problems,
  rawDocuments,
  sources,
} from "@/lib/db/schema";
import { overlap, tokens } from "@/lib/ingest/text";
import type { ConversationMatch, ProblemDna } from "./types";

const WEAK = new Set([
  "see",
  "where",
  "already",
  "exists",
  "exist",
  "find",
  "finding",
  "people",
  "asking",
  "then",
  "into",
  "about",
  "just",
  "like",
  "more",
  "most",
  "best",
  "help",
  "need",
  "want",
  "page",
  "site",
  "home",
  "built",
  "build",
  "using",
  "used",
  "make",
  "made",
  "get",
  "got",
  "new",
  "one",
  "way",
  "also",
  "than",
  "them",
  "they",
  "their",
  "there",
  "here",
  "when",
  "what",
  "which",
  "tool",
  "tools",
  "app",
  "apps",
  "software",
  "platform",
  "platforms",
  "free",
  "trial",
  "easy",
  "user",
  "rated",
  "grow",
  "business",
  "sign",
  "day",
  "use",
  "uses",
]);

export type RankedMatch = Omit<ConversationMatch, "id"> & {
  signalId: string;
  problemId: string;
};

export async function matchProductToGraph(dna: ProblemDna): Promise<RankedMatch[]> {
  const query = [
    dna.name,
    dna.solves,
    dna.forWho,
    dna.when,
    dna.competingAgainst,
    dna.summary,
    ...dna.keywords,
  ]
    .filter((value) => value && value !== "Not stated on the page")
    .join(" ");

  const queryTokens = new Set(
    [...tokens(query)].filter((word) => word.length >= 3 && !WEAK.has(word)),
  );
  if (queryTokens.size === 0) return [];

  const rows = await db
    .select({
      signalId: painSignals.id,
      quote: painSignals.quote,
      intent: painSignals.purchaseIntent,
      problemId: problems.id,
      problemTitle: problems.title,
      problemSlug: problems.slug,
      problemSummary: problems.summary,
      publishedAt: rawDocuments.publishedAt,
      url: rawDocuments.url,
      source: sources.name,
    })
    .from(painSignals)
    .innerJoin(problems, eq(painSignals.problemId, problems.id))
    .innerJoin(rawDocuments, eq(painSignals.documentId, rawDocuments.id))
    .innerJoin(sources, eq(rawDocuments.sourceId, sources.id))
    .where(and(isNotNull(painSignals.problemId), ne(painSignals.quote, "[not-a-pain]")))
    .orderBy(desc(rawDocuments.publishedAt));

  const scored = rows
    .map((row) => {
      const cleanedQuery = [...queryTokens].join(" ");
      const clusterText = `${row.problemTitle} ${row.problemSummary ?? ""}`;
      const quoteHay = row.quote.toLowerCase();
      const quoteHits = [...queryTokens].filter((word) => containsToken(quoteHay, word));
      const problemFit = overlap(cleanedQuery, clusterText);
      const quoteFit = overlap(cleanedQuery, row.quote);
      const fit = clamp01(
        problemFit * 0.3 + quoteFit * 0.4 + Math.min(0.4, quoteHits.length * 0.2),
      );
      if (quoteHits.length === 0 || fit < 0.16 || !isCredibleMatch(quoteHits)) return null;
      const intent = clamp01(row.intent ?? 0.5);
      const recency = recencyScore(row.publishedAt);
      return {
        fit: round2(fit),
        intent: round2(intent),
        recency: round2(recency),
        why: explain(quoteHits, row.problemTitle),
        quote: row.quote,
        source: row.source,
        url: row.url,
        date: formatRelative(row.publishedAt),
        problemTitle: row.problemTitle,
        problemSlug: row.problemSlug,
        signalId: row.signalId,
        problemId: row.problemId,
        rank: fit * 0.55 + intent * 0.3 + recency * 0.15,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => b.rank - a.rank);

  const seen = new Set<string>();
  const unique: RankedMatch[] = [];
  for (const row of scored) {
    const key = `${row.problemSlug}:${row.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { rank: _rank, ...rest } = row;
    unique.push(rest);
    if (unique.length >= 12) break;
  }
  return unique;
}

function explain(hits: string[], problemTitle: string) {
  if (hits.length === 0) return `Closest live cluster: ${problemTitle}.`;
  const shown = hits.slice(0, 4).map((word) => `“${word}”`).join(", ");
  return `Matches ${shown} in ${problemTitle}.`;
}

function recencyScore(date: Date | null) {
  if (!date) return 0.45;
  const days = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
  return clamp01(1 / (1 + days / 45));
}

function formatRelative(date: Date | null) {
  if (!date) return "recent";
  const days = Math.round((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

function containsToken(haystack: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\b${escaped}\\b`, "i").test(haystack)) return true;
  if (word.endsWith("s") && word.length > 5) {
    const singular = word.slice(0, -1);
    return new RegExp(`\\b${singular}\\b`, "i").test(haystack);
  }
  return false;
}

function isCredibleMatch(hits: string[]) {
  const strong = new Set([
    "crm",
    "lead",
    "leads",
    "invoice",
    "invoices",
    "follow",
    "report",
    "reporting",
    "quote",
    "quotes",
    "pipeline",
    "sales",
    "vat",
    "booking",
    "freelancer",
    "accountant",
    "bookkeeping",
  ]);
  if (hits.some((hit) => strong.has(hit) || hit.length > 7)) return true;
  return hits.length >= 2;
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
