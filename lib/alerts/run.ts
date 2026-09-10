import { eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  alertPreferences,
  memberAlerts,
  painWatchSnapshots,
  productFits,
  user,
  watchlists,
} from "@/lib/db/schema";
import { destinationCounts } from "@/lib/destinations/store";
import { sendAlertDigestEmail } from "@/lib/email";
import { ensureIdentityTables } from "@/lib/identity/db";
import { todaysOpportunity, utcDay } from "@/lib/opportunities/daily";
import { listPainGraphs } from "@/lib/paingraph/queries";
import type { PainGraph } from "@/lib/paingraph/types";
import {
  isOpportunityAlert,
  isPriceAlert,
  isSavedAlert,
  isSearchAlert,
  type AlertKind,
} from "./types";

const SCORE_MOVE = 5;

type WatchState = {
  evidenceCount: number;
  destinationCount: number;
  productCount: number;
  affiliateScore: number;
  founderScore: number;
};

type AlertDraft = {
  userId: string;
  painId: string;
  kind: AlertKind;
  title: string;
  body: string;
  href: string;
};

async function productCounts() {
  const rows = await db.select({ painId: productFits.painId }).from(productFits);
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.painId, (counts.get(row.painId) ?? 0) + 1);
  }
  return counts;
}

function stateFor(graph: PainGraph, destinations: number, products: number): WatchState {
  return {
    evidenceCount: graph.evidenceCount,
    destinationCount: destinations,
    productCount: products,
    affiliateScore: graph.scores.affiliate,
    founderScore: graph.scores.founder,
  };
}

function savedDrafts(graph: PainGraph, previous: WatchState, next: WatchState): Omit<AlertDraft, "userId">[] {
  const drafts: Omit<AlertDraft, "userId">[] = [];
  if (next.destinationCount > previous.destinationCount) {
    drafts.push({
      painId: graph.id,
      kind: "saved_destination",
      title: "A public Check price link was added",
      body: `${graph.title} now has a verified destination. Rankings still follow fit, not commission.`,
      href: graph.href,
    });
  }
  if (next.evidenceCount > previous.evidenceCount) {
    drafts.push({
      painId: graph.id,
      kind: "saved_evidence",
      title: "More public complaints were added",
      body: `${graph.title} moved from ${previous.evidenceCount} to ${next.evidenceCount} selected complaints.`,
      href: graph.href,
    });
  }
  if (next.productCount > previous.productCount) {
    drafts.push({
      painId: graph.id,
      kind: "saved_product",
      title: "Another scored product was added",
      body: `${graph.title} now has ${next.productCount} scored products.`,
      href: graph.href,
    });
  }
  const affiliateMove = next.affiliateScore - previous.affiliateScore;
  const founderMove = next.founderScore - previous.founderScore;
  if (Math.abs(affiliateMove) >= SCORE_MOVE || Math.abs(founderMove) >= SCORE_MOVE) {
    drafts.push({
      painId: graph.id,
      kind: "saved_score",
      title: "Scores moved on a saved pain",
      body: `${graph.title}: affiliate ${Math.round(previous.affiliateScore)} → ${Math.round(next.affiliateScore)}, founder ${Math.round(previous.founderScore)} → ${Math.round(next.founderScore)}.`,
      href: graph.href,
    });
  }
  return drafts;
}

async function insertDrafts(drafts: AlertDraft[], day: string) {
  let created = 0;
  let failed = 0;
  for (const draft of drafts) {
    try {
      await db.insert(memberAlerts).values({
        id: crypto.randomUUID(),
        userId: draft.userId,
        painId: draft.painId,
        kind: draft.kind,
        title: draft.title,
        body: draft.body,
        href: draft.href,
        day,
        createdAt: new Date(),
      });
      created += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      if (!/UNIQUE|unique/i.test(message)) {
        console.warn("Alert insert failed:", message);
      }
    }
  }
  return { created, failed };
}

