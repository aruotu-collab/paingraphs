"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { analyseProductUrl } from "./analyse";

export type AnalyseState = {
  error?: string;
  ok?: boolean;
};

export async function analyseProduct(
  _prev: AnalyseState | null,
  formData: FormData,
): Promise<AnalyseState> {
  const session = await requireSession();
  const url = String(formData.get("url") || "");
  try {
    await analyseProductUrl(session.user.id, url);
    revalidatePath("/product");
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not analyse that product.";
    return { error: message };
  }
}
