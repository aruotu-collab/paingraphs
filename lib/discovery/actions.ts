"use server";

import { revalidatePath } from "next/cache";
import { CATEGORIES, CLUSTERS } from "@/lib/catalog/data";
import { db } from "@/lib/db";
import { painGraphScores, pains } from "@/lib/db/schema";
import { snapshotFromPain } from "@/lib/paingraph/scores";
import { requireAdmin } from "@/lib/session";
import {
  ACCESS_METHODS,
  CANDIDATE_STATUSES,
  COMMERCIAL_USE,
  SOURCE_TYPES,
  addDiscoverySignal,
  attachSignalsToPain,
  clusterOptions,
  createCandidate,
  getCandidate,
  setCandidateStatus,
  uniquePainSlug,
  upsertDiscoverySource,
} from "./store";
import { publicFeedUrl } from "./feed";
import { clip, optionalScore, optionalText } from "./text";

function revalidateOwner() {
  revalidatePath("/admin");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/sources");
  revalidatePath("/admin/pains");
  revalidatePath("/admin/rankings");
  revalidatePath("/top-pains");
  revalidatePath("/");
}

export async function submitCandidate(formData: FormData) {
  const { session } = await requireAdmin("/admin/candidates");
  const title = clip(String(formData.get("title") ?? ""), 160);
  const problem = clip(String(formData.get("problem") ?? ""), 4000);
  if (title.length < 4 || problem.length < 12) return;
  const cluster = clusterOptions().find(
    (item) => item.id === String(formData.get("clusterId") ?? ""),
  );
  await createCandidate({
    title,
    problem,
    persona: optionalText(formData.get("persona")),
    categorySlug: cluster?.categorySlug ?? optionalText(formData.get("categorySlug")),
    clusterSlug: cluster?.slug ?? optionalText(formData.get("clusterSlug")),
    countries: optionalText(formData.get("countries")),
    productsDetected: optionalText(formData.get("productsDetected")),
    confidence: optionalScore(formData.get("confidence")),
    buyingIntent: optionalScore(formData.get("buyingIntent")),
    severity: optionalScore(formData.get("severity")),
    founderOpportunity: optionalScore(formData.get("founderOpportunity")),
    affiliateOpportunity: optionalScore(formData.get("affiliateOpportunity")),
    origin: "manual",
    sourceId: "src-owner-manual",
    quote: optionalText(formData.get("quote"), 2000),
    quoteLabel: optionalText(formData.get("quoteLabel")) ?? "Owner note",
    quoteUrl: optionalText(formData.get("quoteUrl"), 400),
    actorUserId: session.user.id,
  });
  revalidateOwner();
}

