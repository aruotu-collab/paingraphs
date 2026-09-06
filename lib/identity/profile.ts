import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import {
  isWorkspaceMode,
  type Plan,
  type WorkspaceMode,
} from "./constants";
import { ensureIdentityTables } from "./db";

export type UserProfile = {
  userId: string;
  consumerEnabled: boolean;
  affiliateEnabled: boolean;
  founderEnabled: boolean;
  primaryMode: WorkspaceMode;
  plan: Plan;
};

export type SignupLenses = {
  affiliate?: boolean;
  founder?: boolean;
};

function toProfile(row: typeof userProfiles.$inferSelect): UserProfile {
  return {
    userId: row.userId,
    consumerEnabled: row.consumerEnabled,
    affiliateEnabled: row.affiliateEnabled,
    founderEnabled: row.founderEnabled,
    primaryMode: isWorkspaceMode(row.primaryMode) ? row.primaryMode : "solve",
    plan: row.plan === "pro" || row.plan === "business" ? row.plan : "free",
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  await ensureIdentityTables();
  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return row ? toProfile(row) : null;
}

export async function ensureUserProfile(
  userId: string,
  lenses: SignupLenses = {},
): Promise<UserProfile> {
  await ensureIdentityTables();
  const existing = await getUserProfile(userId);
  if (existing) {
    if (lenses.affiliate || lenses.founder) {
      return updateUserProfile(userId, {
        affiliateEnabled: existing.affiliateEnabled || Boolean(lenses.affiliate),
        founderEnabled: existing.founderEnabled || Boolean(lenses.founder),
      });
    }
    return existing;
  }

  const now = new Date();
  await db.insert(userProfiles).values({
    userId,
    consumerEnabled: true,
    affiliateEnabled: Boolean(lenses.affiliate),
    founderEnabled: Boolean(lenses.founder),
    primaryMode: lenses.founder ? "build" : lenses.affiliate ? "promote" : "solve",
    plan: "free",
    createdAt: now,
    updatedAt: now,
  });
  return (await getUserProfile(userId))!;
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<
    Pick<
      UserProfile,
      "affiliateEnabled" | "founderEnabled" | "primaryMode" | "plan"
    >
  >,
): Promise<UserProfile> {
  await ensureUserProfile(userId);
  await db
    .update(userProfiles)
    .set({
      ...patch,
      consumerEnabled: true,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId));
  return (await getUserProfile(userId))!;
}

export function entitlements(profile: UserProfile, owner: boolean) {
  const pro = owner || profile.plan === "pro" || profile.plan === "business";
  return {
    plan: owner ? "owner" : profile.plan,
    pro,
    canBrowsePains: true,
    canUseSliders: true,
    canSavePains: true,
    canSeeAffiliateDepth: pro,
    canSeeFounderDepth: pro,
    canUseMarketingAgent: owner,
    canUseAdmin: owner,
  };
}
