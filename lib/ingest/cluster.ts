import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  industries,
  niches,
  countries,
  personas,
  sources,
  problems,
  problemLinks,
  problemScores,
  painSignals,
  workarounds,
  rawDocuments,
} from "@/lib/db/schema";
import { scoreSignals } from "./score";
import {
  CLUSTER_TEMPLATES,
  COUNTRIES,
  INDUSTRIES,
  NICHES,
  PERSONAS,
  SOURCES,
  countryIdFromHint,
  type ClusterTemplate,
} from "./taxonomy";
import { overlap, slugify } from "./text";
import type { ExtractedSignal } from "./types";

export async function ensureTaxonomy() {
  await db.insert(industries).values([...INDUSTRIES]).onConflictDoNothing();
  await db.insert(niches).values([...NICHES]).onConflictDoNothing();
  await db.insert(countries).values([...COUNTRIES]).onConflictDoNothing();
  await db.insert(personas).values([...PERSONAS]).onConflictDoNothing();
  await db.insert(sources).values([...SOURCES]).onConflictDoNothing();
}

function templateBySlug(slug: string | null): ClusterTemplate | undefined {
  if (!slug) return undefined;
  return CLUSTER_TEMPLATES.find((item) => item.slug === slug);
}

export async function assignProblem(extracted: ExtractedSignal) {
  const template = templateBySlug(extracted.templateSlug);
  const desiredSlug = template?.slug ?? slugify(extracted.problemTitle);
  const desiredTitle = template?.title ?? extracted.problemTitle;
  const desiredSummary = template?.summary ?? extracted.summary;

  const existing = await db.select().from(problems);
  const exact = existing.find((problem) => problem.slug === desiredSlug);
  const similar = existing.find(
    (problem) => overlap(problem.title, desiredTitle) >= 0.55,
  );
  const problem = exact ?? similar;

  if (problem) {
    await db
      .update(problems)
      .set({ updatedAt: new Date(), summary: problem.summary ?? desiredSummary })
      .where(eq(problems.id, problem.id));
    await ensureLink(problem.id, extracted, template);
    await ensureWorkaround(problem.id, extracted.workaround);
    return problem.id;
  }

  const id = crypto.randomUUID();
  await db.insert(problems).values({
    id,
    slug: uniqueSlug(
      desiredSlug,
      existing.map((item) => item.slug),
    ),
    title: desiredTitle,
    summary: desiredSummary,
  });
  await ensureLink(id, extracted, template);
  await ensureWorkaround(id, extracted.workaround);
  return id;
}

function uniqueSlug(base: string, taken: string[]) {
  if (!taken.includes(base)) return base;
  let i = 2;
  while (taken.includes(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

async function ensureLink(
  problemId: string,
  extracted: ExtractedSignal,
  template?: ClusterTemplate,
) {
  const [existing] = await db
    .select()
    .from(problemLinks)
    .where(eq(problemLinks.problemId, problemId))
    .limit(1);
  if (existing) return;

  const industryId =
    template?.industryId ??
    INDUSTRIES.find((item) => item.name === extracted.industryHint)?.id ??
    "industry-software";
  const nicheId =
    template?.nicheId ??
    NICHES.find((item) => item.name === extracted.nicheHint)?.id ??
    "niche-founders";
  const personaId =
    template?.personaId ??
    PERSONAS.find((item) => item.name === extracted.personaGuess)?.id ??
    "persona-founder";
  const countryId = template?.countryId ?? countryIdFromHint(extracted.countryHint);

  await db.insert(problemLinks).values({
    id: crypto.randomUUID(),
    problemId,
    industryId,
    nicheId,
    personaId,
    countryId,
  });
}

async function ensureWorkaround(problemId: string, name: string | null) {
  if (!name) return;
  const existing = await db
    .select()
    .from(workarounds)
    .where(and(eq(workarounds.problemId, problemId), eq(workarounds.name, name)))
    .limit(1);
  if (existing.length) return;
  await db.insert(workarounds).values({
    id: crypto.randomUUID(),
    problemId,
    name,
    description: "Named in live evidence as a current workaround.",
  });
}

export async function rescoreProblems() {
  const allProblems = await db.select().from(problems);
  for (const problem of allProblems) {
    const signals = await db
      .select({
        intensity: painSignals.intensity,
        purchaseIntent: painSignals.purchaseIntent,
        publishedAt: rawDocuments.publishedAt,
        quote: painSignals.quote,
      })
      .from(painSignals)
      .innerJoin(rawDocuments, eq(painSignals.documentId, rawDocuments.id))
      .where(eq(painSignals.problemId, problem.id));
    if (signals.length === 0) continue;
    const workaroundRows = await db
      .select()
      .from(workarounds)
      .where(eq(workarounds.problemId, problem.id));
    const scored = scoreSignals(signals, workaroundRows.length);
    await db.insert(problemScores).values({
      id: crypto.randomUUID(),
      problemId: problem.id,
      ...scored,
    });
  }
}
