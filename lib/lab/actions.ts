"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  affiliateOffers,
  offerPainMatches,
  painHypotheses,
  programmeLeads,
} from "@/lib/db/schema";
import {
  affiliatePainQuestions,
  campaignPackForHypothesis,
  campaignPackForPain,
} from "@/lib/journeys/campaign";
import { slugify } from "@/lib/ingest/text";
import { researchProgrammes, verifyPainEvidence } from "./evidence";
import { generateHypotheses } from "@/lib/journeys/hypotheses";
import { ensureJourneyTables } from "@/lib/journeys/db";
import { scoreCatalogPains } from "@/lib/journeys/match";
import { getPainPage, listMarketPains } from "@/lib/market/queries";
import { extractProductDna } from "@/lib/product/dna";
import { fetchProductPage } from "@/lib/product/fetch-page";
import { getAdminSession } from "@/lib/session";
import type { ProductDna } from "@/lib/journeys/types";
import { SITE_URL } from "@/lib/site";
import {
  demandScore,
  moneyScoreForOffer,
  performanceScoreForOffer,
  revenuePerVisitor,
  underservedScore,
} from "./scores";

export type OfferInput = {
  name: string;
  salesUrl: string;
  hopLink: string;
  vendor?: string;
  category?: string;
  description: string;
  price?: string;
  commissionType?: string;
  commissionAmount?: string;
  recurring?: boolean;
  gravity?: number | null;
  avgPayout?: string;
  assets?: string;
  countries?: string;
};

export async function importAffiliateOffer(input: OfferInput) {
  await ensureJourneyTables();
  const session = await getAdminSession();
  if (!session) return { error: "Not allowed." };
  if (!input.name.trim() || !input.hopLink.trim() || !input.salesUrl.trim()) {
    return { error: "Name, sales page URL, and your HopLink are required." };
  }
  if (!/^https?:\/\//i.test(input.hopLink.trim())) {
    return { error: "HopLink must be a full https URL from your affiliate account." };
  }
  const id = crypto.randomUUID();
  await db.insert(affiliateOffers).values({
    id,
    userId: session.user.id,
    network: "clickbank",
    name: input.name.trim(),
    salesUrl: input.salesUrl.trim(),
    vendor: input.vendor?.trim() || null,
    category: input.category?.trim() || null,
    description: input.description.trim() || input.name.trim(),
    price: input.price?.trim() || null,
    commissionType: input.commissionType?.trim() || null,
    commissionAmount: input.commissionAmount?.trim() || null,
    recurring: Boolean(input.recurring),
    hopLink: input.hopLink.trim(),
    gravity: input.gravity ?? null,
    avgPayout: input.avgPayout?.trim() || null,
    assets: input.assets?.trim() || null,
    countries: input.countries?.trim() || null,
  });
  revalidatePath("/workspace/lab");
  return { ok: true, id };
}

