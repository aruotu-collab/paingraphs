"use server";

import { revalidatePath } from "next/cache";
import { notifyPriceChange } from "@/lib/alerts/run";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { clip } from "@/lib/discovery/text";
import { requireAdmin, requireSession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { recordProductPrice, togglePriceWatch } from "./store";

export async function watchProductPrice(formData: FormData) {
  const session = await requireSession("/home");
  const productId = String(formData.get("productId") ?? "");
  const painId = String(formData.get("painId") ?? "");
  if (!productId || !painId) return;
  await togglePriceWatch({
    userId: session.user.id,
    productId,
    painId,
  });
  revalidatePath("/home/alerts");
}

export async function recordObservedPrice(formData: FormData) {
  await requireAdmin("/admin/products");
  const productId = String(formData.get("productId") ?? "");
  const display = clip(String(formData.get("display") ?? ""), 80);
  if (!productId || display.length < 1) return;
  const result = await recordProductPrice({
    productId,
    painId: clip(String(formData.get("painId") ?? ""), 80) || null,
    display,
    sourceLabel: "Owner observation",
  });
  if (result.changed && result.previous) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    await notifyPriceChange({
      productId,
      productName: product?.name ?? "Product",
      previous: result.previous.display,
      display,
    });
  }
  revalidatePath("/admin/products");
  revalidatePath("/home/alerts");
}
