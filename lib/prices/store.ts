import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { priceWatches, productPrices, products } from "@/lib/db/schema";
import { ensureWorkspaceTables } from "@/lib/workspace/db";

export function parsePence(display: string) {
  const numbers = [...display.matchAll(/(\d+(?:\.\d+)?)/g)].map((match) =>
    Number(match[1]),
  );
  if (numbers.length === 0) return null;
  const pounds = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  return Math.round(pounds * 100);
}

export async function latestPrice(productId: string, painId?: string | null) {
  await ensureWorkspaceTables();
  const rows = await db
    .select()
    .from(productPrices)
    .where(
      painId
        ? and(eq(productPrices.productId, productId), eq(productPrices.painId, painId))
        : eq(productPrices.productId, productId),
    )
    .orderBy(desc(productPrices.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function recordProductPrice(input: {
  productId: string;
  painId?: string | null;
  display: string;
  sourceLabel: string;
}) {
  await ensureWorkspaceTables();
  const display = input.display.trim().slice(0, 80);
  if (!display) return { changed: false };
  const previous = await latestPrice(input.productId, input.painId);
  if (previous?.display === display) return { changed: false, previous };
  await db.insert(productPrices).values({
    id: crypto.randomUUID(),
    productId: input.productId,
    painId: input.painId ?? null,
    display,
    amountPence: parsePence(display),
    currency: "GBP",
    sourceLabel: input.sourceLabel,
    createdAt: new Date(),
  });
  return { changed: Boolean(previous), previous };
}

export async function listPriceWatches(userId: string) {
  await ensureWorkspaceTables();
  return db
    .select()
    .from(priceWatches)
    .where(eq(priceWatches.userId, userId));
}

export async function watchedPriceIds(userId: string, painId: string) {
  const rows = await listPriceWatches(userId);
  return new Set(
    rows.filter((row) => row.painId === painId).map((row) => row.productId),
  );
}

export async function togglePriceWatch(input: {
  userId: string;
  productId: string;
  painId: string;
}) {
  await ensureWorkspaceTables();
  const [existing] = await db
    .select()
    .from(priceWatches)
    .where(
      and(
        eq(priceWatches.userId, input.userId),
        eq(priceWatches.productId, input.productId),
        eq(priceWatches.painId, input.painId),
      ),
    )
    .limit(1);
  if (existing) {
    await db.delete(priceWatches).where(eq(priceWatches.id, existing.id));
    return { watching: false };
  }
  await db.insert(priceWatches).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    productId: input.productId,
    painId: input.painId,
    createdAt: new Date(),
  });
  return { watching: true };
}

export async function listWatchers(productId: string, painId: string) {
  await ensureWorkspaceTables();
  return db
    .select()
    .from(priceWatches)
    .where(
      and(eq(priceWatches.productId, productId), eq(priceWatches.painId, painId)),
    );
}

export async function snapshotCatalogPrices() {
  await ensureWorkspaceTables();
  const rows = await db.select().from(products);
  const changes: {
    productId: string;
    name: string;
    previous: string;
    display: string;
  }[] = [];
  for (const product of rows) {
    if (!product.priceBand) continue;
    const result = await recordProductPrice({
      productId: product.id,
      display: product.priceBand,
      sourceLabel: "Catalog price band",
    });
    if (result.changed && result.previous) {
      changes.push({
        productId: product.id,
        name: product.name,
        previous: result.previous.display,
        display: product.priceBand,
      });
    }
  }
  return { changed: changes.length, counted: rows.length, changes };
}

export async function listWatchersForProduct(productId: string) {
  await ensureWorkspaceTables();
  return db
    .select()
    .from(priceWatches)
    .where(eq(priceWatches.productId, productId));
}
