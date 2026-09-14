import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { painNarratives } from "@/lib/db/schema";
import { narrativeFromFacts, sanitizeNarrative } from "./narrative";
import type { NarrativeFacts } from "./narrative";
import type { PainNarrative } from "./types";

let ready: Promise<void> | null = null;

export async function ensureNarrativeTable() {
  if (!ready) {
    ready = db
      .run(
        sql`
      CREATE TABLE IF NOT EXISTS pain_narratives (
        pain_id TEXT PRIMARY KEY REFERENCES pains(id) ON DELETE CASCADE,
        hook TEXT NOT NULL,
        scene TEXT NOT NULL,
        mechanism TEXT NOT NULL,
        failed_loop TEXT NOT NULL,
        trap TEXT NOT NULL,
        turn TEXT NOT NULL,
        origin TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `,
      )
      .then(() => undefined)
      .catch((error) => {
        ready = null;
        throw error;
      });
  }
  return ready;
}

export async function getStoredNarrative(painId: string) {
  await ensureNarrativeTable();
  const [row] = await db
    .select()
    .from(painNarratives)
    .where(eq(painNarratives.painId, painId))
    .limit(1);
  if (!row) return null;
  return {
    hook: row.hook,
    scene: row.scene,
    mechanism: row.mechanism,
    failedLoop: row.failedLoop,
    trap: row.trap,
    turn: row.turn,
  } satisfies PainNarrative;
}

export async function saveNarrative(
  painId: string,
  narrative: PainNarrative,
  origin: "openai" | "seed",
) {
  await ensureNarrativeTable();
  await db
    .insert(painNarratives)
    .values({
      painId,
      ...narrative,
      origin,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: painNarratives.painId,
      set: {
        ...narrative,
        origin,
        updatedAt: new Date(),
      },
    });
}

export async function narrativeFor(facts: NarrativeFacts): Promise<PainNarrative> {
  const fallback = narrativeFromFacts(facts);
  const stored = await getStoredNarrative(facts.id);
  return stored ? sanitizeNarrative(stored, fallback) : fallback;
}
