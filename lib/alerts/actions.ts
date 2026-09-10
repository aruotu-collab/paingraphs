"use server";

import { revalidatePath } from "next/cache";
import { sendAlertDigestEmail } from "@/lib/email";
import { getAccess, requireSession } from "@/lib/session";
import { runSavedPainAlerts } from "./run";
import { getAlertPrefs, markAlertsRead, saveAlertPrefs } from "./store";

export async function updateAlertPrefs(formData: FormData) {
  const session = await requireSession("/home/alerts");
  const previous = await getAlertPrefs(session.user.id);
  const prefs = {
    emailSavedUpdates: formData.get("emailSavedUpdates") === "on",
    emailOpportunity: formData.get("emailOpportunity") === "on",
    emailPriceUpdates: formData.get("emailPriceUpdates") === "on",
    emailSearchUpdates: formData.get("emailSearchUpdates") === "on",
  };
  await saveAlertPrefs(session.user.id, prefs);
  const enabled =
    (!previous.emailSavedUpdates && prefs.emailSavedUpdates) ||
    (!previous.emailOpportunity && prefs.emailOpportunity) ||
    (!previous.emailPriceUpdates && prefs.emailPriceUpdates) ||
    (!previous.emailSearchUpdates && prefs.emailSearchUpdates);
  if (enabled && session.user.email) {
    await sendAlertDigestEmail({
      email: session.user.email,
      items: [
        {
          title: "Email alerts are on",
          body: "You will get email only for the boxes you ticked. Turn them off any time on Alerts.",
          href: "/home/alerts",
        },
      ],
    }).catch((error) => console.warn("Alert opt-in email failed:", error));
  }
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
