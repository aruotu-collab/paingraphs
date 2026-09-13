import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recommendationPreferences } from "@/lib/db/schema";
import { normalizePriorities } from "@/lib/paingraph/rank";
import type { Priorities } from "@/lib/paingraph/types";
import { ensureWorkspaceTables } from "@/lib/workspace/db";

function parsePriorities(raw: string, slugs: string[]): Priorities | null {
  try {
    const value = JSON.parse(raw) as Priorities;
    if (!value || typeof value !== "object") return null;
    return normalizePriorities(value, slugs);
  } catch {
    return null;
  }
}

export async function getSavedPriorities(
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
  return parsePriorities(row.prioritiesJson, slugs);
}

export async function upsertSavedPriorities(input: {
  userId: string;
  painId: string;
  slugs: string[];
  priorities: Priorities;
}) {
  await ensureWorkspaceTables();
  const priorities = normalizePriorities(input.priorities, input.slugs);
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
      .set({ prioritiesJson: JSON.stringify(priorities), updatedAt: now })
      .where(eq(recommendationPreferences.id, existing.id));
    return;
  }
  await db.insert(recommendationPreferences).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    painId: input.painId,
    prioritiesJson: JSON.stringify(priorities),
    updatedAt: now,
  });
}
