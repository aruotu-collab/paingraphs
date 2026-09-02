import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalyseOfferButton } from "@/components/analyse-offer-button";
import { CampaignPackView } from "@/components/campaign-pack";
import {
  BuildPainGraphButton,
  MatchPerformanceForm,
  PublishMatchButton,
  SaveMatchButton,
} from "@/components/lab-match-actions";
import { OfferImportForm } from "@/components/offer-import-form";
import { OpportunityFinder } from "@/components/opportunity-finder";
import { PainCard } from "@/components/pain-card";
import { listLab } from "@/lib/lab/actions";
import { opportunityLens, revenuePerVisitor } from "@/lib/lab/scores";
import { requireAdmin } from "@/lib/session";
import type { CampaignPack, ProductDna } from "@/lib/journeys/types";

export const dynamic = "force-dynamic";

const TABS = [
  ["discover", "Discover"],
  ["matches", "Pain matches"],
  ["trending", "Trending"],
  ["money", "Money opportunities"],
  ["saved", "Saved"],
  ["published", "Published"],
  ["winners", "Winners"],
  ["losers", "Losers"],
] as const;

export default async function AffiliateLabPage({
  searchParams,
}: {
  searchParams: Promise<{ lens?: string; tab?: string }>;
}) {
  await requireAdmin("/workspace/lab");
  const data = await listLab();
  if (!data) redirect("/login?next=/workspace/lab");
  const { offers, matches, leads, pains, stats } = data;
  const params = await searchParams;
  const lens = params.lens ?? "demand";
  const tab = params.tab ?? "discover";

  const queue = [...pains]
    .map((pain) => ({ pain, lens: opportunityLens(pain) }))
    .sort((a, b) => {
      if (lens === "rising") return b.pain.trend - a.pain.trend;
      if (lens === "underserved") return b.lens.underserved - a.lens.underserved;
      if (lens === "money") return b.lens.money - a.lens.money;
      if (lens === "affiliate") return b.pain.affiliateScore - a.pain.affiliateScore;
      return b.lens.demand - a.lens.demand;
    });

  const proven = matches.filter((row) => row.performanceScore >= 70 && row.painId);
  const hidden = matches.filter(
    (row) =>
      row.underservedScore >= 70 &&
      row.performanceScore < 75 &&
      row.painScore >= 70,
  );
  const saved = matches.filter((row) =>
    [
      "saved",
      "page_generated",
      "published",
      "getting_traffic",
      "producing_clicks",
      "producing_commissions",
    ].includes(row.status),
  );
  const published = matches.filter((row) =>
    [
      "published",
      "getting_traffic",
      "producing_clicks",
      "producing_commissions",
    ].includes(row.status),
  );
  const winners = matches
    .filter((row) => row.sales > 0)
    .sort(
      (a, b) =>
        revenuePerVisitor(b.commissionPence, b.visitors) -
        revenuePerVisitor(a.commissionPence, a.visitors),
    );
  const losers = matches.filter((row) => row.visitors >= 50 && row.sales === 0);
  const money = [...matches].sort((a, b) => b.moneyScore - a.moneyScore);
  const trending = [...matches].sort((a, b) => b.painScore - a.painScore);

  const tabRows =
    tab === "matches"
      ? matches
      : tab === "trending"
        ? trending
        : tab === "money"
          ? money
          : tab === "saved"
            ? saved
            : tab === "published"
              ? published
              : tab === "winners"
                ? winners
                : tab === "losers"
                  ? losers
                  : [];

  const built = matches.filter((row) => row.packJson);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Affiliate command center
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">
        Find demand worth monetizing.
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
        Pain-first. Rank complaints, then attach an offer you already have
        permission to promote. Import ClickBank details by hand — PainGraphs
        will not scrape the Marketplace. OpenAI ranks fit; your HopLink is the
        source of truth.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
        <Kpi
          label="Recorded commission"
          value={`£${(stats.commissionPence / 100).toFixed(2)}`}
        />
        <Kpi label="Affiliate clicks" value={stats.clicks} />
        <Kpi label="Sales" value={stats.sales} />
        <Kpi label="Visitors" value={stats.visitors} />
        <Kpi label="Revenue / visitor" value={`£${stats.rpv.toFixed(2)}`} />
        <Kpi label="Top pain" value={stats.topPain ?? "—"} />
      </dl>
      <p className="mt-2 text-xs text-muted">
        These numbers come from results you paste. They become proven
        opportunity scores as traffic lands.
      </p>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/workspace" className="text-copper hover:text-copper-2">
          Reverse PainGraph scans
        </Link>
        <Link href="/watchlist" className="text-copper hover:text-copper-2">
          Consumer watchlist
        </Link>
      </div>

      <nav className="mt-10 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        {TABS.map(([id, label]) => (
          <Link
            key={id}
            href={`/workspace/lab?tab=${id}${id === "discover" ? `&lens=${lens}` : ""}`}
            className={`border px-3 py-1.5 ${
              tab === id
                ? "border-copper text-copper"
                : "border-line text-muted hover:text-paper"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "discover" ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl">Pain opportunity queue</h2>
          <p className="mt-2 text-sm text-muted">
            Demand is scored before products. Filter, then find an offer for
            that pain — or host a waitlist if nothing honest fits.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
            {[
              ["demand", "Highest demand"],
              ["rising", "Rising pains"],
              ["underserved", "Hidden / underserved"],
              ["money", "Pain-to-money"],
              ["affiliate", "Affiliate fit"],
            ].map(([id, label]) => (
              <Link
                key={id}
                href={`/workspace/lab?tab=discover&lens=${id}`}
                className={`border px-3 py-1.5 ${
                  lens === id
                    ? "border-copper text-copper"
                    : "border-line text-muted hover:text-paper"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-6 grid gap-4">
            {queue.slice(0, 12).map(({ pain, lens: scores }) => (
              <div key={pain.id} className="border border-line p-5">
                <PainCard pain={pain} extra />
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
                  <Stat label="Demand" value={scores.demand} />
                  <Stat label="Pain-to-money" value={scores.money} />
                  <Stat label="Underserved" value={scores.underserved} />
                  <Stat label="Route" value={scores.route} />
                  <Stat label="Evidence" value={pain.evidenceCount} />
                </dl>
                <Link
                  href={pain.href}
                  className="mt-4 inline-block text-sm text-copper hover:text-copper-2"
                >
                  Open PainGraph · then attach an offer from Saved
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <MatchTable
          title={TABS.find((item) => item[0] === tab)?.[1] ?? "Matches"}
          empty="Nothing in this filter yet."
          rows={tabRows}
          showPerformance={tab === "winners" || tab === "losers" || tab === "published"}
        />
      )}

      <section className="mt-16">
        <h2 className="font-display text-3xl">Affiliate opportunity finder</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Proven and hidden filters sit in the tabs above. Use this when you
          need OpenAI to research public programmes for a pain, or to generate
          pains for a product you already imported. Tracking links still come
          from your affiliate account.
        </p>
        <div className="mt-6">
          <OpportunityFinder
            offers={offers.map((offer) => ({ id: offer.id, name: offer.name }))}
            pains={pains.map((pain) => ({
              id: pain.id,
              title: pain.title,
              problem: pain.problem,
            }))}
          />
        </div>
      </section>

      {leads.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl">Programme leads</h2>
          <p className="mt-2 text-sm text-muted">
            Join these yourself. Then import the HopLink you are given.
          </p>
          <ul className="mt-4 space-y-3">
            {leads.slice(0, 12).map((lead) => (
              <li key={lead.id} className="border border-line p-4 text-sm">
                <div className="text-paper">
                  {lead.name} · {lead.network}
                </div>
                <div className="mt-1 text-xs text-muted">
                  For {lead.painTitle} · {lead.commission} · fit {lead.fit}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{lead.evidence}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="font-display text-3xl">Import an affiliate product</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Product → candidate pains → evidence → score. AI does not score a
          guess until public evidence is strong, or the pain already exists in
          the marketplace.
        </p>
        <div className="mt-6 border border-line p-5">
          <OfferImportForm />
        </div>
      </section>

      <MatchTable
        title="Proven sellers"
        empty="No high-gravity matches yet."
        rows={proven}
      />
      <MatchTable
        title="Hidden opportunities"
        empty="No strong-pain / quieter-offer matches yet."
        rows={hidden}
      />
      <MatchTable
        title="My opportunities"
        empty="Save a Product × Pain pair to build a funnel."
        rows={saved}
        showPerformance
      />

      {offers.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl">Imported offers</h2>
          <ul className="mt-4 space-y-3">
            {offers.map((offer) => {
              const dna = parseDna(offer.dna);
              return (
                <li key={offer.id} className="border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-paper">
                        {offer.name} · {offer.network}
                        {offer.vendor ? ` · ${offer.vendor}` : ""}
                      </p>
                      {dna ? (
                        <p className="mt-2 max-w-2xl text-xs leading-5 text-muted">
                          {dna.solves}
                          {dna.mechanism ? ` · ${dna.mechanism}` : ""}
                        </p>
                      ) : null}
                      {dna?.audiences?.length ? (
                        <p className="mt-1 text-xs text-muted">
                          Audiences: {dna.audiences.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <AnalyseOfferButton offerId={offer.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {built.map((row) => {
        const pack = parsePack(row.packJson);
        if (!pack) return null;
        return (
          <section key={row.id} className="mt-16">
            <h2 className="font-display text-3xl">Campaign pack · {row.title}</h2>
            <p className="mt-2 text-sm text-muted">
              Ads land on the PainGraph. The HopLink is only used after the
              questionnaire, if the fit is honest. You paste this into Meta or
              Google yourself.
            </p>
            {row.draftSlug ? (
              <Link
                href={row.draftSlug}
                className="mt-3 inline-block text-sm text-copper hover:text-copper-2"
              >
                Open draft {row.draftSlug}
              </Link>
            ) : null}
            <div className="mt-6">
              <CampaignPackView pack={pack} />
            </div>
          </section>
        );
      })}
    </main>
  );
}

function MatchTable({
  title,
  empty,
  rows,
  showPerformance = false,
}: {
  title: string;
  empty: string;
  rows: NonNullable<Awaited<ReturnType<typeof listLab>>>["matches"];
  showPerformance?: boolean;
}) {
  return (
    <section className="mt-16">
      {title ? <h2 className="font-display text-3xl">{title}</h2> : null}
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-2 pr-3">Pain</th>
                <th className="py-2 pr-3">Demand</th>
                <th className="py-2 pr-3">Fit</th>
                <th className="py-2 pr-3">Money</th>
                <th className="py-2 pr-3">Underserved</th>
                <th className="py-2 pr-3">£ / vis</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line align-top">
                  <td className="py-3 pr-3">
                    <div className="text-paper">{row.title}</div>
                    <div className="mt-1 max-w-xs text-xs text-muted">
                      {row.evidenceNote}
                    </div>
                    {!row.recommendable ? (
                      <div className="mt-1 text-xs text-signal">
                        Do not recommend this offer for this pain.
                      </div>
                    ) : null}
                    {showPerformance ? (
                      <MatchPerformanceForm
                        matchId={row.id}
                        visitors={row.visitors}
                        quizCompleted={row.quizCompleted}
                        affiliateClicks={row.affiliateClicks}
                        sales={row.sales}
                        commissionPence={row.commissionPence}
                      />
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 font-mono">{row.painScore || "—"}</td>
                  <td className="py-3 pr-3 font-mono">{row.productFit || "—"}</td>
                  <td className="py-3 pr-3 font-mono">{row.moneyScore || "—"}</td>
                  <td className="py-3 pr-3 font-mono">
                    {row.underservedScore || "—"}
                  </td>
                  <td className="py-3 pr-3 font-mono">
                    {row.visitors
                      ? `£${revenuePerVisitor(row.commissionPence, row.visitors).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="py-3 pr-3 text-xs uppercase tracking-[0.12em] text-muted">
                    {row.status.replaceAll("_", " ")}
                  </td>
                  <td className="space-y-2 py-3">
                    <SaveMatchButton matchId={row.id} status={row.status} />
                    <BuildPainGraphButton matchId={row.id} />
                    {row.status === "page_generated" ? (
                      <PublishMatchButton
                        matchId={row.id}
                        href={row.draftSlug}
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-ink px-4 py-5">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">
        {label}
      </dt>
      <dd className="mt-2 font-mono text-lg text-paper">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-paper">{value}</dd>
    </div>
  );
}

function parseDna(raw: string | null): ProductDna | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProductDna;
  } catch {
    return null;
  }
}

function parsePack(raw: string | null): CampaignPack | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CampaignPack;
  } catch {
    return null;
  }
}
