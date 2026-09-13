import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  affiliateDestinations,
  destinationClicks,
  destinationConversions,
  productFits,
  products,
} from "@/lib/db/schema";
import { ensureIdentityTables } from "@/lib/identity/db";

let conversionsReady: Promise<void> | null = null;

export async function ensureConversionTable() {
  if (!conversionsReady) {
    conversionsReady = createConversionTable().catch((error) => {
      conversionsReady = null;
      throw error;
    });
  }
  return conversionsReady;
}

async function createConversionTable() {
  await ensureIdentityTables();
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS destination_conversions (
      id TEXT PRIMARY KEY,
      destination_id TEXT REFERENCES affiliate_destinations(id) ON DELETE SET NULL,
      pain_id TEXT NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      note TEXT,
      actor_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL
    )
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS destination_conversions_pain_idx
    ON destination_conversions (pain_id)
  `);
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS destination_conversions_destination_idx
    ON destination_conversions (destination_id)
  `);
}

export async function listDestinationsForPain(painId: string) {
  await ensureIdentityTables();
  return db
    .select()
    .from(affiliateDestinations)
    .where(eq(affiliateDestinations.painId, painId));
}

export async function getPlatformDestination(id: string) {
  await ensureIdentityTables();
  const [row] = await db
    .select()
    .from(affiliateDestinations)
    .where(eq(affiliateDestinations.id, id))
    .limit(1);
  return row ?? null;
}

export async function destinationCounts() {
  await ensureIdentityTables();
  const rows = await db.select().from(affiliateDestinations);
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.painId, (counts.get(row.painId) ?? 0) + 1);
  }
  return counts;
}

export async function clickCounts() {
  await ensureIdentityTables();
  const rows = await db
    .select({ painId: destinationClicks.painId })
    .from(destinationClicks);
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.painId, (counts.get(row.painId) ?? 0) + 1);
  }
  return counts;
}

export async function conversionTotals() {
  await ensureConversionTable();
  const rows = await db.select().from(destinationConversions);
  const totals = new Map<string, { amount: number; count: number }>();
  for (const row of rows) {
    const current = totals.get(row.painId) ?? { amount: 0, count: 0 };
    current.amount += row.amount;
    current.count += 1;
    totals.set(row.painId, current);
  }
  return totals;
}

export async function recordConversion(input: {
  painId: string;
  destinationId?: string | null;
  amount: number;
  currency?: string;
  note?: string | null;
  actorUserId?: string | null;
}) {
  await ensureConversionTable();
  await db.insert(destinationConversions).values({
    id: crypto.randomUUID(),
    destinationId: input.destinationId || null,
    painId: input.painId,
    amount: input.amount,
    currency: input.currency || "GBP",
    note: input.note ?? null,
    actorUserId: input.actorUserId ?? null,
    createdAt: new Date(),
  });
}

export async function productsForPain(painId: string) {
  const rows = await db
    .select({ product: products, note: productFits.note })
    .from(productFits)
    .innerJoin(products, eq(productFits.productId, products.id))
    .where(eq(productFits.painId, painId));
  return rows.map(({ product, note }) => ({
    id: product.id,
    name: product.name,
    summary: product.summary,
    priceBand: product.priceBand,
    note,
  }));
}

export async function upsertDestination(input: {
  painId: string;
  productId: string;
  url: string;
  country: string;
}) {
  await ensureIdentityTables();
  const now = new Date();
  const existing = await db
    .select()
    .from(affiliateDestinations)
    .where(
      and(
        eq(affiliateDestinations.painId, input.painId),
        eq(affiliateDestinations.productId, input.productId),
        eq(affiliateDestinations.country, input.country),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(affiliateDestinations)
      .set({ url: input.url, updatedAt: now })
      .where(eq(affiliateDestinations.id, existing[0].id));
    return existing[0].id;
  }

  const id = crypto.randomUUID();
  await db.insert(affiliateDestinations).values({
    id,
    painId: input.painId,
    productId: input.productId,
    url: input.url,
    country: input.country,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function deleteDestination(
  painId: string,
  productId: string,
  country: string,
) {
  await ensureIdentityTables();
  await db
    .delete(affiliateDestinations)
    .where(
      and(
        eq(affiliateDestinations.painId, painId),
        eq(affiliateDestinations.productId, productId),
        eq(affiliateDestinations.country, country),
      ),
    );
}

export async function recordDestinationClick(input: {
  destinationId: string;
  painId: string;
  productId: string;
  country: string | null;
  visitorCountry: string | null;
  sourcePath: string | null;
  sessionId: string | null;
}) {
  await ensureIdentityTables();
  await db.insert(destinationClicks).values({
    id: crypto.randomUUID(),
    destinationId: input.destinationId,
    painId: input.painId,
    productId: input.productId,
    country: input.country,
    visitorCountry: input.visitorCountry,
    sourcePath: input.sourcePath,
    sessionId: input.sessionId,
    createdAt: new Date(),
  });
}
