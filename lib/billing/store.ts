import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { ensureIdentityTables } from "@/lib/identity/db";
import {
  cancelAtFromSubscription,
  getStripe,
  planFromStatus,
  stripeConfigured,
} from "./stripe";

export async function billingProfile(userId: string) {
  await ensureIdentityTables();
  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function billingProfileByCustomer(customerId: string) {
  await ensureIdentityTables();
  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.stripeCustomerId, customerId))
    .limit(1);
  return row ?? null;
}

export async function saveStripeCustomer(userId: string, customerId: string) {
  await ensureIdentityTables();
  await db
    .update(userProfiles)
    .set({ stripeCustomerId: customerId, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId));
}

export async function applySubscription(input: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId: string | null;
  status: string | null;
  cancelAt?: number | null;
}) {
  await ensureIdentityTables();
  const existing = input.userId
    ? await billingProfile(input.userId)
    : input.customerId
      ? await billingProfileByCustomer(input.customerId)
      : null;
  if (!existing) return null;
  const plan = planFromStatus(input.status);
  await db
    .update(userProfiles)
    .set({
      plan,
      stripeCustomerId: input.customerId ?? existing.stripeCustomerId,
      stripeSubscriptionId: input.subscriptionId,
      stripeSubscriptionStatus: input.status,
      stripeCancelAt: plan === "pro" ? (input.cancelAt ?? null) : null,
      affiliateEnabled: existing.affiliateEnabled || plan === "pro",
      founderEnabled: existing.founderEnabled || plan === "pro",
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, existing.userId));
  return existing.userId;
}

export async function refreshSubscription(userId: string) {
  if (!stripeConfigured()) return billingProfile(userId);
  const existing = await billingProfile(userId);
  if (!existing?.stripeSubscriptionId) return existing;
  const subscription = await getStripe().subscriptions.retrieve(
    existing.stripeSubscriptionId,
  );
  await applySubscription({
    userId,
    customerId: existing.stripeCustomerId,
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAt: cancelAtFromSubscription(subscription),
  });
  return billingProfile(userId);
}
