"use server";

import { count, desc, eq, lt } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
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
import { ensureJourneyTables } from "@/lib/journeys/db";
import { ensureAdminTables } from "./db";

async function readyAdminDb() {
  try {
    await ensureJourneyTables();
  } catch (error) {
    console.warn("Journey tables:", error);
  }
  try {
    await ensureAdminTables();
  } catch (error) {
    console.warn("Admin tables:", error);
  }
}

export async function purgeOldVisits() {
  const admin = await getAdminSession();
  if (!admin) return { error: "Not allowed." };
  await readyAdminDb();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  await db.delete(pageVisits).where(lt(pageVisits.createdAt, cutoff));
  revalidatePath("/admin/visits");
  return { ok: true };
}

export async function loadAdminOverview() {
  const admin = await getAdminSession();
  if (!admin) return null;
  await readyAdminDb();
  const [users, assess, watch, hyps, scans, recentUsers] = await Promise.all([
    countOrZero(user),
    countOrZero(assessments),
    countOrZero(watchlists),
    countOrZero(painHypotheses),
    countOrZero(productScans),
    db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(8)
      .catch(() => []),
  ]);
  return {
    users,
    assessments: assess,
    watchlists: watch,
    hypotheses: hyps,
    scans,
    recentUsers,
  };
}

async function countOrZero(table: SQLiteTable) {
  try {
    const [row] = await db.select({ n: count() }).from(table);
    return Number(row?.n ?? 0);
  } catch {
    return 0;
  }
}

export async function loadAdminUsers() {
  const admin = await getAdminSession();
  if (!admin) return [];
  await readyAdminDb();
  const people = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .catch(() => []);
  const sessions = await db
    .select({
      userId: session.userId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
    })
    .from(session)
    .orderBy(desc(session.updatedAt))
    .catch(() => []);
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
  await readyAdminDb();
  try {
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
  } catch (error) {
    console.warn("Admin demand query failed:", error);
    return { quiz: [], watching: [], answers: [], scans: [] };
  }
}
