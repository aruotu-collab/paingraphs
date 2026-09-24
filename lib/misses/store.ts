import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { painMisses } from "@/lib/db/schema";
import { ensureIdentityTables } from "@/lib/identity/db";

export function normalizeMissQuery(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200);
}

export async function recordPainMiss(query: string) {
  await ensureIdentityTables();
  const normalized = normalizeMissQuery(query);
  if (normalized.length < 8) return { error: "Type a bit more of the pain." };

  const now = new Date();
  const [existing] = await db
    .select()
    .from(painMisses)
    .where(eq(painMisses.normalized, normalized))
    .limit(1);

  if (existing) {
    await db
      .update(painMisses)
      .set({
        hits: existing.hits + 1,
        lastSeenAt: now,
        query: query.trim().slice(0, 200),
      })
      .where(eq(painMisses.id, existing.id));
    return { id: existing.id, hits: existing.hits + 1 };
  }

  const id = crypto.randomUUID();
  await db.insert(painMisses).values({
    id,
    query: query.trim().slice(0, 200),
    normalized,
    hits: 1,
    lastSeenAt: now,
    createdAt: now,
  });
  return { id, hits: 1 };
}

export async function listPainMisses(limit = 200) {
  await ensureIdentityTables();
  return db
    .select()
    .from(painMisses)
    .orderBy(desc(painMisses.hits), desc(painMisses.lastSeenAt))
    .limit(limit);
}

export async function painMissStats() {
  await ensureIdentityTables();
  const [row] = await db
    .select({
      queries: sql<number>`count(*)`,
      hits: sql<number>`coalesce(sum(${painMisses.hits}), 0)`,
    })
    .from(painMisses);
  return {
    queries: Number(row?.queries ?? 0),
    hits: Number(row?.hits ?? 0),
  };
}
