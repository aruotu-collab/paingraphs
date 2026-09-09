import { eq } from "drizzle-orm";
import { runSavedPainAlerts } from "@/lib/alerts/run";
import { db } from "@/lib/db";
import {
  discoverySources,
  painCandidateSignals,
  painCandidates,
  painSignals,
} from "@/lib/db/schema";
import { listPainGraphs } from "@/lib/paingraph/queries";
import { recalculatePainScores } from "@/lib/paingraph/recalc";
import { snapshotBillboardRanks } from "@/lib/ranks/snapshots";
import { ensureDiscoveryTables } from "./db";
import {
  addDiscoverySignal,
  createCandidate,
  listPendingSignals,
  markSignals,
  markSourceIngested,
  recordIngestRun,
  seedDiscoverySources,
  titleMatchesExisting,
} from "./store";
import { overlapScore } from "./text";

function firstSentence(text: string) {
  const clipped = text.replace(/\s+/g, " ").trim();
  const match = clipped.match(/^.{12,140}?[.?!]/);
  return (match?.[0] || clipped.slice(0, 96)).replace(/["“”]/g, "").trim();
}

export async function runDiscoveryIngest() {
  const startedAt = new Date();
  await ensureDiscoveryTables();
  await seedDiscoverySources();

  const graphs = await listPainGraphs();
  const pending = await listPendingSignals();
  let matched = 0;
  let created = 0;
  let clustered = 0;
  const openCandidates = await db
    .select()
    .from(painCandidates)
    .where(eq(painCandidates.status, "new"));

  for (const signal of pending) {
    const match = titleMatchesExisting(signal.rawText, signal.rawText, graphs);
    if (match) {
      await db.insert(painSignals).values({
        id: crypto.randomUUID(),
        painId: match.id,
        rawQuote: signal.rawText,
        sourceKind: "ingest",
        sourceLabel: "Discovery signal",
        sourceUrl: signal.sourceUrl,
        publishedAt: null,
      });
      await markSignals([signal.id], {
        status: "matched",
        matchedPainId: match.id,
        confidence: match.score * 100,
      });
      matched += 1;
      continue;
    }

    const near = openCandidates
      .map((candidate) => ({
        candidate,
        score: Math.max(
          overlapScore(signal.rawText, candidate.title),
          overlapScore(signal.rawText, candidate.problem),
        ),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (near && near.score >= 0.38) {
      await db.insert(painCandidateSignals).values({
        id: crypto.randomUUID(),
        candidateId: near.candidate.id,
        rawQuote: signal.rawText,
        sourceKind: "ingest",
        sourceLabel: "Discovery signal",
        sourceUrl: signal.sourceUrl,
        createdAt: new Date(),
      });
      await db
        .update(painCandidates)
        .set({
          evidenceCount: near.candidate.evidenceCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(painCandidates.id, near.candidate.id));
      near.candidate.evidenceCount += 1;
      await markSignals([signal.id], {
        status: "candidate",
        candidateId: near.candidate.id,
        confidence: near.score * 100,
      });
      clustered += 1;
      continue;
    }

    const id = await createCandidate({
      title: firstSentence(signal.rawText),
      problem: signal.rawText,
      persona: signal.persona,
      countries: signal.geography,
      origin: "ingest",
      sourceId: signal.sourceId,
      quote: signal.rawText,
      quoteLabel: "Discovery signal",
      quoteUrl: signal.sourceUrl,
      confidence: 45,
    });
    openCandidates.push({
      id,
      title: firstSentence(signal.rawText),
      problem: signal.rawText,
      evidenceCount: 1,
    } as (typeof openCandidates)[number]);
    await markSignals([signal.id], {
      status: "candidate",
      candidateId: id,
      confidence: 45,
    });
    created += 1;
  }

  const scores = await recalculatePainScores();
  const ranks = await snapshotBillboardRanks();
  const alerts = await runSavedPainAlerts();

  const enabled = await db
    .select({ id: discoverySources.id })
    .from(discoverySources)
    .where(eq(discoverySources.enabled, true));
  for (const source of enabled) {
    await markSourceIngested(source.id);
  }

  const summary = {
    pending: pending.length,
    matched,
    created,
    clustered,
    scores: scores.updated,
    ranks: ranks.rows,
    alerts,
    reason:
      "Score recalc, rank snapshots, and permitted-signal matching. No web crawl.",
  };
  await recordIngestRun({ ok: true, summary, startedAt });
  return summary;
}

export async function recordManualSignal(input: {
  sourceId: string;
  rawText: string;
  sourceUrl?: string | null;
  persona?: string | null;
  geography?: string | null;
}) {
  return addDiscoverySignal(input);
}
