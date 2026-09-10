"use server";

import { revalidatePath } from "next/cache";
import { clip, optionalText } from "@/lib/discovery/text";
import { entitlements } from "@/lib/identity/profile";
import { parseDestinationUrl } from "@/lib/destinations/url";
import { getAccess, requireSession } from "@/lib/session";
import { createMemberProduct, deleteMemberProduct } from "./store";

function revalidateProducts() {
  revalidatePath("/home/products");
  revalidatePath("/home");
  revalidatePath("/marketing-agent");
  revalidatePath("/marketing-agent/products");
}

export async function saveMemberProduct(formData: FormData) {
  const session = await requireSession("/home/products");
  const { profile, capabilities } = await getAccess(session.user);
  const owner = capabilities.admin || capabilities.marketingAgent;
  const access = entitlements(profile, owner);
  if (!access.pro) return;

  const name = clip(String(formData.get("name") ?? ""), 160);
  const description = clip(String(formData.get("description") ?? ""), 4000);
  const parsed = parseDestinationUrl(String(formData.get("url") ?? ""));
  if (name.length < 2 || description.length < 8 || !("url" in parsed) || !parsed.url) {
    return;
  }

  await createMemberProduct({
    userId: session.user.id,
    name,
    url: parsed.url,
    description,
    targetCustomer: optionalText(formData.get("targetCustomer")),
    geography: optionalText(formData.get("geography"), 80),
    price: optionalText(formData.get("price"), 80),
    categorySlug: optionalText(formData.get("categorySlug"), 80),
    problemsSolved: optionalText(formData.get("problemsSolved"), 2000),
    features: optionalText(formData.get("features"), 2000),
    positioning: optionalText(formData.get("positioning"), 800),
    ownerOwned: owner,
  });
  revalidateProducts();
}

export async function removeMemberProduct(formData: FormData) {
  const session = await requireSession("/home/products");
  const id = String(formData.get("productId") ?? "");
  if (!id) return;
  await deleteMemberProduct(id, session.user.id);
  revalidateProducts();
}