export async function analyseAffiliateOffer(offerId: string) {
  await ensureJourneyTables();
  const session = await getAdminSession();
  if (!session) return { error: "Not allowed." };
  const [offer] = await db
    .select()
    .from(affiliateOffers)
    .where(
      and(eq(affiliateOffers.id, offerId), eq(affiliateOffers.userId, session.user.id)),
    );
  if (!offer) return { error: "Offer not found." };

  let dna = offer.dna;
  try {
    const page = await fetchProductPage(offer.salesUrl);
    const extracted = await extractProductDna(page);
    dna = JSON.stringify(extracted);
    await db
      .update(affiliateOffers)
      .set({ dna })
      .where(eq(affiliateOffers.id, offer.id));
  } catch {
    dna = JSON.stringify({
      name: offer.name,
      solves: offer.description,
      forWho: offer.category || "Not stated on the page",
      when: "Not stated on the page",
      competingAgainst: "Not stated on the page",
      price: offer.price || "Not stated on the page",
      keywords: offer.name.toLowerCase().split(/\s+/),
      summary: offer.description,
      mechanism: "Not stated on the page",
      outcomes: [],
      audiences: [],
    } satisfies ProductDna);
  }

  const parsed = JSON.parse(dna) as ProductDna;

  const pains = await listMarketPains();
  const ranked = scoreCatalogPains(parsed, pains);
  const catalogMatches = ranked.map(({ pain, score }) => ({ pain, score }));

  const generated = await generateHypotheses(parsed, {
          url: offer.salesUrl,
          title: offer.name,
          description: offer.description,
          siteName: offer.vendor || offer.name,
          headings: [offer.name],
          text: [offer.description, parsed.mechanism, ...(parsed.audiences ?? [])].join(" "),
        });

  await db
    .delete(offerPainMatches)
    .where(
      and(
        eq(offerPainMatches.offerId, offer.id),
        inArray(offerPainMatches.status, ["new", "researching"]),
      ),
    );

  const performance = performanceScoreForOffer({
    gravity: offer.gravity,
    commissionAmount: offer.commissionAmount,
    recurring: offer.recurring,
  });

  for (const row of catalogMatches) {
    const productFit = row.score;
    const money = moneyScoreForOffer({
      productFit,
      pain: row.pain,
      gravity: offer.gravity,
      commissionAmount: offer.commissionAmount,
      recurring: offer.recurring,
    });
    const recommendable = productFit >= 45;
    await db.insert(offerPainMatches).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      offerId: offer.id,
      painId: row.pain.id,
      title: row.pain.title,
      problem: row.pain.problem,
      painScore: demandScore(row.pain),
      moneyScore: money,
      productFit,
      underservedScore: underservedScore(row.pain),
      performanceScore: performance,
      recommendable,
      status: "researching",
      evidenceNote: recommendable
        ? `${row.pain.evidenceCount} marketplace signals. AI did not invent this pain — it already exists in PainGraphs.`
        : "Fit is too weak to recommend this offer against that pain.",
      intentScore: Math.round(row.pain.intentScore),
    });
  }

  const subset = generated.slice(0, 3);
  const evidenced = await Promise.all(
    subset.map(async (item) => ({
      item,
      evidence: await verifyPainEvidence(item.title, item.problem),
    })),
  );

  for (const { item, evidence } of evidenced) {
    const productFit = Math.max(item.matchScore, evidence.strongEnough ? 55 : 20);
    const painScore = evidence.strongEnough
      ? Math.min(95, 40 + evidence.signalCount * 4)
      : 0;
    const money = evidence.strongEnough
      ? moneyScoreForOffer({
          productFit,
          pain: {
            intentScore: Math.min(90, 40 + evidence.signalCount * 3),
            affiliateScore: 55,
            competitionScore: 48,
          },
          gravity: offer.gravity,
          commissionAmount: offer.commissionAmount,
          recurring: offer.recurring,
        })
      : 0;
    await db.insert(offerPainMatches).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      offerId: offer.id,
      title: item.title,
      problem: item.problem,
      painScore,
      moneyScore: money,
      productFit,
      underservedScore: evidence.strongEnough ? 70 : 0,
      performanceScore: performance,
      recommendable: evidence.strongEnough && productFit >= 45,
      status: evidence.strongEnough ? "researching" : "new",
      evidenceNote: evidence.strongEnough
        ? `${evidence.signalCount} public signals. ${evidence.quotes[0] ? `“${evidence.quotes[0]}”` : evidence.note}`
        : `Hypothesis only. ${evidence.note}`,
      intentScore: evidence.strongEnough ? Math.min(90, 40 + evidence.signalCount * 3) : 0,
    });
  }

  revalidatePath("/workspace/lab");
  return { ok: true };
}

export type MatchStatus =
  | "new"
  | "researching"
  | "saved"
  | "page_generated"
  | "published"
  | "getting_traffic"
  | "producing_clicks"
  | "producing_commissions";

export async function setMatchStatus(matchId: string, status: MatchStatus) {
  await ensureJourneyTables();
  const session = await getAdminSession();
  if (!session) return { error: "Not allowed." };
  await db
    .update(offerPainMatches)
    .set({ status })
    .where(
      and(
        eq(offerPainMatches.id, matchId),
        eq(offerPainMatches.userId, session.user.id),
      ),
    );
  revalidatePath("/workspace/lab");
  return { ok: true };
}

