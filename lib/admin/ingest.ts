"use server";

import { revalidatePath } from "next/cache";
import { runDiscoveryIngest } from "@/lib/discovery/ingest";
import { requireAdmin } from "@/lib/session";

export async function runOwnerIngest() {
  await requireAdmin("/admin/health");
  await runDiscoveryIngest();
  revalidatePath("/admin");
  revalidatePath("/admin/health");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/sources");
  revalidatePath("/admin/rankings");
  revalidatePath("/top-pains");
}
