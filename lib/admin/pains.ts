"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pains } from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/identity/audit";
import { requireAdmin } from "@/lib/session";

const STATUSES = ["published", "draft"] as const;
type PainStatus = (typeof STATUSES)[number];

export async function setPainPublication(painId: string, status: PainStatus) {
  const { session } = await requireAdmin("/admin");
  if (!painId || !STATUSES.includes(status)) {
    return { error: "Invalid publication update." };
  }

  const [row] = await db.select().from(pains).where(eq(pains.id, painId)).limit(1);
  if (!row) return { error: "PainGraph not found." };
  if (row.status === status) return { ok: true };

  await db
    .update(pains)
    .set({ status, updatedAt: new Date() })
    .where(eq(pains.id, painId));

  await writeAuditLog({
    actorUserId: session.user.id,
    action: status === "published" ? "pain_published" : "pain_unpublished",
    entityType: "pain",
    entityId: painId,
    metadata: { from: row.status, to: status, title: row.title },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/top-pains");
  return { ok: true };
}
