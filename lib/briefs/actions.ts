"use server";

import { revalidatePath } from "next/cache";
import { optionalText } from "@/lib/discovery/text";
import { parseCountry, parseDestinationUrl } from "@/lib/destinations/url";
import { entitlements } from "@/lib/identity/profile";
import { getAccess, requireSession } from "@/lib/session";
import { createBrief, isBriefObjective } from "./store";

export async function saveCampaignBrief(formData: FormData) {
  const session = await requireSession("/home/briefs");
  const { profile, capabilities } = await getAccess(session.user);
  const owner = capabilities.admin || capabilities.marketingAgent;
  if (!entitlements(profile, owner).pro) return;

  const painId = String(formData.get("painId") ?? "");
  const objective = String(formData.get("objective") ?? "traffic");
  if (!painId || !isBriefObjective(objective)) return;
  const rawUrl = optionalText(formData.get("destinationUrl"), 400);
  const parsed = rawUrl ? parseDestinationUrl(rawUrl) : null;
  if (rawUrl && parsed && !("url" in parsed)) return;

  const result = await createBrief({
    userId: session.user.id,
    painId,
    country: parseCountry(String(formData.get("country") ?? "*")),
    destinationUrl: parsed && "url" in parsed ? parsed.url : null,
    dailyBudget: optionalText(formData.get("dailyBudget"), 40),
    objective,
  });
  revalidatePath("/home/briefs");
  revalidatePath("/marketing-agent");
  if ("id" in result) {
    revalidatePath(`/home/briefs/${result.id}`);
  }
}
