"use server";

import { revalidatePath } from "next/cache";
import { clip } from "@/lib/discovery/text";
import { entitlements } from "@/lib/identity/profile";
import { isBillboardView, parseBillboardFilters } from "@/lib/opportunities/board";
import { getAccess, requireSession } from "@/lib/session";
import { createSavedSearch, deleteSavedSearch } from "./store";

export async function saveBillboardSearch(formData: FormData) {
  const session = await requireSession("/top-pains");
  const { profile, capabilities } = await getAccess(session.user);
  if (!entitlements(profile, capabilities.admin || capabilities.marketingAgent).pro) {
    return;
  }
  const name = clip(String(formData.get("name") ?? ""), 80);
  const view = String(formData.get("view") ?? "pain");
  if (name.length < 2 || !isBillboardView(view)) return;
  await createSavedSearch(session.user.id, {
    name,
    view,
    ...parseBillboardFilters({
      category: String(formData.get("category") ?? ""),
      country: String(formData.get("country") ?? ""),
      products: String(formData.get("products") ?? ""),
      programmes: String(formData.get("programmes") ?? ""),
      minIntent: String(formData.get("minIntent") ?? ""),
    }),
  });
  revalidatePath("/home/searches");
  revalidatePath("/top-pains");
}

export async function removeSavedSearch(formData: FormData) {
  const session = await requireSession("/home/searches");
  const id = String(formData.get("searchId") ?? "");
  if (!id) return;
  await deleteSavedSearch(id, session.user.id);
  revalidatePath("/home/searches");
}
