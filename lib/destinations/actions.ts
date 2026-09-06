"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, painClusters, pains, productFits } from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/identity/audit";
import { painHref } from "@/lib/paingraph/path";
import { requireMarketingAgent } from "@/lib/session";
import { deleteDestination, upsertDestination } from "./store";
import { parseCountry, parseDestinationUrl } from "./url";

async function assertFit(painId: string, productId: string) {
  const [pain] = await db.select().from(pains).where(eq(pains.id, painId)).limit(1);
  if (!pain) return { error: "PainGraph not found." };
  const [fit] = await db
    .select()
    .from(productFits)
    .where(and(eq(productFits.painId, painId), eq(productFits.productId, productId)))
    .limit(1);
  if (!fit) return { error: "That product is not scored on this PainGraph." };
  return { pain };
}

async function revalidateDestinationPaths(painId: string) {
  revalidatePath("/marketing-agent");
  revalidatePath(`/marketing-agent/${painId}`);
  revalidatePath("/");
  const [row] = await db
    .select({
      slug: pains.slug,
      clusterSlug: painClusters.slug,
      categorySlug: categories.slug,
    })
    .from(pains)
    .innerJoin(painClusters, eq(pains.clusterId, painClusters.id))
    .innerJoin(categories, eq(painClusters.categoryId, categories.id))
    .where(eq(pains.id, painId))
    .limit(1);
  if (row) {
    revalidatePath(painHref(row.categorySlug, row.clusterSlug, row.slug));
  }
}

export async function saveDestination(formData: FormData) {
  const { session } = await requireMarketingAgent("/marketing-agent");
  const painId = String(formData.get("painId") || "");
  const productId = String(formData.get("productId") || "");
  const country = parseCountry(String(formData.get("country") || "*"));
  const parsed = parseDestinationUrl(String(formData.get("url") || ""));
  if ("error" in parsed) return;

  const fit = await assertFit(painId, productId);
  if ("error" in fit) return;

  await upsertDestination({ painId, productId, url: parsed.url, country });
  await writeAuditLog({
    actorUserId: session.user.id,
    action: "destination_saved",
    entityType: "pain",
    entityId: painId,
    metadata: { productId, country, host: new URL(parsed.url).host },
  });
  await revalidateDestinationPaths(painId);
}

export async function clearDestination(formData: FormData) {
  const { session } = await requireMarketingAgent("/marketing-agent");
  const painId = String(formData.get("painId") || "");
  const productId = String(formData.get("productId") || "");
  const country = parseCountry(String(formData.get("country") || "*"));
  const fit = await assertFit(painId, productId);
  if ("error" in fit) return;

  await deleteDestination(painId, productId, country);
  await writeAuditLog({
    actorUserId: session.user.id,
    action: "destination_cleared",
    entityType: "pain",
    entityId: painId,
    metadata: { productId, country },
  });
  await revalidateDestinationPaths(painId);
}
