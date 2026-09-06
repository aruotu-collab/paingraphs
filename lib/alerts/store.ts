import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { alertPreferences, memberAlerts } from "@/lib/db/schema";
import { ensureIdentityTables } from "@/lib/identity/db";
import type { AlertPrefs } from "./types";

const DEFAULT_PREFS: AlertPrefs = {
  emailSavedUpdates: false,
  emailOpportunity: false,
};

export async function getAlertPrefs(userId: string): Promise<AlertPrefs> {
  await ensureIdentityTables();
  const [row] = await db
    .select()
    .from(alertPreferences)
    .where(eq(alertPreferences.userId, userId))
    .limit(1);
  return row
    ? {
        emailSavedUpdates: row.emailSavedUpdates,
        emailOpportunity: row.emailOpportunity,
      }
    : DEFAULT_PREFS;
}

export async function saveAlertPrefs(userId: string, prefs: AlertPrefs) {
  await ensureIdentityTables();
  const now = new Date();
  await db
    .insert(alertPreferences)
    .values({
      userId,
      emailSavedUpdates: prefs.emailSavedUpdates,
      emailOpportunity: prefs.emailOpportunity,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: alertPreferences.userId,
      set: {
        emailSavedUpdates: prefs.emailSavedUpdates,
        emailOpportunity: prefs.emailOpportunity,
        updatedAt: now,
      },
    });
}

export async function listMemberAlerts(userId: string, limit = 40) {
  await ensureIdentityTables();
  return db
    .select()
    .from(memberAlerts)
    .where(eq(memberAlerts.userId, userId))
    .orderBy(desc(memberAlerts.createdAt))
    .limit(limit);
}

export async function unreadAlertCount(userId: string) {
  await ensureIdentityTables();
  const rows = await db
    .select({ id: memberAlerts.id })
    .from(memberAlerts)
    .where(and(eq(memberAlerts.userId, userId), isNull(memberAlerts.readAt)));
  return rows.length;
}

export async function markAlertsRead(userId: string) {
  await ensureIdentityTables();
  await db
    .update(memberAlerts)
    .set({ readAt: new Date() })
    .where(and(eq(memberAlerts.userId, userId), isNull(memberAlerts.readAt)));
}
