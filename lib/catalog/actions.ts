"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { optionalText } from "@/lib/discovery/text";
import { ensurePlacement } from "./placements";

export async function createPlacement(formData: FormData) {
  await requireAdmin("/admin/categories");
  const categoryName = optionalText(formData.get("categoryName"), 80);
  if (!categoryName) return;
  const result = await ensurePlacement({
    categoryName,
    clusterName: optionalText(formData.get("clusterName"), 80),
    summary: optionalText(formData.get("summary"), 400),
  });
  if ("error" in result) return;
  revalidatePath("/admin/categories");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/pains");
  revalidatePath("/");
}