async function emailPendingAlerts() {
  const pending = await db
    .select({
      id: memberAlerts.id,
      userId: memberAlerts.userId,
      kind: memberAlerts.kind,
      title: memberAlerts.title,
      body: memberAlerts.body,
      href: memberAlerts.href,
      email: user.email,
      emailSavedUpdates: alertPreferences.emailSavedUpdates,
      emailOpportunity: alertPreferences.emailOpportunity,
      emailPriceUpdates: alertPreferences.emailPriceUpdates,
      emailSearchUpdates: alertPreferences.emailSearchUpdates,
    })
    .from(memberAlerts)
    .innerJoin(user, eq(user.id, memberAlerts.userId))
    .leftJoin(alertPreferences, eq(alertPreferences.userId, memberAlerts.userId))
    .where(isNull(memberAlerts.emailedAt));

  const byUser = new Map<string, typeof pending>();
  for (const row of pending) {
    const wantsSaved = row.emailSavedUpdates && isSavedAlert(row.kind);
    const wantsOotd = row.emailOpportunity && isOpportunityAlert(row.kind);
    const wantsPrice = row.emailPriceUpdates && isPriceAlert(row.kind);
    const wantsSearch = row.emailSearchUpdates && isSearchAlert(row.kind);
    if (!wantsSaved && !wantsOotd && !wantsPrice && !wantsSearch) continue;
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }

  let emailed = 0;
  for (const [userId, rows] of byUser) {
    const email = rows[0]?.email;
    if (!email) continue;
    try {
      await sendAlertDigestEmail({
        email,
        items: rows.map((row) => ({
          title: row.title,
          body: row.body,
          href: row.href,
        })),
      });
      await db
        .update(memberAlerts)
        .set({ emailedAt: new Date() })
        .where(inArray(memberAlerts.id, rows.map((row) => row.id)));
      emailed += 1;
    } catch (error) {
      console.warn("Alert email failed:", error);
    }
  }
  return emailed;
}

export async function notifyPriceChange(input: {
  productId: string;
  productName: string;
  previous: string;
  display: string;
  painId?: string | null;
}) {
  await ensureIdentityTables();
  const { listWatchersForProduct } = await import("@/lib/prices/store");
  const { listPainGraphs } = await import("@/lib/paingraph/queries");
  const watchers = await listWatchersForProduct(input.productId);
  const graphs = await listPainGraphs();
  const drafts: AlertDraft[] = [];
  for (const watch of watchers) {
    if (input.painId && watch.painId !== input.painId) continue;
    const graph = graphs.find((item) => item.id === watch.painId);
    drafts.push({
      userId: watch.userId,
      painId: watch.painId,
      kind: "price_change",
      title: "A watched price changed",
      body: `${input.productName} moved from ${input.previous} to ${input.display}. This is a recorded observation, not a live shop scrape.`,
      href: graph?.href ?? "/home/alerts",
    });
  }
  if (drafts.length === 0) return { created: 0 };
  const result = await insertDrafts(drafts, utcDay());
  await emailPendingAlerts();
  return result;
}

async function savedSearchDrafts(): Promise<AlertDraft[]> {
  const { savedSearches } = await import("@/lib/db/schema");
  const { listBillboardRows, isBillboardView } = await import(
    "@/lib/opportunities/board"
  );
  const { searchMatches, searchHref } = await import("@/lib/searches/store");
  const { movementFor } = await import("@/lib/ranks/snapshots");
  const rows = await db.select().from(savedSearches);
  if (rows.length === 0) return [];
  const board = await listBillboardRows();
  const drafts: AlertDraft[] = [];
  const views = [
    ...new Set(rows.map((row) => (isBillboardView(row.view) ? row.view : "pain"))),
  ];
  const movements = new Map(
    await Promise.all(
      views.map(async (view) => [
        view,
        await movementFor(
          view,
          board.map((row) => row.id),
        ),
      ] as const),
    ),
  );
  for (const search of rows) {
    const view = isBillboardView(search.view) ? search.view : "pain";
    const movement = movements.get(view);
    for (const { graph } of searchMatches(search, board)) {
      if (!movement?.get(graph.id)?.isNew) continue;
      drafts.push({
        userId: search.userId,
        painId: graph.id,
        kind: "saved_search",
        title: "A new pain matched a saved search",
        body: `${graph.title} is new on “${search.name}”.`,
        href: searchHref(search),
      });
    }
  }
  return drafts;
}

