"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { alertIfSavedOpportunity } from "@/lib/alerts/run";
import { db } from "@/lib/db";
import { pains, watchlists } from "@/lib/db/schema";
import { entitlements } from "@/lib/identity/profile";
import type { PainProfile } from "@/lib/paingraph/match";
import { getAccess, getSession } from "@/lib/session";
import { upsertSavedProfile } from "./store";

export async function keepMatch(
  painId: string,
  slugs: string[],
  profile: PainProfile,
  href?: string,
) {
  const saved = await savePainProfile(painId, slugs, profile, href);
  if (saved && "error" in saved && saved.error) return saved;
  const session = await getSession();
  if (!session) return { error: "Sign in to keep this match." };
  const existing = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, session.user.id));
  if (!existing.some((row) => row.painId === painId)) {
    const { profile: userProfile, capabilities } = await getAccess(session.user);
    const access = entitlements(
      userProfile,
      capabilities.admin || capabilities.marketingAgent,
    );
    if (access.saveLimit != null && existing.length >= access.saveLimit) {
      return {
        error: `Free accounts can keep ${access.saveLimit} matches. Upgrade to Pro for the full list.`,
        ok: true,
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

export async function savePainProfile(
  painId: string,
  slugs: string[],
  profile: PainProfile,
  href?: string,
) {
  const session = await getSession();
  if (!session) return { error: "Sign in to save this Pain Profile." };
  if (!painId || slugs.length === 0) return { error: "Missing PainGraph." };
  const [pain] = await db
    .select({ id: pains.id })
    .from(pains)
    .where(eq(pains.id, painId))
    .limit(1);
  if (!pain) return { error: "Missing PainGraph." };
  await upsertSavedProfile({
    userId: session.user.id,
    painId,
    slugs: slugs.slice(0, 12),
    profile,
  });
  if (href) revalidatePath(href);
  return { ok: true };
}
