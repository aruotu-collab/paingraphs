import Link from "next/link";
import { marketplaceLabels } from "@/lib/journeys/labels";
import { getPainPage } from "@/lib/market/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sample founder report",
  description:
    "Read-only founder view of headphones that hurt with glasses: audience, unmet needs, pricing clues, and opportunity score.",
};

export default async function FounderDemoPage() {
  const page = await getPainPage("electronics", "headphones", "glasses-pressure");
  if (!page) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-5 py-10">
        <p className="text-muted">No sample pain is published yet.</p>
      </main>
    );
  }
  const labels = marketplaceLabels(page);
  const quote = page.signals[0]?.quote;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Sample founder report · read-only
      </p>
      <h1 className="mt-3 font-display text-5xl leading-[1.05]">{page.h1}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        This is what a founder sees before building. Live complaint evidence is
        real. Waitlist and questionnaire totals below are labelled as sample
        format — they show the report, not invented traction for this pain.
      </p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        <Box label="Customer pain" value={page.problem} />
        <Box
          label="Audience"
          value="People who wear glasses on long calls, commutes, and gaming sessions."
        />
        <Box
          label="Opportunity score"
          value={`${page.opportunity}/100 · founder fit ${labels.founder}`}
        />
      </dl>

      {quote ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl">Customer language</h2>
          <blockquote className="mt-4 border-l border-copper pl-5 text-lg leading-8">
            “{quote}”
          </blockquote>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-3xl">Current alternatives</h2>
        <ul className="mt-4 space-y-3">
          {page.products.map((product) => (
            <li key={product.id} className="border border-line p-4">
              <h3 className="font-display text-2xl">{product.name}</h3>
              <p className="mt-1 text-sm text-muted">{product.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Unmet needs and product requirements</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted">
          {page.criteria.map((item) => (
            <li key={item.slug}>
              <span className="text-paper">{item.name}.</span> {item.detail}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="border border-dashed border-line p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Pricing clues
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Catalog bands on this pain run {page.products.map((item) => item.priceBand).filter(Boolean).join(" · ") || "not priced yet"}.
            A founder report would add what questionnaire respondents said they would pay.
          </p>
        </div>
        <div className="border border-dashed border-line p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Questionnaire results
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Sample format: 241 completed PainGraphs. 58% said “I have this
            problem.” Use this layout once you host a test page and drive
            traffic.
          </p>
        </div>
        <div className="border border-dashed border-line p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Waitlist size
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Sample format: 64 joined early access. 18 left a reservation. Those
            numbers appear after you run the self-serve test, not before.
          </p>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/signup?next=/workspace"
          className="bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
        >
          Create a founder workspace
        </Link>
        <Link
          href="/for-founders"
          className="border border-line px-5 py-2.5 hover:border-copper"
        >
          Paste a product URL
        </Link>
      </div>
    </main>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-3 text-sm leading-6 text-paper">{value}</p>
    </div>
  );
}