export async function alertIfSavedOpportunity(userId: string, painId: string) {
  await ensureIdentityTables();
  const [affiliateDay, founderDay] = await Promise.all([
    todaysOpportunity("affiliate"),
    todaysOpportunity("founder"),
  ]);
  const drafts: AlertDraft[] = [];
  if (affiliateDay?.id === painId) {
    drafts.push({
      userId,
      painId,
      kind: "ootd_affiliate",
      title: "Affiliate opportunity of the day",
      body: `${affiliateDay.title} is today's affiliate pick, and you saved it.`,
      href: affiliateDay.href,
    });
  }
  if (founderDay?.id === painId) {
    drafts.push({
      userId,
      painId,
      kind: "ootd_founder",
      title: "Founder opportunity of the day",
      body: `${founderDay.title} is today's founder pick, and you saved it.`,
      href: `/founders/gap/${founderDay.id}`,
    });
  }
  if (drafts.length === 0) return { created: 0 };
  return insertDrafts(drafts, utcDay());
}

export async function runSavedPainAlerts() {
  await ensureIdentityTables();
  const day = utcDay();
  const affiliateDay = await todaysOpportunity("affiliate");
  const founderDay = await todaysOpportunity("founder");
  const [graphs, destinations, products, saves, snapshots, ootdPrefs] =
    await Promise.all([
      listPainGraphs(),
      destinationCounts(),
      productCounts(),
      db
        .select({ userId: watchlists.userId, painId: watchlists.painId })
        .from(watchlists),
      db.select().from(painWatchSnapshots),
      db
        .select({ userId: alertPreferences.userId })
        .from(alertPreferences)
        .where(eq(alertPreferences.emailOpportunity, true)),
    ]);

  const previous = new Map(snapshots.map((row) => [row.painId, row]));
  const savers = new Map<string, string[]>();
  for (const row of saves) {
    const list = savers.get(row.painId) ?? [];
    list.push(row.userId);
    savers.set(row.painId, list);
  }

  const drafts: AlertDraft[] = [];
  for (const graph of graphs) {
    const next = stateFor(
      graph,
      destinations.get(graph.id) ?? 0,
      products.get(graph.id) ?? 0,
    );
    const last = previous.get(graph.id);
    if (last) {
      for (const draft of savedDrafts(graph, last, next)) {
        for (const userId of savers.get(graph.id) ?? []) {
          drafts.push({ ...draft, userId });
        }
      }
    }
    await db
      .insert(painWatchSnapshots)
      .values({
        painId: graph.id,
        ...next,
        capturedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: painWatchSnapshots.painId,
        set: { ...next, capturedAt: new Date() },
      });
  }

  const optedOotd = new Set(ootdPrefs.map((row) => row.userId));

  if (affiliateDay) {
    const recipients = new Set([
      ...(savers.get(affiliateDay.id) ?? []),
      ...optedOotd,
    ]);
    for (const userId of recipients) {
      const saved = (savers.get(affiliateDay.id) ?? []).includes(userId);
      drafts.push({
        userId,
        painId: affiliateDay.id,
        kind: "ootd_affiliate",
        title: "Affiliate opportunity of the day",
        body: saved
          ? `${affiliateDay.title} is today's affiliate pick, and you saved it.`
          : `${affiliateDay.title} is today's affiliate pick.`,
        href: affiliateDay.href,
      });
    }
  }

  if (founderDay) {
    const recipients = new Set([
      ...(savers.get(founderDay.id) ?? []),
      ...optedOotd,
    ]);
    for (const userId of recipients) {
      const saved = (savers.get(founderDay.id) ?? []).includes(userId);
      drafts.push({
        userId,
        painId: founderDay.id,
        kind: "ootd_founder",
        title: "Founder opportunity of the day",
        body: saved
          ? `${founderDay.title} is today's founder pick, and you saved it.`
          : `${founderDay.title} is today's founder pick.`,
        href: `/founders/gap/${founderDay.id}`,
      });
    }
  }

  const searchDrafts = await savedSearchDrafts();
  drafts.push(...searchDrafts);

  const { created, failed } = await insertDrafts(drafts, day);
  const emailed = await emailPendingAlerts();
  return {
    day,
    created,
    failed,
    emailed,
    drafts: drafts.length,
    savedWatchers: saves.length,
    snapshotCount: graphs.length,
    affiliateId: affiliateDay?.id ?? null,
    founderId: founderDay?.id ?? null,
  };
}
