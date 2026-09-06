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
import { listBillboardRows, sortBillboard } from "@/lib/opportunities/board";
import { todaysOpportunity } from "@/lib/opportunities/daily";
import { founderGapFromPage } from "@/lib/opportunities/gap";
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
  const [graphs, savedIds, board, affiliateDay, founderDay, unread, recentAlerts, billing] =
    await Promise.all([
      listPainGraphs(),
      listSavedPainIds(),
      listBillboardRows(),
      todaysOpportunity("affiliate"),
      todaysOpportunity("founder"),
      unreadAlertCount(session.user.id),
      listMemberAlerts(session.user.id, 3),
      billingProfile(session.user.id),
    ]);
  const saved = graphs.filter((graph) => savedIds.includes(graph.id));
  const affiliate = sortBillboard(board, "affiliate").slice(0, 6);
  const founder = sortBillboard(board, "founder").slice(0, 6);
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
        One account. Consumer access is always on. Switch lenses without
        creating a second login.
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
          <h2 className="font-display text-3xl">Saved pains</h2>
          {saved.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Open a public PainGraph and choose Save this pain. Updates land
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
            Save tracking URLs you already created. They stay private and never
            replace the public PainGraphs destination.
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
            {affiliate.map((graph) => (
              <PainCard key={graph.id} graph={graph} />
            ))}
          </div>
        </section>
      ) : null}

      {mode === "build" ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl">Founder opportunities</h2>
          <p className="mt-3 text-sm text-muted">
            See where scored products still miss, then open the full gap
            analysis. Build strategy stays off these pages.
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
            {founder.map((graph) => (
              <PainCard key={graph.id} graph={graph} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
