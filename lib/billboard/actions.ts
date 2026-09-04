"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { billboardFavourites } from "@/lib/db/schema";
import { ingestBillboard } from "@/lib/billboard/ingest";
import { getAdminSession, getSession, requireSession } from "@/lib/session";
import { ensureBillboardTables } from "./db";
import { prepareBillboardTopic } from "./prepare";

export async function toggleFavourite(topicId: string) {
  const session = await requireSession();
  await ensureBillboardTables();
  const [found] = await db
    .select()
    .from(billboardFavourites)
    .where(
      and(
        eq(billboardFavourites.userId, session.user.id),
        eq(billboardFavourites.topicId, topicId),
      ),
    );
  if (found) {
    await db.delete(billboardFavourites).where(eq(billboardFavourites.id, found.id));
  } else {
    await db.insert(billboardFavourites).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      topicId,
    });
  }
  revalidatePath("/billboard");
  revalidatePath("/billboard/favourites");
  return { ok: true };
}

export async function listMyFavouriteIds() {
  const session = await getSession();
  if (!session) return [];
  await ensureBillboardTables();
  const rows = await db
    .select({ topicId: billboardFavourites.topicId })
    .from(billboardFavourites)
    .where(eq(billboardFavourites.userId, session.user.id));
  return rows.map((row) => row.topicId);
}

export async function prepareFavourite(topicId: string) {
  await requireSession();
  const result = await prepareBillboardTopic(topicId);
  revalidatePath("/billboard");
  revalidatePath("/billboard/favourites");
  return result;
}

export async function refreshBillboard() {
  const admin = await getAdminSession();
  if (!admin) return { error: "Admin only." };
  const result = await ingestBillboard();
  revalidatePath("/billboard");
  revalidatePath("/billboard/favourites");
  if (result.updated === 0) {
    return { error: result.skipped === "no-openai-key" ? "OpenAI is not configured." : "Chart did not update. Yesterday's ranks stay." };
  }
  return { ok: true, updated: result.updated };
}
