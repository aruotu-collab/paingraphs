import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { painRankSnapshots } from "@/lib/db/schema";
import { ensureDiscoveryTables } from "@/lib/discovery/db";
import {
  listBillboardRows,
  sortBillboard,
  type BillboardRow,
  type BillboardView,
} from "@/lib/opportunities/board";
import { utcDay } from "@/lib/opportunities/daily";

function scoreForView(graph: BillboardRow, view: BillboardView) {
  if (view === "affiliate") return graph.scores.affiliate;
  if (view === "founder") return graph.scores.founder;
  if (view === "intent") return graph.scores.buyingIntent;
  if (view === "underserved") {
    return graph.scores.founder + (100 - graph.scores.competition);
  }
  if (view === "growth") return graph.scores.growth;
  if (view === "competition") return 100 - graph.scores.competition;
  return graph.scores.pain;
}

export const RANK_VIEWS = [
  "pain",
  "affiliate",
  "founder",
  "intent",
  "underserved",
  "growth",
  "competition",
] as const satisfies readonly BillboardView[];

export type RankMovement = {
  previous: number | null;
  delta: number | null;
  isNew: boolean;
};

export async function snapshotBillboardRanks(day = utcDay()) {
  await ensureDiscoveryTables();
  const rows = await listBillboardRows();
  const now = new Date();
  await db.delete(painRankSnapshots).where(eq(painRankSnapshots.day, day));
  const values = RANK_VIEWS.flatMap((view) =>
    sortBillboard(rows, view).map((graph, index) => ({
      day,
      view,
      painId: graph.id,
      rank: index + 1,
      score: scoreForView(graph, view),
      createdAt: now,
    })),
  );
  if (values.length > 0) {
    await db.insert(painRankSnapshots).values(values);
  }
  return { rows: values.length, day };
}

export async function rankMapFor(view: BillboardView, day: string) {
  await ensureDiscoveryTables();
  const rows = await db
    .select()
    .from(painRankSnapshots)
    .where(and(eq(painRankSnapshots.day, day), eq(painRankSnapshots.view, view)));
  return new Map(rows.map((row) => [row.painId, row.rank]));
}

export function previousUtcDay(day: string) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export async function movementFor(view: BillboardView, painIds: string[]) {
  const today = utcDay();
  const [current, previous] = await Promise.all([
    rankMapFor(view, today),
    rankMapFor(view, previousUtcDay(today)),
  ]);
  const movement = new Map<string, RankMovement>();
  for (const id of painIds) {
    const now = current.get(id) ?? null;
    const then = previous.get(id) ?? null;
    movement.set(id, {
      previous: then,
      delta: now != null && then != null ? then - now : null,
      isNew: now != null && then == null && previous.size > 0,
    });
  }
  return movement;
}
