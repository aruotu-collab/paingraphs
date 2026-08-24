"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedMarkets } from "@/lib/db/schema";
import { getSession, requireSession } from "@/lib/session";

export async function saveMarket(query: string) {
  const session = await requireSession();
  const trimmed = query.trim();
  if (!trimmed) return { error: "Enter a market first." };

  await db.insert(savedMarkets).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    query: trimmed,
  });

  revalidatePath("/opportunities");
  revalidatePath("/radar");
  return { ok: true };
}

export async function listSavedMarkets() {
  const session = await getSession();
  if (!session) return [];
  return db
    .select()
    .from(savedMarkets)
    .where(eq(savedMarkets.userId, session.user.id))
    .orderBy(desc(savedMarkets.createdAt));
}
