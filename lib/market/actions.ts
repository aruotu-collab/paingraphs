"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessments, pains, watchlists } from "@/lib/db/schema";
import { getSession, requireSession } from "@/lib/session";

export async function saveAssessment(formData: FormData) {
  const painId = String(formData.get("painId") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const priorities = String(formData.get("priorities") || "{}");
  const consentReport = formData.get("consentReport") === "on";
  const consentMarketing = formData.get("consentMarketing") === "on";
  const consentSensitive = formData.get("consentSensitive") === "on";

  if (!painId) return { error: "Missing pain." };
  if (consentReport && !email) return { error: "Add an email to receive your PainGraph." };
  if (consentMarketing && !consentReport) {
    return { error: "Marketing updates need the same email as your PainGraph." };
  }

  const [pain] = await db.select({ sensitive: pains.sensitive }).from(pains).where(eq(pains.id, painId));
  if (pain?.sensitive && (consentReport || consentMarketing) && !consentSensitive) {
    return { error: "Health-related PainGraphs need explicit consent before we email you." };
  }

  await db.insert(assessments).values({
    id: crypto.randomUUID(),
    painId,
    priorities,
    email: email || null,
    consentReport,
    consentMarketing,
    consentSensitive,
  });

  return { ok: true };
}

export async function saveSignedInAssessment(input: {
  painId: string;
  priorities: string;
  consentMarketing: boolean;
  consentSensitive: boolean;
}) {
  const session = await getSession();
  if (!session) return { error: "Sign in first." };
  if (!input.painId) return { error: "Missing pain." };

  const [pain] = await db
    .select({ sensitive: pains.sensitive })
    .from(pains)
    .where(eq(pains.id, input.painId));
  if (!pain) return { error: "Missing pain." };

  await db.insert(assessments).values({
    id: crypto.randomUUID(),
    painId: input.painId,
    priorities: input.priorities,
    email: session.user.email,
    consentReport: true,
    consentMarketing: input.consentMarketing,
    consentSensitive: pain.sensitive ? input.consentSensitive : false,
  });

  return { ok: true };
}

export async function toggleWatch(painId: string) {
  const session = await requireSession();
  const existing = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, session.user.id));
  const found = existing.find((row) => row.painId === painId);
  if (found) {
    await db.delete(watchlists).where(eq(watchlists.id, found.id));
  } else {
    await db.insert(watchlists).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      painId,
    });
  }
  revalidatePath("/watchlist");
  return { ok: true };
}

export async function listWatchIds() {
  const session = await getSession();
  if (!session) return [];
  const rows = await db
    .select({ painId: watchlists.painId })
    .from(watchlists)
    .where(eq(watchlists.userId, session.user.id));
  return rows.map((row) => row.painId);
}