export async function reviewCandidate(formData: FormData) {
  const { session } = await requireAdmin("/admin/candidates");
  const id = String(formData.get("candidateId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!CANDIDATE_STATUSES.includes(status as (typeof CANDIDATE_STATUSES)[number])) {
    return;
  }
  const relatedPainId = optionalText(formData.get("relatedPainId"));
  await setCandidateStatus({
    id,
    status: status as (typeof CANDIDATE_STATUSES)[number],
    reviewNote: optionalText(formData.get("reviewNote"), 800),
    relatedPainId,
    actorUserId: session.user.id,
  });
  revalidateOwner();
}

export async function mergeCandidate(formData: FormData) {
  const { session } = await requireAdmin("/admin/candidates");
  const id = String(formData.get("candidateId") ?? "");
  const painId = String(formData.get("painId") ?? "");
  const candidate = await getCandidate(id);
  if (!candidate || !painId) return;
  await attachSignalsToPain(id, painId);
  await setCandidateStatus({
    id,
    status: "merged",
    relatedPainId: painId,
    painId,
    reviewNote: optionalText(formData.get("reviewNote"), 800),
    actorUserId: session.user.id,
  });
  revalidateOwner();
}

export async function approveCandidate(formData: FormData) {
  const { session } = await requireAdmin("/admin/candidates");
  const id = String(formData.get("candidateId") ?? "");
  const publish = String(formData.get("publish") ?? "") === "1";
  const candidate = await getCandidate(id);
  if (!candidate) return;
  if (candidate.status === "approved" && candidate.painId) return;

  const clusterId = String(formData.get("clusterId") ?? "");
  const cluster =
    CLUSTERS.find((item) => item.id === clusterId) ??
    CLUSTERS.find((item) => item.slug === candidate.clusterSlug) ??
    CLUSTERS[0];
  if (!cluster) return;
  const category = CATEGORIES.find((item) => item.id === cluster.categoryId);
  const slug = await uniquePainSlug(cluster.id, candidate.title);
  const now = new Date();
  const painId = `cand-${id.slice(0, 12)}`;
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
    status: publish ? "published" : "draft",
    updatedAt: now,
  });
  const snapshot = snapshotFromPain({
    id: painId,
    trend: 50,
    intentScore: intent,
    organicScore: 40,
    productGap: founder,
  }, candidate.evidenceCount);
  await db.insert(painGraphScores).values(snapshot);
  await attachSignalsToPain(id, painId);
  await setCandidateStatus({
    id,
    status: "approved",
    painId,
    relatedPainId: candidate.relatedPainId,
    reviewNote: optionalText(formData.get("reviewNote"), 800),
    actorUserId: session.user.id,
  });
  revalidateOwner();
  if (category) {
    revalidatePath(`/${category.slug}`);
  }
}

export async function saveDiscoverySource(formData: FormData) {
  await requireAdmin("/admin/sources");
  const name = clip(String(formData.get("name") ?? ""), 120);
  if (name.length < 2) return;
  const sourceType = String(formData.get("sourceType") ?? "manual");
  const accessMethod = String(formData.get("accessMethod") ?? "manual");
  const commercialUse = String(formData.get("commercialUse") ?? "unknown");
  if (!SOURCE_TYPES.includes(sourceType as (typeof SOURCE_TYPES)[number])) return;
  if (!ACCESS_METHODS.includes(accessMethod as (typeof ACCESS_METHODS)[number])) {
    return;
  }
  if (!COMMERCIAL_USE.includes(commercialUse as (typeof COMMERCIAL_USE)[number])) {
    return;
  }
  if (commercialUse === "forbidden") return;
  const rawFeed = optionalText(formData.get("feedUrl"), 400);
  const feedUrl = rawFeed ? publicFeedUrl(rawFeed) : null;
  if (rawFeed && !feedUrl) return;
  await upsertDiscoverySource({
    id: optionalText(formData.get("sourceId")) ?? undefined,
    name,
    sourceType,
    accessMethod,
    commercialUse,
    termsNotes: optionalText(formData.get("termsNotes"), 2000),
    attribution: optionalText(formData.get("attribution"), 400),
    retention: optionalText(formData.get("retention"), 400),
    rateLimit: optionalText(formData.get("rateLimit"), 200),
    feedUrl: accessMethod === "crawler" ? null : feedUrl,
    enabled: formData.get("enabled") === "1",
  });
  revalidatePath("/admin/sources");
  revalidatePath("/admin/health");
}

export async function submitDiscoverySignal(formData: FormData) {
  await requireAdmin("/admin/sources");
  const sourceId = String(formData.get("sourceId") ?? "");
  const rawText = clip(String(formData.get("rawText") ?? ""), 4000);
  if (!sourceId || rawText.length < 12) return;
  await addDiscoverySignal({
    sourceId,
    rawText,
    sourceUrl: optionalText(formData.get("sourceUrl"), 400),
    persona: optionalText(formData.get("persona")),
    geography: optionalText(formData.get("geography"), 80),
  });
  revalidatePath("/admin/sources");
  revalidatePath("/admin/candidates");
}
