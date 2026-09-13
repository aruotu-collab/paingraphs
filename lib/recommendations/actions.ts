"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { pains } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import type { Priorities } from "@/lib/paingraph/types";
import { upsertSavedPriorities } from "./store";

export async function saveRecommendationPreferences(
  painId: string,
  slugs: string[],
  priorities: Priorities,
  href?: string,
) {
  const session = await requireSession("/");
  if (!painId || slugs.length === 0) return;
  const [pain] = await db.select({ id: pains.id }).from(pains).where(eq(pains.id, painId)).limit(1);
  if (!pain) return;
  await upsertSavedPriorities({
    userId: session.user.id,
    painId,
    slugs: slugs.slice(0, 12),
    priorities,
  });
  if (href) revalidatePath(href);
}
