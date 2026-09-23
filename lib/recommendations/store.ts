import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recommendationPreferences } from "@/lib/db/schema";
import { parseProfile, type PainProfile } from "@/lib/paingraph/match";
import { ensureWorkspaceTables } from "@/lib/workspace/db";

function parseSavedProfile(raw: string, slugs: string[]): PainProfile | null {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object") return null;
    return parseProfile(value, slugs);
  } catch {
    return null;
  }
}

export async function getSavedProfile(
  userId: string,
  painId: string,
  slugs: string[],
) {
  await ensureWorkspaceTables();
  const [row] = await db
    .select()
    .from(recommendationPreferences)
    .where(
      and(
        eq(recommendationPreferences.userId, userId),
        eq(recommendationPreferences.painId, painId),
      ),
    )
    .limit(1);
  if (!row) return null;
  return parseSavedProfile(row.prioritiesJson, slugs);
}

export async function getSavedPriorities(
  userId: string,
  painId: string,
  slugs: string[],
) {
  const profile = await getSavedProfile(userId, painId, slugs);
  if (!profile) return null;
  return profile.importances;
}

export async function upsertSavedProfile(input: {
  userId: string;
  painId: string;
  slugs: string[];
  profile: PainProfile;
}) {
  await ensureWorkspaceTables();
  const profile = parseProfile(input.profile, input.slugs);
  const [existing] = await db
    .select({ id: recommendationPreferences.id })
    .from(recommendationPreferences)
    .where(
      and(
        eq(recommendationPreferences.userId, input.userId),
        eq(recommendationPreferences.painId, input.painId),
      ),
    )
    .limit(1);
  const now = new Date();
  if (existing) {
    await db
      .update(recommendationPreferences)
      .set({ prioritiesJson: JSON.stringify(profile), updatedAt: now })
      .where(eq(recommendationPreferences.id, existing.id));
    return;
  }
  await db.insert(recommendationPreferences).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    painId: input.painId,
    prioritiesJson: JSON.stringify(profile),
    updatedAt: now,
  });
}

export async function upsertSavedPriorities(input: {
  userId: string;
  painId: string;
  slugs: string[];
  priorities: Record<string, number>;
}) {
  await upsertSavedProfile({
    userId: input.userId,
    painId: input.painId,
    slugs: input.slugs,
    profile: parseProfile({ importances: input.priorities, breakers: [] }, input.slugs),
  });
}
