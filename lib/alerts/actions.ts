"use server";

import { revalidatePath } from "next/cache";
import { getAccess, requireSession } from "@/lib/session";
import { runSavedPainAlerts } from "./run";
import { markAlertsRead, saveAlertPrefs } from "./store";

export async function updateAlertPrefs(formData: FormData) {
  const session = await requireSession("/home/alerts");
  await saveAlertPrefs(session.user.id, {
    emailSavedUpdates: formData.get("emailSavedUpdates") === "on",
    emailOpportunity: formData.get("emailOpportunity") === "on",
  });
  revalidatePath("/home/alerts");
  revalidatePath("/home");
}

export async function markMyAlertsRead() {
  const session = await requireSession("/home/alerts");
  await markAlertsRead(session.user.id);
  revalidatePath("/home/alerts");
  revalidatePath("/home");
}

export async function generateTodaysAlerts() {
  const session = await requireSession("/home/alerts");
  const access = await getAccess(session.user);
  if (!access.capabilities.admin && !access.capabilities.marketingAgent) {
    return { error: "Owner only." };
  }
  const result = await runSavedPainAlerts();
  revalidatePath("/home/alerts");
  revalidatePath("/home");
  return { ok: true, result };
}
