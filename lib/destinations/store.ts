import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  affiliateDestinations,
  destinationClicks,
  productFits,
  products,
} from "@/lib/db/schema";
import { ensureIdentityTables } from "@/lib/identity/db";

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
