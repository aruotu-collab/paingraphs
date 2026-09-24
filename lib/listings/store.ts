import { and, eq } from "drizzle-orm";
import { db, sqlite } from "@/lib/db";
import { productListings } from "@/lib/db/schema";
import { ensureIdentityTables } from "@/lib/identity/db";

export async function listListingsForPain(painId: string) {
  await ensureIdentityTables();
  return db
    .select()
    .from(productListings)
    .where(eq(productListings.painId, painId));
}

export function pickListingsForProduct<
  T extends { productId: string; country: string },
>(rows: T[], productId: string, visitorCountry?: string | null) {
  const list = rows.filter((row) => row.productId === productId);
  if (list.length === 0) return [];
  if (!visitorCountry) {
    const defaults = list.filter((row) => row.country === "*");
    return defaults.length > 0 ? defaults : list;
  }
  const exact = list.filter(
    (row) => row.country.toUpperCase() === visitorCountry.toUpperCase(),
  );
  const defaults = list.filter((row) => row.country === "*");
  if (exact.length > 0) return [...exact, ...defaults];
  return defaults.length > 0 ? defaults : list;
}

export async function getListing(id: string) {
  await ensureIdentityTables();
  const [row] = await db
    .select()
    .from(productListings)
    .where(eq(productListings.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertListing(input: {
  painId: string;
  productId: string;
  name: string;
  url: string;
  country: string;
}) {
  await ensureIdentityTables();
  const id = crypto.randomUUID();
  await db.insert(productListings).values({
    id,
    painId: input.painId,
    productId: input.productId,
    name: input.name,
    url: input.url,
    country: input.country,
    createdAt: new Date(),
  });
  return id;
}

export async function deleteListing(id: string, painId: string) {
  await ensureIdentityTables();
  await db
    .delete(productListings)
    .where(and(eq(productListings.id, id), eq(productListings.painId, painId)));
}

export async function recordListingClick(input: {
  listingId: string;
  painId: string;
  productId: string;
  visitorCountry: string | null;
  sourcePath: string | null;
}) {
  await ensureIdentityTables();
  await sqlite.execute({
    sql: `INSERT INTO listing_clicks (
      id, listing_id, pain_id, product_id, visitor_country, source_path, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(),
      input.listingId,
      input.painId,
      input.productId,
      input.visitorCountry,
      input.sourcePath,
      Date.now(),
    ],
  });
}