export async function buildPainGraph(matchId: string) {
  await ensureJourneyTables();
  const session = await getAdminSession();
  if (!session) return { error: "Not allowed." };
  const [row] = await db
    .select({ match: offerPainMatches, offer: affiliateOffers })
    .from(offerPainMatches)
    .innerJoin(affiliateOffers, eq(offerPainMatches.offerId, affiliateOffers.id))
    .where(
      and(
        eq(offerPainMatches.id, matchId),
        eq(offerPainMatches.userId, session.user.id),
      ),
    );
  if (!row) return { error: "Match not found." };

  const reasons = [
    `Strong match for “${row.match.title}”.`,
    row.match.evidenceNote || "Evidence is stored against this Product × Pain pair.",
    "The tracking URL is the HopLink you imported — PainGraphs does not invent affiliate links.",
  ];
  const affiliate = {
    name: row.offer.name,
    url: row.offer.hopLink,
    reasons,
  };

  if (row.match.painId) {
    const pains = await listMarketPains();
    const pain = pains.find((item) => item.id === row.match.painId);
    if (!pain) return { error: "Catalog pain not found." };
    const page = await getPainPage(
      pain.category.slug,
      pain.cluster.slug,
      pain.slug,
    );
    if (!page) return { error: "Catalog page not found." };
    const pack = campaignPackForPain(page, pain.href);
    pack.affiliate = affiliate;
    await db
      .update(offerPainMatches)
      .set({
        status: "page_generated",
        draftSlug: pain.href,
        packJson: JSON.stringify(pack),
      })
      .where(eq(offerPainMatches.id, matchId));
    revalidatePath("/workspace/lab");
    return { ok: true, href: pain.href, published: false };
  }

  const dna = parseOfferDna(row.offer.dna, row.offer.name, row.offer.description);
  const questions = affiliatePainQuestions(row.match.title);
  const hypId = row.match.hypothesisId || crypto.randomUUID();
  const slug =
    row.match.draftSlug?.replace(/^\/test\//, "") ||
    `${slugify(row.match.title)}-${hypId.slice(0, 6)}`;
  const item = {
    title: row.match.title,
    h1: row.match.title,
    problem: row.match.problem,
    audience: dna.audiences?.[0] || dna.forWho,
    analysis:
      row.match.evidenceNote ||
      `Draft built from imported offer “${row.offer.name}”. Not published until you choose to.`,
    unmetNeed:
      "This page should only recommend the offer if the questionnaire confirms a genuine fit.",
    matchScore: row.match.productFit,
    origin: "inside-out" as const,
    customerLanguage: [],
    questions,
  };
  const pack = campaignPackForHypothesis(item, dna, `/test/${slug}`);
  pack.affiliate = affiliate;
  pack.meta.destinationUrl = `${SITE_URL}/test/${slug}`;
  pack.google.destinationUrl = pack.meta.destinationUrl;
  pack.meta.trackingUrl = `${pack.meta.destinationUrl}?utm_source=meta&utm_medium=paid&utm_campaign=${slug}`;

  if (row.match.hypothesisId) {
    await db
      .update(painHypotheses)
      .set({
        title: item.title,
        h1: item.h1,
        problem: item.problem,
        audience: item.audience,
        analysis: item.analysis,
        unmetNeed: item.unmetNeed,
        questions: JSON.stringify(questions),
        campaignPack: JSON.stringify(pack),
        matchScore: row.match.productFit,
        isPublic: false,
        status: "hypothesis",
      })
      .where(eq(painHypotheses.id, hypId));
  } else {
    await db.insert(painHypotheses).values({
      id: hypId,
      scanId: null,
      userId: session.user.id,
      catalogPainId: null,
      slug,
      title: item.title,
      h1: item.h1,
      problem: item.problem,
      audience: item.audience,
      analysis: item.analysis,
      unmetNeed: item.unmetNeed,
      questions: JSON.stringify(questions),
      campaignPack: JSON.stringify(pack),
      status: "hypothesis",
      origin: "inside-out",
      matchScore: row.match.productFit,
      isPublic: false,
    });
  }

  await db
    .update(offerPainMatches)
    .set({
      status: "page_generated",
      hypothesisId: hypId,
      draftSlug: `/test/${slug}`,
      packJson: JSON.stringify(pack),
    })
    .where(eq(offerPainMatches.id, matchId));
  revalidatePath("/workspace/lab");
  return { ok: true, href: `/test/${slug}`, published: false };
}

export async function publishMatch(matchId: string) {
  await ensureJourneyTables();
  const session = await getAdminSession();
  if (!session) return { error: "Not allowed." };
  const [match] = await db
    .select()
    .from(offerPainMatches)
    .where(
      and(
        eq(offerPainMatches.id, matchId),
        eq(offerPainMatches.userId, session.user.id),
      ),
    );
  if (!match) return { error: "Match not found." };
  if (match.hypothesisId) {
    await db
      .update(painHypotheses)
      .set({ isPublic: true, status: "testing" })
      .where(
        and(
          eq(painHypotheses.id, match.hypothesisId),
          eq(painHypotheses.userId, session.user.id),
        ),
      );
  }
  await db
    .update(offerPainMatches)
    .set({ status: "published" })
    .where(eq(offerPainMatches.id, matchId));
  revalidatePath("/workspace/lab");
  if (match.draftSlug) revalidatePath(match.draftSlug);
  return { ok: true, href: match.draftSlug };
}

export async function recordMatchPerformance(input: {
  matchId: string;
  visitors: number;
  quizCompleted: number;
  affiliateClicks: number;
  sales: number;
  commissionPounds: number;
}) {
  await ensureJourneyTables();
  const session = await getAdminSession();
  if (!session) return { error: "Not allowed." };
  const visitors = Math.max(0, Math.round(input.visitors));
  const clicks = Math.max(0, Math.round(input.affiliateClicks));
  const sales = Math.max(0, Math.round(input.sales));
  const commissionPence = Math.max(0, Math.round(input.commissionPounds * 100));
  const status: MatchStatus =
    sales > 0
      ? "producing_commissions"
      : clicks > 0
        ? "producing_clicks"
        : visitors > 0
          ? "getting_traffic"
          : "published";
  await db
    .update(offerPainMatches)
    .set({
      visitors,
      quizCompleted: Math.max(0, Math.round(input.quizCompleted)),
      affiliateClicks: clicks,
      sales,
      commissionPence,
      status,
    })
    .where(
      and(
        eq(offerPainMatches.id, input.matchId),
        eq(offerPainMatches.userId, session.user.id),
      ),
    );
  revalidatePath("/workspace/lab");
  const rpv = revenuePerVisitor(commissionPence, visitors);
  return {
    ok: true,
    rpv,
    note:
      rpv >= 0.5
        ? "High revenue per visitor. Put more SEO and ad budget here."
        : visitors >= 200 && rpv < 0.2
          ? "Traffic arrived, monetization is weak. Treat as a loser until the offer or the page changes."
          : "Recorded. Keep pasting results as traffic lands.",
  };
}

export async function findProgrammesForPain(input: {
  title: string;
  problem: string;
  painId?: string;
}) {
  await ensureJourneyTables();
  const session = await getAdminSession();
  if (!session) return { error: "Not allowed.", programmes: [] };
  const title = input.title.trim();
  if (!title) return { error: "Name the pain first.", programmes: [] };
  const programmes = await researchProgrammes(title, input.problem.trim());
  for (const row of programmes) {
    await db.insert(programmeLeads).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      painId: input.painId || null,
      painTitle: title,
      name: row.name,
      network: row.network,
      commission: row.commission,
      cookie: row.cookie,
      price: row.price,
      fit: row.fit,
      evidence: row.evidence,
      sources: JSON.stringify(row.sources),
    });
  }
  revalidatePath("/workspace/lab");
  return { ok: true, programmes };
}

