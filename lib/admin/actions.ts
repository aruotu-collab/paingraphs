"use server";

import { count, desc, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  assessments,
  hypothesisAnswers,
  painHypotheses,
  pageVisits,
  pains,
  productScans,
  session,
  user,
  watchlists,
} from "@/lib/db/schema";
import { getAdminSession } from "@/lib/session";
import { ensureAdminTables } from "./db";

export async function purgeOldVisits() {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not allowed." };
  await ensureAdminTables();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await db.delete(pageVisits).where(lt(pageVisits.createdAt, cutoff));
  revalidatePath("/admin/visits");
  return { ok: true };
}

export async function loadAdminOverview() {
  const admin = await getAdminSession();
  if (!admin) return null;
  const [users] = await db.select({ n: count() }).from(user);
  const [assess] = await db.select({ n: count() }).from(assessments);
  const [watch] = await db.select({ n: count() }).from(watchlists);
  const [hyps] = await db.select({ n: count() }).from(painHypotheses);
  const [scans] = await db.select({ n: count() }).from(productScans);
  const recentUsers = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(8);
  return {
    users: Number(users?.n ?? 0),
    assessments: Number(assess?.n ?? 0),
    watchlists: Number(watch?.n ?? 0),
    hypotheses: Number(hyps?.n ?? 0),
    scans: Number(scans?.n ?? 0),
    recentUsers,
  };
}

export async function loadAdminUsers() {
  const admin = await getAdminSession();
  if (!admin) return [];
  const people = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
  const sessions = await db
    .select({
      userId: session.userId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
    })
    .from(session)
    .orderBy(desc(session.updatedAt));
  return people.map((person) => {
    const theirs = sessions.filter((row) => row.userId === person.id);
    const latest = theirs[0];
    return {
      ...person,
      sessionCount: theirs.length,
      lastIp: latest?.ipAddress ?? null,
      lastAgent: latest?.userAgent ?? null,
      lastSeen: latest?.updatedAt ?? null,
    };
  });
}

export async function loadAdminDemand() {
  const admin = await getAdminSession();
  if (!admin) return null;
  const quiz = await db
    .select({
      id: assessments.id,
      email: assessments.email,
      painId: assessments.painId,
      createdAt: assessments.createdAt,
      consentMarketing: assessments.consentMarketing,
      title: pains.title,
    })
    .from(assessments)
    .leftJoin(pains, eq(assessments.painId, pains.id))
    .orderBy(desc(assessments.createdAt))
    .limit(80);
  const watching = await db
    .select({
      id: watchlists.id,
      userId: watchlists.userId,
      createdAt: watchlists.createdAt,
      title: pains.title,
      email: user.email,
    })
    .from(watchlists)
    .leftJoin(pains, eq(watchlists.painId, pains.id))
    .leftJoin(user, eq(watchlists.userId, user.id))
    .orderBy(desc(watchlists.createdAt))
    .limit(80);
  const answers = await db
    .select({
      id: hypothesisAnswers.id,
      email: hypothesisAnswers.email,
      hasProblem: hypothesisAnswers.hasProblem,
      createdAt: hypothesisAnswers.createdAt,
      title: painHypotheses.title,
    })
    .from(hypothesisAnswers)
    .leftJoin(painHypotheses, eq(hypothesisAnswers.hypothesisId, painHypotheses.id))
    .orderBy(desc(hypothesisAnswers.createdAt))
    .limit(80);
  const scans = await db
    .select()
    .from(productScans)
    .orderBy(desc(productScans.createdAt))
    .limit(40);
  return { quiz, watching, answers, scans };
}
