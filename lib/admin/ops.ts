import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  affiliateDestinations,
  destinationClicks,
  products,
  user,
  userProfiles,
} from "@/lib/db/schema";
import { ensureIdentityTables } from "@/lib/identity/db";

export async function listMembers() {
  await ensureIdentityTables();
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      plan: userProfiles.plan,
      stripeStatus: userProfiles.stripeSubscriptionStatus,
      stripeCancelAt: userProfiles.stripeCancelAt,
      mode: userProfiles.primaryMode,
    })
    .from(user)
    .leftJoin(userProfiles, eq(userProfiles.userId, user.id))
    .orderBy(desc(user.createdAt));
  return rows;
}

export async function listCatalogProducts() {
  const rows = await db.select().from(products).orderBy(products.name);
  return rows;
}

export async function destinationTotals() {
  await ensureIdentityTables();
  const [destinations] = await db
    .select({ value: count() })
    .from(affiliateDestinations);
  const [clicks] = await db.select({ value: count() }).from(destinationClicks);
  return {
    destinations: destinations?.value ?? 0,
    clicks: clicks?.value ?? 0,
  };
}

export async function billingRows() {
  const members = await listMembers();
  return members.filter(
    (row) => row.plan === "pro" || row.plan === "business" || row.stripeStatus,
  );
}
