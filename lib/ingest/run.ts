import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matches,
  painSignals,
  problemLinks,
  problems,
  problemScores,
  rawDocuments,
  recommendedActions,
  solutionProblems,
  sources,
  workarounds,
} from "@/lib/db/schema";
import { assignProblem, ensureTaxonomy, rescoreProblems } from "./cluster";
import { extractSignal } from "./extract";
import { fetchGitHub } from "./sources/github";
import { fetchHackerNews } from "./sources/hn";
import { fetchReddit } from "./sources/reddit";
import { fetchStackExchange } from "./sources/stackexchange";
import type { FetchedDoc, IngestMode, IngestStats } from "./types";

export async function resetGraph() {
  await db.delete(recommendedActions);
  await db.delete(matches);
  await db.delete(solutionProblems);
  await db.delete(painSignals);
  await db.delete(problemScores);
  await db.delete(problemLinks);
  await db.delete(workarounds);
  await db.delete(problems);
  await db.delete(rawDocuments);
}

export async function runIngest(
  mode: IngestMode = "full",
  options: { reset?: boolean } = {},
): Promise<IngestStats> {
  if (options.reset) await resetGraph();
  await ensureTaxonomy();
  const sourceRows = await db.select().from(sources);
  const sourceBySlug = Object.fromEntries(sourceRows.map((row) => [row.slug, row]));

  const skipped: string[] = [];
  const fetched: FetchedDoc[] = [];
  const used: string[] = [];

  try {
    const hn = await fetchHackerNews(mode);
    fetched.push(...hn);
    used.push("hn");
  } catch (error) {
    skipped.push("hn");
    console.warn("Hacker News ingest failed:", error);
  }

  try {
    const se = await fetchStackExchange(mode);
    fetched.push(...se);
    used.push("stackexchange");
  } catch (error) {
    skipped.push("stackexchange");
    console.warn("Stack Exchange ingest failed:", error);
  }

  try {
    const gh = await fetchGitHub(mode);
    if (gh.length === 0) skipped.push("github");
    else used.push("github");
    fetched.push(...gh);
  } catch (error) {
    skipped.push("github");
    console.warn("GitHub ingest failed:", error);
  }

  try {
    const reddit = await fetchReddit(mode);
    if (reddit.length === 0) skipped.push("reddit");
    else used.push("reddit");
    fetched.push(...reddit);
  } catch (error) {
    skipped.push("reddit");
    console.warn("Reddit ingest failed:", error);
  }

  let newDocuments = 0;
  let newSignals = 0;

  for (const doc of fetched) {
    const source = sourceBySlug[doc.sourceSlug];
    if (!source) continue;

    await db
      .insert(rawDocuments)
      .values({
        id: crypto.randomUUID(),
        sourceId: source.id,
        externalId: doc.externalId,
        url: doc.url,
        title: doc.title,
        body: doc.body,
        author: doc.author,
        publishedAt: doc.publishedAt,
      })
      .onConflictDoNothing({
        target: [rawDocuments.sourceId, rawDocuments.externalId],
      });

    const [stored] = await db
      .select()
      .from(rawDocuments)
      .where(
        and(
          eq(rawDocuments.sourceId, source.id),
          eq(rawDocuments.externalId, doc.externalId),
        ),
      )
      .limit(1);
    if (!stored) continue;

    const [already] = await db
      .select({ id: painSignals.id })
      .from(painSignals)
      .where(eq(painSignals.documentId, stored.id))
      .limit(1);
    if (already) continue;

    newDocuments += 1;
    const extracted = await extractSignal(doc);
    if (!extracted) {
      await db.insert(painSignals).values({
        id: crypto.randomUUID(),
        problemId: null,
        documentId: stored.id,
        quote: "[not-a-pain]",
        intensity: 0,
        purchaseIntent: 0,
      });
      continue;
    }

    const problemId = await assignProblem(extracted);
    await db.insert(painSignals).values({
      id: crypto.randomUUID(),
      problemId,
      documentId: stored.id,
      quote: extracted.quote,
      personaGuess: extracted.personaGuess,
      workaround: extracted.workaround,
      intensity: extracted.intensity,
      purchaseIntent: extracted.purchaseIntent,
    });
    newSignals += 1;
  }

  await rescoreProblems();

  const problemCount = new Set(
    (
      await db
        .select({ problemId: painSignals.problemId })
        .from(painSignals)
    )
      .map((row) => row.problemId)
      .filter(Boolean),
  ).size;

  return {
    documents: fetched.length,
    newDocuments,
    signals: newSignals,
    problems: problemCount,
    sources: used,
    skipped,
  };
}
