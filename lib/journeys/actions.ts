"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  affiliateOffers,
  hypothesisAnswers,
  hypothesisMetrics,
  offerPainMatches,
  painHypotheses,
  productScans,
} from "@/lib/db/schema";
import { slugify } from "@/lib/ingest/text";
import { getPainPage, listMarketPains } from "@/lib/market/queries";
import { getSession } from "@/lib/session";
import { ensureJourneyTables } from "./db";
import { generateHypotheses } from "./hypotheses";
import { catalogToHypothesis, scoreCatalogPains } from "./match";
import type { CampaignPack, ProductScanView } from "./types";
import { extractProductDna } from "@/lib/product/dna";
import { fetchProductPage } from "@/lib/product/fetch-page";

export async function scanProductUrl(rawUrl: string): Promise<
  { ok: true; scan: ProductScanView } | { ok: false; error: string }
> {
  try {
    await ensureJourneyTables();
    const session = await getSession();
    if (session) {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const existing = await db
        .select({ createdAt: productScans.createdAt })
        .from(productScans)
        .where(eq(productScans.userId, session.user.id));
      const used = existing.filter((row) => row.createdAt.getTime() > monthAgo).length;
      if (used >= 5) {
        return {
          ok: false,
          error:
            "This account has used this month’s 5 product analyses. Open Pricing if you need more, or work from the scans you already have.",
        };
      }
    }

    const page = await fetchProductPage(rawUrl);
    const dna = await extractProductDna(page);
    const pains = await listMarketPains();
    const ranked = scoreCatalogPains(dna, pains);
    const catalog = await Promise.all(
      ranked.map(async ({ pain, score }) => {
        const full = await getPainPage(
          pain.category.slug,
          pain.cluster.slug,
          pain.slug,
        );
        return catalogToHypothesis(pain, score, full);
      }),
    );
    const generated =
      catalog.length >= 3 ? [] : await generateHypotheses(dna, page);
    const merged = [...catalog, ...generated].slice(0, 7);
    if (merged.length === 0) {
      return { ok: false, error: "Could not read a usable pain from that page." };
    }

    const signedIn = Boolean(session);
    const items = signedIn
      ? merged
      : merged.map((item, index) => (index === 0 ? item : { ...item, locked: true }));

    if (!session) {
      return {
        ok: true,
        scan: { scanId: null, signedIn: false, url: page.url, dna, items },
      };
    }

    const scanId = crypto.randomUUID();
    await db.insert(productScans).values({
      id: scanId,
      userId: session.user.id,
      url: page.url,
      name: dna.name,
      dna: JSON.stringify(dna),
    });
    const stored = await Promise.all(
      merged.map(async (item) => {
        const id = crypto.randomUUID();
        const slug = uniqueSlug(item.title, id);
        const pack = item.campaignPack;
        pack.meta.destinationUrl = pack.meta.destinationUrl.includes("/test/")
          ? pack.meta.destinationUrl
          : `${pack.meta.destinationUrl}`;
        await db.insert(painHypotheses).values({
          id,
          scanId,
          userId: session.user.id,
          catalogPainId: item.catalogHref ? catalogPainId(pains, item.catalogHref) : null,
          slug,
          title: item.title,
          h1: item.h1,
          problem: item.problem,
          audience: item.audience,
          analysis: item.analysis,
          unmetNeed: item.unmetNeed,
          questions: JSON.stringify(item.questions),
          campaignPack: JSON.stringify(pack),
          status: "hypothesis",
          origin: item.origin,
          matchScore: item.matchScore,
          isPublic: false,
        });
        return { ...item, id, slug };
      }),
    );

    return {
      ok: true,
      scan: { scanId, signedIn: true, url: page.url, dna, items: stored },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not analyse that URL.";
    return { ok: false, error: message };
  }
}

export async function publishHypothesisPage(hypothesisId: string) {
  await ensureJourneyTables();
  const session = await getSession();
  if (!session) return { error: "Sign in first." };
  const [row] = await db
    .select()
    .from(painHypotheses)
    .where(
      and(
        eq(painHypotheses.id, hypothesisId),
        eq(painHypotheses.userId, session.user.id),
      ),
    );
  if (!row) return { error: "Hypothesis not found." };
  const pack = JSON.parse(row.campaignPack) as CampaignPack;
  const path = `/test/${row.slug}`;
  pack.meta.destinationUrl = pack.meta.destinationUrl.replace(/\/test\/[^/?]+/, path);
  if (!pack.meta.destinationUrl.includes("/test/")) {
    pack.google.destinationUrl = `${pack.google.destinationUrl.split("?")[0]}`;
  }
  pack.google.destinationUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://paingraphs.com"}${path}`;
  pack.meta.destinationUrl = pack.google.destinationUrl;
  pack.meta.trackingUrl = `${pack.google.destinationUrl}?utm_source=meta&utm_medium=paid&utm_campaign=${row.slug}`;
  await db
    .update(painHypotheses)
    .set({
      isPublic: true,
      status: "testing",
      campaignPack: JSON.stringify(pack),
    })
    .where(eq(painHypotheses.id, hypothesisId));
  revalidatePath("/workspace");
  revalidatePath("/lab");
  revalidatePath(path);
  return { ok: true, href: path };
}

export async function saveHypothesisMetrics(input: {
  hypothesisId: string;
  impressions: number;
  clicks: number;
  visitors: number;
  quizStarts: number;
  quizCompleted: number;
  optIns: number;
  hasProblem: number;
  considerBuy: number;
  waitlist: number;
  purchases: number;
  spendPence: number;
  notes: string;
}) {
  await ensureJourneyTables();
  const session = await getSession();
  if (!session) return { error: "Sign in first." };
  const [row] = await db
    .select({ id: painHypotheses.id })
    .from(painHypotheses)
    .where(
      and(
        eq(painHypotheses.id, input.hypothesisId),
        eq(painHypotheses.userId, session.user.id),
      ),
    );
  if (!row) return { error: "Hypothesis not found." };
  await db.insert(hypothesisMetrics).values({
    id: crypto.randomUUID(),
    hypothesisId: input.hypothesisId,
    impressions: input.impressions,
    clicks: input.clicks,
    visitors: input.visitors,
    quizStarts: input.quizStarts,
    quizCompleted: input.quizCompleted,
    optIns: input.optIns,
    hasProblem: input.hasProblem,
    considerBuy: input.considerBuy,
    waitlist: input.waitlist,
    purchases: input.purchases,
    spendPence: input.spendPence,
    notes: input.notes || null,
  });
  await db
    .update(painHypotheses)
    .set({ status: confidenceStatus(input) })
    .where(eq(painHypotheses.id, input.hypothesisId));
  revalidatePath("/workspace");
  return { ok: true, analysis: interpretMetrics(input) };
}

export async function submitHypothesisQuiz(input: {
  slug: string;
  answers: Record<string, string>;
  email?: string;
}) {
  await ensureJourneyTables();
  const [row] = await db
    .select()
    .from(painHypotheses)
    .where(eq(painHypotheses.slug, input.slug));
  if (!row) return { error: "This test page is not live." };
  if (!row.isPublic) {
    const session = await getSession();
    if (!session || session.user.id !== row.userId) {
      return { error: "This test page is not live." };
    }
  }
  const medical = input.answers.medical === "yes";
  const hasProblem =
    !medical &&
    (input.answers.uses === "yes" ||
      input.answers.annoy === "4" ||
      input.answers.annoy === "5" ||
      input.answers.stopped === "yes");
  await db.insert(hypothesisAnswers).values({
    id: crypto.randomUUID(),
    hypothesisId: row.id,
    answers: JSON.stringify(input.answers),
    hasProblem,
    email: input.email?.trim().toLowerCase() || null,
  });
  const [linked] = await db
    .select({
      match: offerPainMatches,
      offer: affiliateOffers,
    })
    .from(offerPainMatches)
    .innerJoin(affiliateOffers, eq(offerPainMatches.offerId, affiliateOffers.id))
    .where(eq(offerPainMatches.hypothesisId, row.id));
  const pack = JSON.parse(row.campaignPack) as CampaignPack;
  const honest =
    linked &&
    linked.match.recommendable &&
    linked.match.productFit >= 55 &&
    !medical &&
    hasProblem;
  revalidatePath(`/test/${input.slug}`);
  return {
    ok: true,
    hasProblem,
    waitlist: hasProblem && !honest,
    mismatch: medical,
    recommendation: honest
      ? {
          name: linked.offer.name,
          hopLink: linked.offer.hopLink,
          reasons: pack.affiliate?.reasons ?? [
            `Match for ${row.title}.`,
            linked.match.evidenceNote || "Fit was scored before this page was built.",
            "This is the HopLink you imported — not an invented URL.",
          ],
        }
      : null,
  };
}

export async function listWorkspace() {
  await ensureJourneyTables();
  const session = await getSession();
  if (!session) return null;
  const scans = await db
    .select()
    .from(productScans)
    .where(eq(productScans.userId, session.user.id))
    .orderBy(desc(productScans.createdAt));
  const hyps = await db
    .select()
    .from(painHypotheses)
    .where(eq(painHypotheses.userId, session.user.id))
    .orderBy(desc(painHypotheses.createdAt));
  return { scans, hyps };
}

export async function getPublicHypothesis(slug: string) {
  await ensureJourneyTables();
  const [row] = await db
    .select()
    .from(painHypotheses)
    .where(eq(painHypotheses.slug, slug));
  if (!row) return null;
  if (!row.isPublic) {
    const session = await getSession();
    if (!session || session.user.id !== row.userId) return null;
  }
  const answers = await db
    .select()
    .from(hypothesisAnswers)
    .where(eq(hypothesisAnswers.hypothesisId, row.id));
  return { row, answers, draft: !row.isPublic };
}

export async function listPublicTests() {
  await ensureJourneyTables();
  return db
    .select()
    .from(painHypotheses)
    .where(eq(painHypotheses.isPublic, true))
    .orderBy(desc(painHypotheses.createdAt));
}

function interpretMetrics(input: {
  visitors: number;
  clicks: number;
  quizCompleted: number;
  hasProblem: number;
}) {
  if (input.visitors < 50) {
    return "Too little data. Keep the test running until about 250 landing visitors before you kill an angle.";
  }
  const quizRate = input.visitors > 0 ? input.quizCompleted / input.visitors : 0;
  const painRate =
    input.quizCompleted > 0 ? input.hasProblem / input.quizCompleted : 0;
  if (quizRate < 0.08) {
    return "People click, but few start the questionnaire. Change the ad promise or the first screen — the pain may not match the creative.";
  }
  if (painRate >= 0.4) {
    return "Pain A looks commercially meaningful. Keep this angle and pause weaker hypotheses.";
  }
  if (painRate < 0.15) {
    return "Clicks arrived, but few people say the problem actually affects them. Stop this angle.";
  }
  return "Early signal. Keep spending at the test budget and compare quiz-complete rate against your other hypotheses.";
}

function uniqueSlug(title: string, id: string) {
  return `${slugify(title)}-${id.slice(0, 6)}`;
}

function catalogPainId(
  pains: Awaited<ReturnType<typeof listMarketPains>>,
  href: string,
) {
  return pains.find((pain) => pain.href === href)?.id ?? null;
}

function confidenceStatus(input: {
  visitors: number;
  quizCompleted: number;
  hasProblem: number;
}) {
  if (input.visitors < 50) return "testing";
  const rate =
    input.quizCompleted > 0 ? input.hasProblem / input.quizCompleted : 0;
  if (input.quizCompleted >= 200 && rate >= 0.4) return "behaviourally_validated";
  if (rate < 0.15 && input.quizCompleted >= 80) return "hypothesis";
  return "testing";
}
