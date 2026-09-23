import Link from "next/link";
import { redirect } from "next/navigation";
import { FounderGap } from "@/components/founder-gap";
import { ModeSwitcher } from "@/components/mode-switcher";
import { OpportunityCard } from "@/components/opportunity-card";
import { PainCard } from "@/components/pain-card";
import { BillingPortalButton } from "@/components/billing-portal-button";
import { billingProfile } from "@/lib/billing/store";
import { formatAccessUntil } from "@/lib/billing/stripe";
import { applySignupLenses } from "@/lib/identity/actions";
import { isWorkspaceMode } from "@/lib/identity/constants";
import { entitlements } from "@/lib/identity/profile";
import { todaysOpportunity } from "@/lib/opportunities/daily";
import { founderGapFromPage } from "@/lib/opportunities/gap";
import { listMatchLenses } from "@/lib/opportunities/match-lens";
import { listMemberAlerts, unreadAlertCount } from "@/lib/alerts/store";
import { listSavedPainIds } from "@/lib/paingraph/actions";
import { getPainGraphPage, listPainGraphs } from "@/lib/paingraph/queries";
import { getAccess, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MemberHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    affiliate?: string;
    founder?: string;
    billing?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/home");
  const query = await searchParams;
  if (query.affiliate === "1" || query.founder === "1") {
    await applySignupLenses({
      affiliate: query.affiliate === "1",
      founder: query.founder === "1",
    });
    const nextMode =
      query.founder === "1" ? "build" : query.affiliate === "1" ? "promote" : "solve";
    redirect(`/home?mode=${nextMode}`);
  }

  const { capabilities, profile } = await getAccess(session.user);
  const mode = isWorkspaceMode(query.mode) ? query.mode : profile.primaryMode;
  const owner = capabilities.admin || capabilities.marketingAgent;
  const access = entitlements(profile, owner);
  const [graphs, savedIds, affiliateDay, founderDay, unread, recentAlerts, billing, lenses] =
    await Promise.all([
      listPainGraphs(),
      listSavedPainIds(),
      todaysOpportunity("affiliate"),
      todaysOpportunity("founder"),
      unreadAlertCount(session.user.id),
      listMemberAlerts(session.user.id, 3),
      billingProfile(session.user.id),
      listMatchLenses(),
    ]);
  const saved = graphs.filter((graph) => savedIds.includes(graph.id));
  const founderPage =
    mode === "build" && founderDay
      ? await getPainGraphPage(
          founderDay.category.slug,
          founderDay.subcategory.slug,
          founderDay.slug,
        )
      : null;
  const gap = founderPage ? founderGapFromPage(founderPage) : null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Member home · {access.plan}
      </p>
      <h1 className="mt-3 font-display text-4xl">Solve, promote, or build.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        One account. Matches you keep land here. Promote and Build read the
        same sliders.
      </p>
      <div className="mt-6">
        <ModeSwitcher current={mode} owner={owner} />
      </div>
      {query.billing === "success" ? (
        <p className="mt-6 text-sm text-copper">
          Stripe checkout finished. Pro unlocks when the payment is confirmed.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/home/alerts" className="text-copper hover:text-copper-2">
          Alerts
        </Link>
        <Link href="/home/products" className="text-copper hover:text-copper-2">
          My Products
        </Link>
        <Link href="/home/briefs" className="text-copper hover:text-copper-2">
          Campaign briefs
        </Link>
        <Link href="/home/searches" className="text-copper hover:text-copper-2">
          Saved searches
        </Link>
        {!access.pro ? (
          <Link href="/pricing" className="text-copper hover:text-copper-2">
            Unlock Pro
          </Link>
        ) : null}
        {billing?.stripeCustomerId && !owner ? <BillingPortalButton /> : null}
      </div>
      {billing?.stripeCancelAt && access.pro && !owner ? (
        <p className="mt-4 text-sm text-muted">
          Pro cancels on {formatAccessUntil(billing.stripeCancelAt)}. Access
          stays until then.
        </p>
      ) : null}

      {unread > 0 ? (
        <section className="mt-10 border border-copper p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-copper">
            {unread === 1 ? "1 unread alert" : `${unread} unread alerts`}
          </p>
          <ul className="mt-3 space-y-2">
            {recentAlerts.slice(0, 3).map((alert) => (
              <li key={alert.id} className="text-sm">
                <Link href="/home/alerts" className="text-copper hover:text-copper-2">
                  {alert.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {mode === "solve" ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl">Matches you kept</h2>
          {saved.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Open a public PainGraph and choose Keep this match. Updates land
              in{" "}
              <Link href="/home/alerts" className="text-copper hover:text-copper-2">
                Alerts
              </Link>
              .
            </p>
          ) : (
            <div className="mt-6 grid gap-4">
              {saved.map((graph) => (
                <PainCard key={graph.id} graph={graph} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {mode === "promote" ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl">Affiliate opportunities</h2>
          <p className="mt-3 text-sm text-muted">
            Kinds that survive the default sliders, and whether a public shop
            link exists. Private vault URLs never replace the public button.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href="/home/vault" className="text-copper hover:text-copper-2">
              Open private link vault
            </Link>
            <Link
              href="/top-pains?view=affiliate"
              className="text-copper hover:text-copper-2"
            >
              Affiliate Billboard
            </Link>
          </div>
          {affiliateDay ? (
            <div className="mt-6">
              <OpportunityCard graph={affiliateDay} lens="affiliate" />
            </div>
          ) : null}
          <div className="mt-6 grid gap-4">
            {lenses
              .slice()
              .sort((left, right) => right.shopReady.length - left.shopReady.length)
              .slice(0, 6)
              .map((row) => (
                <PainCard
                  key={row.graph.id}
                  graph={row.graph}
                  note={`${row.surviving.length} kinds survive · ${row.shopReady.length} shop link${row.shopReady.length === 1 ? "" : "s"} · ${row.clicks} click${row.clicks === 1 ? "" : "s"}`}
                />
              ))}
          </div>
        </section>
      ) : null}

      {mode === "build" ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl">Founder opportunities</h2>
          <p className="mt-3 text-sm text-muted">
            Deal-breaker gaps from the same match engine. Build strategy stays
            off these pages.
          </p>
          <Link
            href="/top-pains?view=founder"
            className="mt-4 inline-block text-sm text-copper hover:text-copper-2"
          >
            Founder Billboard
          </Link>
          {founderDay ? (
            <div className="mt-6">
              <OpportunityCard
                graph={founderDay}
                lens="founder"
                gap={gap?.unmetNeed}
                href={`/founders/gap/${founderDay.id}`}
              />
            </div>
          ) : null}
          {gap ? (
            <div className="mt-6 border border-line p-5">
              <h3 className="font-display text-2xl">Today&apos;s unlocked gap</h3>
              <div className="mt-4">
                <FounderGap gap={gap} detail={false} />
              </div>
            </div>
          ) : null}
          <div className="mt-6 grid gap-4">
            {lenses
              .slice()
              .sort(
                (left, right) =>
                  right.dealBreakers.length - left.dealBreakers.length,
              )
              .slice(0, 6)
              .map((row) => (
                <PainCard
                  key={row.graph.id}
                  graph={row.graph}
                  href={`/founders/gap/${row.graph.id}`}
                  note={
                    row.dealBreakers.length > 0
                      ? `Deal-breaker gaps: ${row.dealBreakers.map((item) => item.name).join(", ")}`
                      : `${row.surviving.length} kinds survive default sliders`
                  }
                />
              ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
