import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matches,
  painSignals,
  problems,
  productProfiles,
  rawDocuments,
  sources,
} from "@/lib/db/schema";
import { extractProblemDna } from "./dna";
import { fetchProductPage, parseProductUrl } from "./fetch-page";
import { matchProductToGraph } from "./match";
import type { ProblemDna, ProductSnapshot } from "./types";

export async function analyseProductUrl(
  userId: string,
  rawUrl: string,
): Promise<ProductSnapshot> {
  const url = parseProductUrl(rawUrl).href;
  const page = await fetchProductPage(url);
  const dna = await extractProblemDna(page);
  const ranked = await matchProductToGraph(dna);

  const existing = await db
    .select()
    .from(productProfiles)
    .where(and(eq(productProfiles.userId, userId), eq(productProfiles.url, url)))
    .limit(1);

  const now = new Date();
  const productId = existing[0]?.id ?? crypto.randomUUID();

  if (existing[0]) {
    await db
      .update(productProfiles)
      .set({
        name: dna.name,
        problemDna: JSON.stringify(dna),
        updatedAt: now,
      })
      .where(eq(productProfiles.id, productId));
    await db.delete(matches).where(eq(matches.productId, productId));
  } else {
    await db.insert(productProfiles).values({
      id: productId,
      userId,
      url,
      name: dna.name,
      problemDna: JSON.stringify(dna),
      createdAt: now,
      updatedAt: now,
    });
  }

  if (ranked.length > 0) {
    await db.insert(matches).values(
      ranked.map((row) => ({
        id: crypto.randomUUID(),
        productId,
        signalId: row.signalId,
        problemId: row.problemId,
        fit: row.fit,
        intent: row.intent,
        recency: row.recency,
        why: row.why,
        createdAt: now,
      })),
    );
  }

  return {
    id: productId,
    url,
    name: dna.name,
    dna,
    matches: ranked.map(({ signalId: _s, problemId: _p, ...rest }) => ({
      id: crypto.randomUUID(),
      ...rest,
    })),
    analysedAt: now.toISOString(),
  };
}

export function parseDna(raw: string | null): ProblemDna | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ProblemDna;
    if (!parsed.solves) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getLatestProductSnapshot(
  userId: string,
): Promise<ProductSnapshot | null> {
  const [profile] = await db
    .select()
    .from(productProfiles)
    .where(eq(productProfiles.userId, userId))
    .orderBy(desc(productProfiles.updatedAt))
    .limit(1);
  if (!profile) return null;
  const dna = parseDna(profile.problemDna);
  if (!dna) return null;

  const matchRows = await db
    .select({
      id: matches.id,
      fit: matches.fit,
      intent: matches.intent,
      recency: matches.recency,
      why: matches.why,
      quote: painSignals.quote,
      source: sources.name,
      url: rawDocuments.url,
      publishedAt: rawDocuments.publishedAt,
      problemTitle: problems.title,
      problemSlug: problems.slug,
    })
    .from(matches)
    .leftJoin(painSignals, eq(matches.signalId, painSignals.id))
    .leftJoin(rawDocuments, eq(painSignals.documentId, rawDocuments.id))
    .leftJoin(sources, eq(rawDocuments.sourceId, sources.id))
    .leftJoin(problems, eq(matches.problemId, problems.id))
    .where(eq(matches.productId, profile.id))
    .orderBy(desc(matches.fit));

  return {
    id: profile.id,
    url: profile.url,
    name: profile.name ?? dna.name,
    dna,
    matches: matchRows
      .filter((row) => row.quote && row.problemSlug)
      .map((row) => ({
        id: row.id,
        fit: row.fit,
        intent: row.intent,
        recency: row.recency ?? 0,
        why: row.why ?? `Matched in ${row.problemTitle}.`,
        quote: row.quote ?? "",
        source: row.source ?? "Live graph",
        url: row.url ?? "",
        date: formatRelative(row.publishedAt),
        problemTitle: row.problemTitle ?? "Matched pain",
        problemSlug: row.problemSlug ?? "",
      })),
    analysedAt: profile.updatedAt.toISOString(),
  };
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
