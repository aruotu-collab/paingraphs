import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyOpportunities } from "@/lib/db/schema";
import { ensureIdentityTables } from "@/lib/identity/db";
import { listPainGraphs } from "@/lib/paingraph/queries";
import type { PainGraph } from "@/lib/paingraph/types";

export const OPPORTUNITY_LENSES = ["affiliate", "founder"] as const;
export type OpportunityLens = (typeof OPPORTUNITY_LENSES)[number];

export function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function previousUtcDay(day: string) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function dayHash(day: string, lens: OpportunityLens) {
  let hash = 0;
  const seed = `${day}:${lens}`;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function qualified(graphs: PainGraph[], lens: OpportunityLens) {
  return graphs
    .filter((graph) => {
      if (graph.evidenceCount < 2) return false;
      if (graph.sensitive && lens === "affiliate") return graph.scores.affiliate >= 78;
      return lens === "affiliate"
        ? graph.scores.affiliate >= 70
        : graph.scores.founder >= 55;
    })
    .sort((a, b) =>
      lens === "affiliate"
        ? b.scores.affiliate - a.scores.affiliate
        : b.scores.founder - a.scores.founder,
    );
}

function pickFromPool(pool: PainGraph[], day: string, lens: OpportunityLens) {
  if (pool.length === 0) return null;
  return pool[dayHash(day, lens) % pool.length] ?? pool[0];
}

export async function todaysOpportunity(
  lens: OpportunityLens,
  graphs?: PainGraph[],
) {
  await ensureIdentityTables();
  const day = utcDay();
  const [existing] = await db
    .select()
    .from(dailyOpportunities)
    .where(and(eq(dailyOpportunities.day, day), eq(dailyOpportunities.lens, lens)))
    .limit(1);

  const catalog = graphs ?? (await listPainGraphs());
  if (existing) {
    const graph = catalog.find((item) => item.id === existing.painId);
    if (graph) return graph;
  }

  const [yesterday] = await db
    .select()
    .from(dailyOpportunities)
    .where(
      and(
        eq(dailyOpportunities.day, previousUtcDay(day)),
        eq(dailyOpportunities.lens, lens),
      ),
    )
    .limit(1);

  const ranked = qualified(catalog, lens);
  const pool = ranked
    .slice(0, 8)
    .filter((graph) => graph.id !== yesterday?.painId);
  const pick = pickFromPool(pool.length > 0 ? pool : ranked, day, lens);
  if (!pick) return null;

  try {
    await db.insert(dailyOpportunities).values({
      day,
      lens,
      painId: pick.id,
      createdAt: new Date(),
    });
  } catch {
    const [race] = await db
      .select()
      .from(dailyOpportunities)
      .where(and(eq(dailyOpportunities.day, day), eq(dailyOpportunities.lens, lens)))
      .limit(1);
    const graph = catalog.find((item) => item.id === race?.painId);
    if (graph) return graph;
  }
  return pick;
}

export async function recentOpportunities(lens: OpportunityLens, limit = 7) {
  await ensureIdentityTables();
  await todaysOpportunity(lens);
  const rows = await db
    .select()
    .from(dailyOpportunities)
    .where(eq(dailyOpportunities.lens, lens))
    .orderBy(desc(dailyOpportunities.day))
    .limit(limit);
  const graphs = await listPainGraphs();
  return rows
    .map((row) => {
      const graph = graphs.find((item) => item.id === row.painId);
      return graph ? { day: row.day, graph } : null;
    })
    .filter((item): item is { day: string; graph: PainGraph } => Boolean(item));
}
