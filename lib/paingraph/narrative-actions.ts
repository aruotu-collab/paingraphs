"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { writeNarrativeWithOpenAI } from "./narrative-openai";
import { getAnyPainGraph, getPainGraphPage } from "./queries";

export async function rewritePainNarrative(formData: FormData) {
  await requireAdmin("/admin/pains");
  const painId = String(formData.get("painId") ?? "");
  const graph = await getAnyPainGraph(painId);
  if (!graph) return;
  const page = await getPainGraphPage(
    graph.category.slug,
    graph.subcategory.slug,
    graph.slug,
  );
  if (!page) return;
  await writeNarrativeWithOpenAI({
    id: page.id,
    h1: page.h1,
    summary: page.summary,
    explanation: page.explanation,
    whyNow: page.whyNow,
    consumer: page.consumer,
    productName: page.products[0]?.name,
    productNote: page.products[0]?.note,
  });
  revalidatePath(page.href);
  revalidatePath("/admin/pains");
}
