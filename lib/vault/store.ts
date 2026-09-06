import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { memberDestinations } from "@/lib/db/schema";
import { ensureIdentityTables } from "@/lib/identity/db";

export async function listMemberDestinations(userId: string, painId: string) {
  await ensureIdentityTables();
  return db
    .select()
    .from(memberDestinations)
    .where(
      and(eq(memberDestinations.userId, userId), eq(memberDestinations.painId, painId)),
    );
}

export async function memberDestinationCounts(userId: string) {
  await ensureIdentityTables();
  const rows = await db
    .select()
    .from(memberDestinations)
    .where(eq(memberDestinations.userId, userId));
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.painId, (counts.get(row.painId) ?? 0) + 1);
  }
  return counts;
}

export async function upsertMemberDestination(input: {
  userId: string;
  painId: string;
  productId: string;
  url: string;
  country: string;
}) {
  await ensureIdentityTables();
  const now = new Date();
  const existing = await db
    .select()
    .from(memberDestinations)
    .where(
      and(
        eq(memberDestinations.userId, input.userId),
        eq(memberDestinations.painId, input.painId),
        eq(memberDestinations.productId, input.productId),
        eq(memberDestinations.country, input.country),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(memberDestinations)
      .set({ url: input.url, updatedAt: now })
      .where(eq(memberDestinations.id, existing[0].id));
    return existing[0].id;
  }

  const id = crypto.randomUUID();
  await db.insert(memberDestinations).values({
    id,
    userId: input.userId,
    painId: input.painId,
    productId: input.productId,
    url: input.url,
    country: input.country,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function deleteMemberDestination(input: {
  userId: string;
  painId: string;
  productId: string;
  country: string;
}) {
  await ensureIdentityTables();
  await db
    .delete(memberDestinations)
    .where(
      and(
        eq(memberDestinations.userId, input.userId),
        eq(memberDestinations.painId, input.painId),
        eq(memberDestinations.productId, input.productId),
        eq(memberDestinations.country, input.country),
      ),
    );
}