export async function listLab() {
  await ensureJourneyTables();
  const session = await getAdminSession();
  if (!session) return null;
  const offers = await db
    .select()
    .from(affiliateOffers)
    .where(eq(affiliateOffers.userId, session.user.id))
    .orderBy(desc(affiliateOffers.createdAt));
  const matches = await db
    .select()
    .from(offerPainMatches)
    .where(eq(offerPainMatches.userId, session.user.id))
    .orderBy(desc(offerPainMatches.moneyScore));
  const leads = await db
    .select()
    .from(programmeLeads)
    .where(eq(programmeLeads.userId, session.user.id))
    .orderBy(desc(programmeLeads.createdAt));
  const pains = await listMarketPains();
  const visitors = matches.reduce((sum, row) => sum + row.visitors, 0);
  const clicks = matches.reduce((sum, row) => sum + row.affiliateClicks, 0);
  const sales = matches.reduce((sum, row) => sum + row.sales, 0);
  const commissionPence = matches.reduce((sum, row) => sum + row.commissionPence, 0);
  const top = [...matches].sort((a, b) => b.commissionPence - a.commissionPence)[0];
  return {
    offers,
    matches,
    leads,
    pains,
    stats: {
      visitors,
      clicks,
      sales,
      commissionPence,
      rpv: revenuePerVisitor(commissionPence, visitors),
      topPain: top?.title ?? null,
    },
  };
}

function parseOfferDna(
  raw: string | null,
  name: string,
  description: string,
): ProductDna {
  if (raw) {
    try {
      return JSON.parse(raw) as ProductDna;
    } catch {
      /* fall through */
    }
  }
  return {
    name,
    solves: description,
    forWho: "Not stated on the page",
    when: "Not stated on the page",
    competingAgainst: "Not stated on the page",
    price: "Not stated on the page",
    keywords: name.toLowerCase().split(/\s+/),
    summary: description,
  };
}

export async function findOffersForPain(painId: string) {
  await ensureJourneyTables();
  const session = await getAdminSession();
  if (!session) return [];
  return db
    .select({
      match: offerPainMatches,
      offer: affiliateOffers,
    })
    .from(offerPainMatches)
    .innerJoin(affiliateOffers, eq(offerPainMatches.offerId, affiliateOffers.id))
    .where(
      and(
        eq(offerPainMatches.userId, session.user.id),
        eq(offerPainMatches.painId, painId),
        eq(offerPainMatches.recommendable, true),
      ),
    )
    .orderBy(desc(offerPainMatches.moneyScore));
}
