import Link from "next/link";

export const metadata = {
  title: "Pricing",
  description:
    "Self-serve PainGraphs plans for affiliates and founders. Campaign packs, test pages, and analysis. You run the ads.",
};

const plans = [
  {
    name: "Free",
    price: "£0",
    detail: "See the market. Try one sample Reverse PainGraph.",
    points: [
      "Browse the Pain Marketplace",
      "Consumer PainGraphs",
      "Sample affiliate and founder reports",
      "One URL preview (first match only)",
    ],
  },
  {
    name: "Affiliate",
    price: "£39/mo",
    detail: "Find pains worth promoting and leave with a campaign pack.",
    points: [
      "5 product URL analyses / month",
      "Affiliate matching against live pains",
      "Meta, Google, email, and SEO packs",
      "Hosted test pages",
      "Paste-in campaign results",
    ],
  },
  {
    name: "Founder",
    price: "£99/mo",
    detail: "Hypotheses, test pages, waitlists, and positioning evidence.",
    points: [
      "Everything in Affiliate",
      "Multiple pain hypotheses per URL",
      "Validation questionnaires",
      "Waitlist capture on PainGraphs",
      "Founder reports as evidence accumulates",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Pricing</p>
      <h1 className="mt-3 font-display text-5xl">
        You bring the traffic. PainGraphs does the research.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        Self-service only. No managed ads. One account can use affiliate and
        founder tools. Checkout is not wired yet — create an account and we will
        open the workspace with the current monthly analysis limit.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className="flex flex-col border border-line p-5">
            <h2 className="font-display text-3xl">{plan.name}</h2>
            <p className="mt-2 font-mono text-2xl text-copper">{plan.price}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{plan.detail}</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-paper">
              {plan.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link
              href="/signup?next=/workspace"
              className="mt-6 border border-copper px-4 py-2 text-center text-sm text-copper hover:bg-copper hover:text-ink"
            >
              Create account
            </Link>
          </article>
        ))}
      </div>
      <section className="mt-14">
        <h2 className="font-display text-3xl">One-off credits, later</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Reverse PainGraph report £19 · full product validation pack £49 ·
          founder launch pack £99. These will sit beside the subscription once
          checkout is live. Until then the workspace uses the monthly analysis
          cap.
        </p>
      </section>
    </main>
  );
}
