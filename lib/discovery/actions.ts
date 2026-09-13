"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolvePlacement } from "@/lib/catalog/placements";
import { requireAdmin } from "@/lib/session";
import {
  ACCESS_METHODS,
  CANDIDATE_STATUSES,
  COMMERCIAL_USE,
  SOURCE_TYPES,
  addDiscoverySignal,
  attachSignalsToPain,
  createCandidate,
  getCandidate,
  materializeCandidatePain,
  setCandidateStatus,
  upsertDiscoverySource,
} from "./store";
import { publicFeedUrl } from "./feed";
import { clip, optionalScore, optionalText } from "./text";

function revalidateOwner() {
  revalidatePath("/admin");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/add-candidate");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/sources");
  revalidatePath("/admin/pains");
  revalidatePath("/admin/rankings");
  revalidatePath("/top-pains");
  revalidatePath("/");
}

export async function submitCandidate(formData: FormData) {
  const { session } = await requireAdmin("/admin/add-candidate");
  const title = clip(String(formData.get("title") ?? ""), 160);
  const problem = clip(String(formData.get("problem") ?? ""), 4000);
  if (title.length < 4 || problem.length < 12) return;
  const placement = await resolvePlacement({
    clusterId: optionalText(formData.get("clusterId")),
    categoryName: optionalText(formData.get("newCategory"), 80),
    clusterName: optionalText(formData.get("newCluster"), 80),
  });
  if ("error" in placement) return;
  await createCandidate({
    title,
    problem,
    persona: optionalText(formData.get("persona")),
    categorySlug:
      placement.category.slug ?? optionalText(formData.get("categorySlug")),
    clusterSlug:
      placement.cluster.slug ?? optionalText(formData.get("clusterSlug")),
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
  redirect("/admin/candidates");
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
  const candidate = await getCandidate(id);
  if (!candidate) return;

  const placement = await resolvePlacement({
    clusterId: optionalText(formData.get("clusterId")),
    categoryName: optionalText(formData.get("newCategory"), 80),
    clusterName: optionalText(formData.get("newCluster"), 80),
    fallbackClusterSlug: candidate.clusterSlug,
  });
  if ("error" in placement) return;
  const result = await materializeCandidatePain({
    candidateId: id,
    clusterId: placement.cluster.id,
    publish: String(formData.get("publish") ?? "") === "1",
    reviewNote: optionalText(formData.get("reviewNote"), 800),
    actorUserId: session.user.id,
  });
  if ("error" in result) return;
  revalidateOwner();
  revalidatePath(`/${placement.category.slug}`);
  revalidatePath(`/${placement.category.slug}/${placement.cluster.slug}`);
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
