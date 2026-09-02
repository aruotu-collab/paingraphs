import Link from "next/link";
import { getPainPage, listMarketPains } from "@/lib/market/queries";
import { marketplaceLabels } from "@/lib/journeys/labels";
import { PainCard } from "@/components/pain-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find consumer pains with products you can promote",
  description:
    "PainGraphs finds affiliate niches from real complaints, ranks products against the pain, and generates campaign copy you paste into Meta or Google.",
};

export default async function AffiliatesPage() {
  const pains = await listMarketPains();
  const example =
    (await getPainPage("electronics", "headphones", "glasses-pressure")) ??
    (await getPainPage(
      pains[0]?.category.slug ?? "",
      pains[0]?.cluster.slug ?? "",
      pains[0]?.slug ?? "",
    ));
  const affiliate = pains.filter((pain) => pain.affiliateScore >= 70).slice(0, 6);
  const labels = example ? marketplaceLabels(example) : null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        I want to earn
      </p>
      <h1 className="mt-3 font-display text-5xl leading-[1.05]">
        Find consumer pains with products you can promote.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        This is not another keyword tool. PainGraphs clusters real complaints
        into one opportunity, ranks products against that pain, then gives you
        the campaign pack. You add the affiliate links and run the ads yourself.
      </p>

      {example && labels ? (
        <section className="mt-10 border border-line p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Example opportunity
          </p>
          <h2 className="mt-3 font-display text-3xl">{example.title}</h2>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Fact label="Pain score" value={`${example.painScore}/100`} />
            <Fact label="Trend" value={labels.trend} />
            <Fact label="Affiliate fit" value={labels.affiliate} />
            <Fact
              label="Existing products"
              value={`${example.products.length} types`}
            />
          </dl>
          <p className="mt-5 text-sm leading-6 text-muted">{example.problem}</p>
          <Link
            href="/for-affiliates/demo"
            className="mt-6 inline-block bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
          >
            View example affiliate opportunity
          </Link>
        </section>
      ) : null}

      <ol className="mt-12 grid gap-6 md:grid-cols-2">
        {[
          [
            "1. PainGraphs discovers the pain",
            "Real customer complaints are clustered into one opportunity.",
          ],
          [
            "2. We identify products",
            "Products are ranked by how well they solve the pain, not by who paid for a review.",
          ],
          [
            "3. We generate the campaign",
            "SEO page, comparison page, email, Facebook ad copy, Google ad copy — ready to paste.",
          ],
          [
            "4. You add your affiliate links",
            "Then you start promoting from your own accounts. PainGraphs does not run ads for you.",
          ],
        ].map(([title, body]) => (
          <li key={title} className="border border-line p-5">
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/signup?next=/workspace"
          className="bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
        >
          Create an account
        </Link>
        <Link
          href="/reverse-product-research"
          className="border border-line px-5 py-2.5 hover:border-copper"
        >
          Paste a merchant URL
        </Link>
      </div>

      {affiliate.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl">Browse the marketplace</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            These pages are public. Campaign generation and product matching
            unlock after you create an account — one account, no role picker.
          </p>
          <div className="mt-6 grid gap-4">
            {affiliate.map((pain) => (
              <PainCard key={pain.id} pain={pain} extra />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-paper">{value}</dd>
    </div>
  );
}
