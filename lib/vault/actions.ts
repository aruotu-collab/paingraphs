"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pains, productFits } from "@/lib/db/schema";
import { parseCountry, parseDestinationUrl } from "@/lib/destinations/url";
import { writeAuditLog } from "@/lib/identity/audit";
import { requireSession } from "@/lib/session";
import { deleteMemberDestination, upsertMemberDestination } from "./store";

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

export async function saveMemberDestination(formData: FormData) {
  const session = await requireSession("/home/vault");
  const painId = String(formData.get("painId") || "");
  const productId = String(formData.get("productId") || "");
  const country = parseCountry(String(formData.get("country") || "*"));
  const parsed = parseDestinationUrl(String(formData.get("url") || ""));
  if ("error" in parsed) return;
  const fit = await assertFit(painId, productId);
  if ("error" in fit) return;

  await upsertMemberDestination({
    userId: session.user.id,
    painId,
    productId,
    url: parsed.url,
    country,
  });
  await writeAuditLog({
    actorUserId: session.user.id,
    action: "member_destination_saved",
    entityType: "pain",
    entityId: painId,
    metadata: { productId, country, host: new URL(parsed.url).host },
  });
  revalidatePath("/home");
  revalidatePath("/home/vault");
  revalidatePath(`/home/vault/${painId}`);
}

export async function clearMemberDestination(formData: FormData) {
  const session = await requireSession("/home/vault");
  const painId = String(formData.get("painId") || "");
  const productId = String(formData.get("productId") || "");
  const country = parseCountry(String(formData.get("country") || "*"));
  const fit = await assertFit(painId, productId);
  if ("error" in fit) return;

  await deleteMemberDestination({
    userId: session.user.id,
    painId,
    productId,
    country,
  });
  await writeAuditLog({
    actorUserId: session.user.id,
    action: "member_destination_cleared",
    entityType: "pain",
    entityId: painId,
    metadata: { productId, country },
  });
  revalidatePath("/home");
  revalidatePath("/home/vault");
  revalidatePath(`/home/vault/${painId}`);
}
