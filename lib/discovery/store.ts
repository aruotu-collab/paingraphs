import { desc, eq, inArray } from "drizzle-orm";
import { getPlacement } from "@/lib/catalog/placements";
import { db } from "@/lib/db";
import {
  discoverySignals,
  discoverySources,
  ingestRuns,
  painCandidateSignals,
  painCandidates,
  painGraphScores,
  painSignals,
  pains,
} from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/identity/audit";
import { snapshotFromPain } from "@/lib/paingraph/scores";
import { extractSignal } from "./extract";
import { fingerprint, similarity, slugify } from "./text";
import { ensureDiscoveryTables } from "./db";

export const CANDIDATE_STATUSES = [
  "new",
  "watch",
  "needs_evidence",
  "approved",
  "rejected",
  "merged",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const SOURCE_TYPES = [
  "manual",
  "catalog",
  "forum",
  "review",
  "search",
  "licensed",
  "partner",
] as const;

export const ACCESS_METHODS = ["manual", "api", "feed", "crawler", "partner"] as const;
export const COMMERCIAL_USE = ["permitted", "unknown", "forbidden"] as const;

const SEED_SOURCES = [
  {
    id: "src-owner-manual",
    name: "Owner submissions",
    sourceType: "manual",
    accessMethod: "manual",
    commercialUse: "permitted",
    termsNotes: "Owner-pasted public quotes and first-party notes.",
    attribution: "Quoted with source label on the PainGraph.",
    retention: "Keep while the candidate or PainGraph is live.",
    rateLimit: "None",
    qualityScore: 80,
    trustScore: 90,
  },
  {
    id: "src-catalog-review",
    name: "Catalog review",
    sourceType: "catalog",
    accessMethod: "manual",
    commercialUse: "permitted",
    termsNotes: "Internal curated catalog. No live web crawl.",
    attribution: "PainGraphs catalog",
    retention: "Indefinite",
    rateLimit: "Daily score and rank jobs only.",
    qualityScore: 70,
    trustScore: 85,
  },
  {
    id: "src-hn-ask",
    name: "Hacker News Ask HN",
    sourceType: "forum",
    accessMethod: "api",
    commercialUse: "permitted",
    termsNotes:
      "Public Algolia HN Search API. Attribute Hacker News. No crawl of news.ycombinator.com.",
    attribution: "Hacker News",
    retention: "Keep quotes while the candidate or PainGraph is live.",
    rateLimit: "Once per 24 hours, 20 items.",
    feedUrl:
      "https://hn.algolia.com/api/v1/search_by_date?tags=ask_hn&hitsPerPage=20",
    qualityScore: 62,
    trustScore: 70,
  },
  {
    id: "src-se-softwarerecs",
    name: "Software Recommendations Stack Exchange",
    sourceType: "licensed",
    accessMethod: "api",
    commercialUse: "permitted",
    termsNotes:
      "Official Stack Exchange API. User content is CC BY-SA. Attribute the site and link the question.",
    attribution: "Software Recommendations Stack Exchange",
    retention: "Keep quotes while the candidate or PainGraph is live.",
    rateLimit: "Once per 24 hours, 20 items. Unauthenticated quota.",
    feedUrl:
      "https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&site=softwarerecs&pagesize=20&filter=withbody",
    qualityScore: 68,
    trustScore: 80,
  },
  {
    id: "src-cpsc-recalls",
    name: "U.S. CPSC product recalls",
    sourceType: "licensed",
    accessMethod: "feed",
    commercialUse: "permitted",
    termsNotes:
      "Official CPSC RSS. U.S. government work. Public safety notices, not a web crawl.",
    attribution: "U.S. Consumer Product Safety Commission",
    retention: "Keep while the candidate or PainGraph is live.",
    rateLimit: "Once per 24 hours, 25 items.",
    feedUrl: "https://www.cpsc.gov/Newsroom/CPSC-RSS-Feed/Recalls-RSS",
    qualityScore: 75,
    trustScore: 90,
  },
] as const;

export async function seedDiscoverySources() {
  await ensureDiscoveryTables();
  const now = new Date();
  for (const source of SEED_SOURCES) {
    await db
      .insert(discoverySources)
      .values({
        ...source,
        feedUrl: "feedUrl" in source ? source.feedUrl : null,
        frequencyHours: 24,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: discoverySources.id,
        set: {
          name: source.name,
          sourceType: source.sourceType,
          accessMethod: source.accessMethod,
          commercialUse: source.commercialUse,
          termsNotes: source.termsNotes,
          attribution: source.attribution,
          retention: source.retention,
          rateLimit: source.rateLimit,
          ...("feedUrl" in source ? { feedUrl: source.feedUrl } : {}),
        },
      });
  }
}

export async function listDiscoverySources() {
  await seedDiscoverySources();
  return db.select().from(discoverySources).orderBy(discoverySources.name);
}

export async function getDiscoverySource(id: string) {
  await ensureDiscoveryTables();
  const [row] = await db
    .select()
    .from(discoverySources)
    .where(eq(discoverySources.id, id))
    .limit(1);
  return row ?? null;
}

export async function upsertDiscoverySource(input: {
  id?: string;
  name: string;
  sourceType: string;
  accessMethod: string;
  commercialUse: string;
  termsNotes?: string | null;
  attribution?: string | null;
  retention?: string | null;
  rateLimit?: string | null;
  feedUrl?: string | null;
  enabled: boolean;
}) {
  await ensureDiscoveryTables();
  const now = new Date();
  const id = input.id || `src-${slugify(input.name)}-${crypto.randomUUID().slice(0, 8)}`;
  const existing = await getDiscoverySource(id);
  if (existing) {
    await db
      .update(discoverySources)
      .set({
        name: input.name,
        sourceType: input.sourceType,
        accessMethod: input.accessMethod,
        commercialUse: input.commercialUse,
        termsNotes: input.termsNotes ?? null,
        attribution: input.attribution ?? null,
        retention: input.retention ?? null,
        rateLimit: input.rateLimit ?? null,
        feedUrl: input.feedUrl ?? null,
        enabled: input.enabled,
        updatedAt: now,
      })
      .where(eq(discoverySources.id, id));
    return id;
  }
  await db.insert(discoverySources).values({
    id,
    name: input.name,
    sourceType: input.sourceType,
    accessMethod: input.accessMethod,
    commercialUse: input.commercialUse,
    termsNotes: input.termsNotes ?? null,
    attribution: input.attribution ?? null,
    retention: input.retention ?? null,
    rateLimit: input.rateLimit ?? null,
    feedUrl: input.feedUrl ?? null,
    frequencyHours: 24,
    enabled: input.enabled,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function markSourceIngested(id: string) {
  await ensureDiscoveryTables();
  await db
    .update(discoverySources)
    .set({ lastIngestedAt: new Date(), updatedAt: new Date() })
    .where(eq(discoverySources.id, id));
}

export async function addDiscoverySignal(input: {
  sourceId: string;
  rawText: string;
  sourceUrl?: string | null;
  persona?: string | null;
  geography?: string | null;
}) {
  await seedDiscoverySources();
  const extracted = extractSignal({
    rawText: input.rawText,
    persona: input.persona,
    geography: input.geography,
    sourceId: input.sourceId,
    lenient: input.sourceId === "src-owner-manual",
  });
  const id = crypto.randomUUID();
  await db.insert(discoverySignals).values({
    id,
    sourceId: input.sourceId,
    rawText: input.rawText,
    sourceUrl: input.sourceUrl ?? null,
    persona: extracted.persona ?? input.persona ?? null,
    geography: extracted.geography ?? input.geography ?? null,
    status: "new",
    fingerprint: fingerprint(input.rawText) || null,
    extractedJson: JSON.stringify(extracted),
    extractedAt: new Date(),
    createdAt: new Date(),
  });
  return id;
}

export async function findSignalByFingerprint(value: string, exceptId?: string) {
  if (!value) return null;
  const rows = await db
    .select()
    .from(discoverySignals)
    .where(eq(discoverySignals.fingerprint, value));
  return (
    rows.find((row) => row.id !== exceptId && row.status !== "new") ?? null
  );
}

export async function listDiscoverySignals(limit = 80) {
  await ensureDiscoveryTables();
  return db
    .select()
    .from(discoverySignals)
    .orderBy(desc(discoverySignals.createdAt))
    .limit(limit);
}

export async function listPendingSignals() {
  await ensureDiscoveryTables();
  return db
    .select()
    .from(discoverySignals)
    .where(eq(discoverySignals.status, "new"));
}

export async function listCandidates(status?: CandidateStatus) {
  await ensureDiscoveryTables();
  const rows = status
    ? await db
        .select()
        .from(painCandidates)
        .where(eq(painCandidates.status, status))
        .orderBy(desc(painCandidates.createdAt))
    : await db.select().from(painCandidates).orderBy(desc(painCandidates.createdAt));
  return rows;
}

export async function candidateCounts() {
  await ensureDiscoveryTables();
  const rows = await db.select({ status: painCandidates.status }).from(painCandidates);
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }
  return {
    all: rows.length,
    queue: rows.filter((row) =>
      ["new", "watch", "needs_evidence"].includes(row.status),
    ).length,
    counts,
  };
}

export async function getCandidate(id: string) {
  await ensureDiscoveryTables();
  const [row] = await db
    .select()
    .from(painCandidates)
    .where(eq(painCandidates.id, id))
    .limit(1);
  if (!row) return null;
  const signals = await db
    .select()
    .from(painCandidateSignals)
    .where(eq(painCandidateSignals.candidateId, id));
  return { ...row, signals };
}

export async function createCandidate(input: {
  title: string;
  problem: string;
  persona?: string | null;
  categorySlug?: string | null;
  clusterSlug?: string | null;
  countries?: string | null;
  productsDetected?: string | null;
  sourceTypes?: string | null;
  confidence?: number | null;
  buyingIntent?: number | null;
  severity?: number | null;
  founderOpportunity?: number | null;
  affiliateOpportunity?: number | null;
  relatedPainId?: string | null;
  origin?: string;
  sourceId?: string | null;
  quote?: string | null;
  quoteLabel?: string | null;
  quoteUrl?: string | null;
  workaround?: string | null;
  triggerText?: string | null;
  jobToBeDone?: string | null;
  extractionJson?: string | null;
  actorUserId?: string | null;
}) {
  await seedDiscoverySources();
  const now = new Date();
  const id = crypto.randomUUID();
  const quote = input.quote?.trim();
  await db.insert(painCandidates).values({
    id,
    title: input.title,
    problem: input.problem,
    persona: input.persona ?? null,
    categorySlug: input.categorySlug ?? null,
    clusterSlug: input.clusterSlug ?? null,
    countries: input.countries ?? null,
    productsDetected: input.productsDetected ?? null,
    evidenceCount: quote ? 1 : 0,
    sourceTypes: input.sourceTypes ?? input.origin ?? "manual",
    confidence: input.confidence ?? null,
    buyingIntent: input.buyingIntent ?? null,
    severity: input.severity ?? null,
    founderOpportunity: input.founderOpportunity ?? null,
    affiliateOpportunity: input.affiliateOpportunity ?? null,
    relatedPainId: input.relatedPainId ?? null,
    status: "new",
    origin: input.origin ?? "manual",
    sourceId: input.sourceId ?? "src-owner-manual",
    workaround: input.workaround ?? null,
    triggerText: input.triggerText ?? null,
    jobToBeDone: input.jobToBeDone ?? null,
    extractionJson: input.extractionJson ?? null,
    createdAt: now,
    updatedAt: now,
  });
  if (quote) {
    await db.insert(painCandidateSignals).values({
      id: crypto.randomUUID(),
      candidateId: id,
      rawQuote: quote,
      sourceKind: input.origin === "ingest" ? "ingest" : "manual",
      sourceLabel: input.quoteLabel || "Owner note",
      sourceUrl: input.quoteUrl ?? null,
      createdAt: now,
    });
  }
  await writeAuditLog({
    actorUserId: input.actorUserId,
    action: "candidate_created",
    entityType: "pain_candidate",
    entityId: id,
    metadata: { title: input.title, origin: input.origin ?? "manual" },
  });
  return id;
}

export async function setCandidateStatus(input: {
  id: string;
  status: CandidateStatus;
  reviewNote?: string | null;
  relatedPainId?: string | null;
  painId?: string | null;
  actorUserId?: string | null;
}) {
  await ensureDiscoveryTables();
  if (!CANDIDATE_STATUSES.includes(input.status)) {
    return { error: "Invalid candidate status." };
  }
  const [row] = await db
    .select()
    .from(painCandidates)
    .where(eq(painCandidates.id, input.id))
    .limit(1);
  if (!row) return { error: "Candidate not found." };
  await db
    .update(painCandidates)
    .set({
      status: input.status,
      reviewNote: input.reviewNote ?? row.reviewNote,
      relatedPainId: input.relatedPainId ?? row.relatedPainId,
      painId: input.painId ?? row.painId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(painCandidates.id, input.id));
  await writeAuditLog({
    actorUserId: input.actorUserId,
    action: `candidate_${input.status}`,
    entityType: "pain_candidate",
    entityId: input.id,
    metadata: { from: row.status, to: input.status },
  });
  return { ok: true };
}

export async function uniquePainSlug(clusterId: string, title: string) {
  const base = slugify(title);
  const existing = await db
    .select({ slug: pains.slug })
    .from(pains)
    .where(eq(pains.clusterId, clusterId));
  const taken = new Set(existing.map((row) => row.slug));
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export async function attachSignalsToPain(candidateId: string, painId: string) {
  const signals = await db
    .select()
    .from(painCandidateSignals)
    .where(eq(painCandidateSignals.candidateId, candidateId));
  for (const signal of signals) {
    await db.insert(painSignals).values({
      id: crypto.randomUUID(),
      painId,
      rawQuote: signal.rawQuote,
      sourceKind: signal.sourceKind,
      sourceLabel: signal.sourceLabel,
      sourceUrl: signal.sourceUrl,
      publishedAt: null,
    });
  }
  return signals.length;
}

export async function materializeCandidatePain(input: {
  candidateId: string;
  clusterId: string;
  publish?: boolean;
  reviewNote?: string | null;
  actorUserId?: string | null;
}) {
  const candidate = await getCandidate(input.candidateId);
  if (!candidate) return { error: "Candidate not found." };
  if (candidate.status === "approved" && candidate.painId) {
    return { ok: true as const, painId: candidate.painId, already: true };
  }
  const placement = await getPlacement(input.clusterId);
  if (!placement) return { error: "Cluster not found." };
  const { category, cluster } = placement;
  const slug = await uniquePainSlug(cluster.id, candidate.title);
  const now = new Date();
  const painId = `cand-${candidate.id.slice(0, 12)}`;
  const severity = candidate.severity ?? 60;
  const intent = candidate.buyingIntent ?? 55;
  const founder = candidate.founderOpportunity ?? 60;
  const affiliate = candidate.affiliateOpportunity ?? 40;
  await db.insert(pains).values({
    id: painId,
    clusterId: cluster.id,
    slug,
    title: candidate.title,
    h1: candidate.title,
    problem: candidate.problem,
    analysis: candidate.problem,
    whyNow: null,
    strategy: "What usually helps is still being mapped from evidence.",
    stage: 1,
    painScore: severity,
    intentScore: intent,
    competitionScore: 50,
    productGap: founder,
    affiliateScore: affiliate,
    organicScore: 40,
    opportunity: Math.round((severity + intent + founder) / 3),
    trend: 50,
    sensitive: false,
    status: input.publish ? "published" : "draft",
    updatedAt: now,
  });
  await db.insert(painGraphScores).values(
    snapshotFromPain(
      {
        id: painId,
        trend: 50,
        intentScore: intent,
        organicScore: 40,
        productGap: founder,
      },
      candidate.evidenceCount,
    ),
  );
  await attachSignalsToPain(candidate.id, painId);
  await setCandidateStatus({
    id: candidate.id,
    status: "approved",
    painId,
    relatedPainId: candidate.relatedPainId,
    reviewNote: input.reviewNote,
    actorUserId: input.actorUserId,
  });
  return {
    ok: true as const,
    painId,
    already: false,
    category,
    cluster,
  };
}

export async function markSignals(
  ids: string[],
  patch: {
    status: string;
    matchedPainId?: string | null;
    candidateId?: string | null;
    confidence?: number | null;
  },
) {
  if (ids.length === 0) return;
  await db
    .update(discoverySignals)
    .set(patch)
    .where(inArray(discoverySignals.id, ids));
}

export async function latestIngestRun() {
  await ensureDiscoveryTables();
  const [row] = await db
    .select()
    .from(ingestRuns)
    .orderBy(desc(ingestRuns.startedAt))
    .limit(1);
  return row ?? null;
}

export async function recordIngestRun(input: {
  ok: boolean;
  summary: Record<string, unknown>;
  startedAt: Date;
}) {
  await ensureDiscoveryTables();
  await db.insert(ingestRuns).values({
    id: crypto.randomUUID(),
    ok: input.ok,
    summary: JSON.stringify(input.summary),
    startedAt: input.startedAt,
    finishedAt: new Date(),
  });
}

export function matchExistingPain(
  extracted: {
    title: string;
    painStatement: string;
    clusterSlug?: string | null;
    productsMentioned?: string | null;
  },
  graphs: {
    id: string;
    title: string;
    summary: string;
    category: { slug: string };
    subcategory: { slug: string };
  }[],
) {
  let best: { id: string; score: number } | null = null;
  const query = `${extracted.title} ${extracted.painStatement} ${extracted.productsMentioned ?? ""}`;
  for (const graph of graphs) {
    let score = Math.max(
      similarity(extracted.title, graph.title),
      similarity(extracted.painStatement, graph.summary),
      similarity(query, `${graph.title} ${graph.summary}`),
    );
    if (extracted.clusterSlug && extracted.clusterSlug === graph.subcategory.slug) {
      score += 0.08;
    }
    if (!best || score > best.score) best = { id: graph.id, score };
  }
  if (!best) return { match: null, related: null };
  if (best.score >= 0.46) return { match: best, related: null };
  if (best.score >= 0.24) return { match: null, related: best };
  return { match: null, related: null };
}

export function clusterScore(
  extracted: {
    title: string;
    painStatement: string;
    productsMentioned?: string | null;
    clusterSlug?: string | null;
  },
  candidate: {
    title: string;
    problem: string;
    productsDetected?: string | null;
    clusterSlug?: string | null;
  },
) {
  let score = Math.max(
    similarity(extracted.title, candidate.title),
    similarity(extracted.painStatement, candidate.problem),
    similarity(
      `${extracted.title} ${extracted.painStatement} ${extracted.productsMentioned ?? ""}`,
      `${candidate.title} ${candidate.problem} ${candidate.productsDetected ?? ""}`,
    ),
  );
  if (extracted.clusterSlug && extracted.clusterSlug === candidate.clusterSlug) {
    score += 0.08;
  }
  if (isRecallTitle(extracted.title) && isRecallTitle(candidate.title)) {
    const left = recallBrand(extracted.title);
    const right = recallBrand(candidate.title);
    if (left && right && similarity(left, right) < 0.45) return 0;
  }
  return score;
}

function isRecallTitle(value: string) {
  return /\brecalls?\b/i.test(value);
}

function recallBrand(value: string) {
  return value.split(/\brecalls?\b/i)[0]?.trim() || value;
}

