import Link from "next/link";
import { BillingPortalButton } from "@/components/billing-portal-button";
import { CheckoutButton } from "@/components/checkout-button";
import { refreshSubscription } from "@/lib/billing/store";
import { formatAccessUntil, stripeConfigured } from "@/lib/billing/stripe";
import { entitlements } from "@/lib/identity/profile";
import { getAccess, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing",
  description: "Free consumer access. One Pro plan unlocks Affiliate and Founder.",
};

const freePoints = [
  "Browse public PainGraphs",
  "Use recommendation sliders",
  "Save and follow a limited set of pains",
  "Basic alerts on saved pains",
  "Preview Affiliate and Founder insights",
];

const proPoints = [
  "Full Affiliate and Founder modes",
  "Opportunity scores and evidence depth",
  "Personal affiliate link vault",
  "Campaign briefs and My Products",
];

export default async function PricingPage() {
  const session = await getSession();
  const billing = session ? await refreshSubscription(session.user.id) : null;
  const access = session
    ? await getAccess(session.user).then(({ profile, capabilities }) =>
        entitlements(profile, capabilities.admin || capabilities.marketingAgent),
      )
    : { plan: "free" as const, pro: false };
  const configured = stripeConfigured();
  const cancelAt = billing?.stripeCancelAt ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Pricing</p>
      <h1 className="mt-3 font-display text-5xl">One account. Three jobs.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        Consumer access is always included. Founder and Affiliate are one Pro
        subscription. Checkout uses Stripe.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="flex flex-col border border-line p-5">
          <h2 className="font-display text-3xl">Free</h2>
          <p className="mt-2 font-mono text-2xl text-copper">£0</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Solve pains now. Preview professional intelligence.
          </p>
          <ul className="mt-5 flex-1 space-y-2 text-sm">
            {freePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <Link
            href={session ? "/home" : "/signup?next=/home"}
            className="mt-6 border border-line px-4 py-2 text-center text-sm text-muted hover:border-copper hover:text-copper"
          >
            {session ? "Open member home" : "Get started"}
          </Link>
        </article>

        <article className="flex flex-col border border-copper p-5">
          <h2 className="font-display text-3xl">Pro</h2>
          <p className="mt-2 font-mono text-2xl text-copper">£39/mo</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            One paid plan unlocks both Promote and Build.
          </p>
          <ul className="mt-5 flex-1 space-y-2 text-sm">
            {proPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          {access.pro ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-copper">
                {access.plan === "owner" ? "Owner access is already unlocked." : "You are on Pro."}
              </p>
              {access.plan !== "owner" && cancelAt ? (
                <p className="text-sm text-muted">
                  Cancels on {formatAccessUntil(cancelAt)}. Access stays until
                  then.
                </p>
              ) : null}
              {access.plan !== "owner" ? <BillingPortalButton /> : null}
            </div>
          ) : (
            <CheckoutButton signedIn={Boolean(session)} configured={configured} />
          )}
        </article>
      </div>
    </main>
  );
}
