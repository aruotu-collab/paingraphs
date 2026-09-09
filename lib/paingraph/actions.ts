"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { alertIfSavedOpportunity } from "@/lib/alerts/run";
import { db } from "@/lib/db";
import { watchlists } from "@/lib/db/schema";
import { entitlements } from "@/lib/identity/profile";
import { getAccess, getSession, requireSession } from "@/lib/session";

export async function toggleSavedPain(painId: string) {
  const session = await requireSession("/home");
  const existing = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, session.user.id));
  const found = existing.find((row) => row.painId === painId);
  if (found) {
    await db.delete(watchlists).where(eq(watchlists.id, found.id));
  } else {
    const { profile, capabilities } = await getAccess(session.user);
    const access = entitlements(
      profile,
      capabilities.admin || capabilities.marketingAgent,
    );
    if (access.saveLimit != null && existing.length >= access.saveLimit) {
      return {
        error: `Free accounts can follow ${access.saveLimit} pains. Upgrade to Pro for the full list.`,
      };
    }
    await db.insert(watchlists).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      painId,
    });
    await alertIfSavedOpportunity(session.user.id, painId);
  }
  revalidatePath("/home");
  revalidatePath("/home/alerts");
  return { ok: true };
}

export async function listSavedPainIds() {
  const session = await getSession();
  if (!session) return [];
  const rows = await db
    .select({ painId: watchlists.painId })
    .from(watchlists)
    .where(eq(watchlists.userId, session.user.id));
  return rows.map((row) => row.painId);
}
