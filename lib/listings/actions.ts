"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, painClusters, pains, productFits } from "@/lib/db/schema";
import { parseCountry, parseDestinationUrl } from "@/lib/destinations/url";
import { writeAuditLog } from "@/lib/identity/audit";
import { painHref } from "@/lib/paingraph/path";
import { requireMarketingAgent } from "@/lib/session";
import { deleteListing, insertListing } from "./store";
import { parseListingName } from "./url";

async function assertFit(painId: string, productId: string) {
  const [pain] = await db.select().from(pains).where(eq(pains.id, painId)).limit(1);
  if (!pain) return { error: "PainGraph not found." };
  const [fit] = await db
    .select()
    .from(productFits)
    .where(and(eq(productFits.painId, painId), eq(productFits.productId, productId)))
    .limit(1);
  if (!fit) return { error: "That kind is not scored on this PainGraph." };
  return { pain };
}

async function revalidateListingPaths(painId: string) {
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

export async function saveListing(formData: FormData) {
  const { session } = await requireMarketingAgent("/marketing-agent");
  const painId = String(formData.get("painId") || "");
  const productId = String(formData.get("productId") || "");
  const country = parseCountry(String(formData.get("country") || "*"));
  const named = parseListingName(String(formData.get("name") || ""));
  const parsed = parseDestinationUrl(String(formData.get("url") || ""));
  if ("error" in named || "error" in parsed) return;

  const fit = await assertFit(painId, productId);
  if ("error" in fit) return;

  await insertListing({
    painId,
    productId,
    name: named.name,
    url: parsed.url,
    country,
  });
  await writeAuditLog({
    actorUserId: session.user.id,
    action: "listing_saved",
    entityType: "pain",
    entityId: painId,
    metadata: {
      productId,
      country,
      name: named.name,
      host: new URL(parsed.url).host,
    },
  });
  await revalidateListingPaths(painId);
}

export async function clearListing(formData: FormData) {
  const { session } = await requireMarketingAgent("/marketing-agent");
  const painId = String(formData.get("painId") || "");
  const listingId = String(formData.get("listingId") || "");
  const productId = String(formData.get("productId") || "");
  const fit = await assertFit(painId, productId);
  if ("error" in fit || !listingId) return;

  await deleteListing(listingId, painId);
  await writeAuditLog({
    actorUserId: session.user.id,
    action: "listing_cleared",
    entityType: "pain",
    entityId: painId,
    metadata: { productId, listingId },
  });
  await revalidateListingPaths(painId);
}
