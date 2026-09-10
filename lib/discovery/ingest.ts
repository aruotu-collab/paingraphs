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
import { notifyPriceChange } from "@/lib/alerts/run";
import { snapshotCatalogPrices } from "@/lib/prices/store";
import { extractSignal, parseExtraction } from "./extract";
import { ingestLicensedFeeds } from "./feed";
import { ensureDiscoveryTables } from "./db";
import {
  addDiscoverySignal,
  clusterScore,
  createCandidate,
  findSignalByFingerprint,
  listDiscoverySources,
  listPendingSignals,
  markSignals,
  markSourceIngested,
  matchExistingPain,
  recordIngestRun,
  seedDiscoverySources,
} from "./store";
import { fingerprint } from "./text";

const CLUSTER_THRESHOLD = 0.4;

export async function runDiscoveryIngest() {
  const startedAt = new Date();
  await ensureDiscoveryTables();
  await seedDiscoverySources();

  const sources = await listDiscoverySources();
  const feeds = await ingestLicensedFeeds(sources);
  const prices = await snapshotCatalogPrices();
  for (const change of prices.changes) {
    await notifyPriceChange({
      productId: change.productId,
      productName: change.name,
      previous: change.previous,
      display: change.display,
    });
  }
  const graphs = await listPainGraphs();
  const pending = await listPendingSignals();
  let matched = 0;
  let created = 0;
  let clustered = 0;
  let discarded = 0;
  let duplicates = 0;
  const openCandidates = await db
    .select()
    .from(painCandidates)
    .where(eq(painCandidates.status, "new"));

  for (const signal of pending) {
    const extracted =
      parseExtraction(signal.extractedJson) ??
      extractSignal({
        rawText: signal.rawText,
        persona: signal.persona,
        geography: signal.geography,
        lenient: signal.sourceId === "src-owner-manual",
      });
    const print = signal.fingerprint || fingerprint(signal.rawText);
    if (extracted.noise) {
      await markSignals([signal.id], {
        status: "discarded",
        confidence: extracted.confidence,
      });
      discarded += 1;
      continue;
    }
    if (print) {
      const prior = await findSignalByFingerprint(print, signal.id);
      if (prior) {
        await markSignals([signal.id], {
          status: "duplicate",
          matchedPainId: prior.matchedPainId,
          candidateId: prior.candidateId,
          confidence: extracted.confidence,
        });
        duplicates += 1;
        continue;
      }
    }

    const { match, related } = matchExistingPain(extracted, graphs);
    if (match) {
      await db.insert(painSignals).values({
        id: crypto.randomUUID(),
        painId: match.id,
        rawQuote: extracted.painStatement || signal.rawText,
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
        score: clusterScore(extracted, candidate),
      }))
      .sort((a, b) => b.score - a.score)[0];

    if (near && near.score >= CLUSTER_THRESHOLD) {
      await db.insert(painCandidateSignals).values({
        id: crypto.randomUUID(),
        candidateId: near.candidate.id,
        rawQuote: extracted.painStatement || signal.rawText,
        sourceKind: "ingest",
        sourceLabel: "Discovery signal",
        sourceUrl: signal.sourceUrl,
        createdAt: new Date(),
      });
      const products = [
        ...new Set(
          [near.candidate.productsDetected, extracted.productsMentioned]
            .filter(Boolean)
            .join(", ")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ].join(", ");
      await db
        .update(painCandidates)
        .set({
          evidenceCount: near.candidate.evidenceCount + 1,
          productsDetected: products || near.candidate.productsDetected,
          relatedPainId: near.candidate.relatedPainId ?? related?.id ?? null,
          confidence: Math.max(near.candidate.confidence ?? 0, extracted.confidence),
          updatedAt: new Date(),
        })
        .where(eq(painCandidates.id, near.candidate.id));
      near.candidate.evidenceCount += 1;
      near.candidate.productsDetected = products || near.candidate.productsDetected;
      await markSignals([signal.id], {
        status: "candidate",
        candidateId: near.candidate.id,
        confidence: near.score * 100,
      });
      clustered += 1;
      continue;
    }

    const id = await createCandidate({
      title: extracted.title,
      problem: extracted.painStatement || signal.rawText,
      persona: extracted.persona,
      categorySlug: extracted.categorySlug,
      clusterSlug: extracted.clusterSlug,
      countries: extracted.geography,
      productsDetected: extracted.productsMentioned,
      confidence: extracted.confidence,
      buyingIntent: extracted.buyingIntent,
      severity: extracted.severity,
      founderOpportunity: extracted.founderOpportunity,
      affiliateOpportunity: extracted.affiliateOpportunity,
      relatedPainId: related?.id ?? null,
      origin: "ingest",
      sourceId: signal.sourceId,
      quote: extracted.painStatement || signal.rawText,
      quoteLabel: "Discovery signal",
      quoteUrl: signal.sourceUrl,
      workaround: extracted.workaround,
      triggerText: extracted.trigger,
      jobToBeDone: extracted.jobToBeDone,
      extractionJson: JSON.stringify(extracted),
    });
    openCandidates.push({
      id,
      title: extracted.title,
      problem: extracted.painStatement || signal.rawText,
      productsDetected: extracted.productsMentioned,
      clusterSlug: extracted.clusterSlug,
      evidenceCount: 1,
    } as (typeof openCandidates)[number]);
    await markSignals([signal.id], {
      status: "candidate",
      candidateId: id,
      confidence: extracted.confidence,
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
    discarded,
    duplicates,
    extracted: pending.length,
    feeds,
    prices,
    scores: scores.updated,
    ranks: ranks.rows,
    alerts,
    schedule: "daily 06:00 UTC",
    reason:
      "Licensed feeds, structured extraction, clustering, score recalc, and rank snapshots. No web crawl. Nothing auto-publishes.",
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
