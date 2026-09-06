"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { affiliateProgrammes } from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/identity/audit";
import { requireMarketingAgent } from "@/lib/session";
import { ensureIdentityTables } from "@/lib/identity/db";

export async function setProgrammeConfirmation(formData: FormData) {
  const { session } = await requireMarketingAgent("/marketing-agent");
  const programmeId = String(formData.get("programmeId") || "");
  const painId = String(formData.get("painId") || "");
  const next = String(formData.get("next") || "");
  const ownerStatus = next === "confirmed" ? "confirmed" : null;
  await ensureIdentityTables();
  const [row] = await db
    .select()
    .from(affiliateProgrammes)
    .where(eq(affiliateProgrammes.id, programmeId))
    .limit(1);
  if (!row) return;

  await db
    .update(affiliateProgrammes)
    .set({ ownerStatus, updatedAt: new Date() })
    .where(eq(affiliateProgrammes.id, programmeId));
  await writeAuditLog({
    actorUserId: session.user.id,
    action: ownerStatus ? "programme_confirmed" : "programme_unconfirmed",
    entityType: "programme",
    entityId: programmeId,
    metadata: { productId: row.productId, name: row.name },
  });
  revalidatePath("/marketing-agent");
  if (painId) revalidatePath(`/marketing-agent/${painId}`);
}
