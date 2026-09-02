import Link from "next/link";
import { PainCard } from "@/components/pain-card";
import { ProductScanForm } from "@/components/product-scan-form";
import { marketplaceLabels } from "@/lib/journeys/labels";
import { getPainPage, listMarketPains } from "@/lib/market/queries";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discover underserved consumer pains before you build",
  description:
    "PainGraphs shows founders which consumer pains are underserved, and Reverse PainGraph finds new audiences for a product you already sell.",
};

export default async function FoundersPage() {
  const session = await getSession();
  const pains = await listMarketPains();
  const example =
    (await getPainPage("electronics", "headphones", "glasses-pressure")) ??
    null;
  const labels = example ? marketplaceLabels(example) : null;
  const gaps = pains.filter((pain) => pain.productGap >= 60).slice(0, 5);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        I want to build
      </p>
      <h1 className="mt-3 font-display text-5xl leading-[1.05]">
        Discover underserved consumer pains before you build.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        Already have a product? Find the pains and audiences it could solve.
        PainGraphs does not run ads for you. It builds the research page,
        questionnaire, and campaign pack. You bring the traffic.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <section className="border border-line p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Path 1 · Find something to build
          </p>
          <h2 className="mt-3 font-display text-3xl">Trending pain</h2>
          {example && labels ? (
            <>
              <p className="mt-3 text-lg">{example.title}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Fact label="Evidence" value="Strong" />
                <Fact
                  label="Existing solutions"
                  value={example.productGap >= 65 ? "Mediocre" : "Crowded"}
                />
                <Fact
                  label="Public complaints"
                  value={String(example.evidenceCount)}
                />
                <Fact label="Opportunity" value={String(example.opportunity)} />
              </dl>
              <Link
                href="/for-founders/demo"
                className="mt-6 inline-block bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
              >
                View founder report
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">No sample pain yet.</p>
          )}
        </section>

        <section className="border border-line p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Path 2 · I already have a product
          </p>
          <h2 className="mt-3 font-display text-3xl">Reverse PainGraph</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Paste your product URL. PainGraphs finds the strongest pains and
            overlooked audiences it may solve. Guests see the first match.
            The rest unlock after sign-in.
          </p>
          <div className="mt-6">
            <ProductScanForm
              signedIn={Boolean(session)}
              intent="founder"
            />
          </div>
        </section>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-3xl">Worked example</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Product: lightweight low-clamp headphones. PainGraphs would surface
          glasses pressure first, then long-session discomfort, then heavy
          headset fatigue — and name the audiences those scores imply.
        </p>
        <ol className="mt-6 grid gap-3 text-sm">
          <li className="border border-line p-4">
            91% match: glasses pressure · office workers and gamers with glasses
          </li>
          <li className="border border-line p-4">
            82% match: long-session discomfort · students on long calls
          </li>
          <li className="border border-line p-4">
            74% match: heavy headset fatigue · people who already own over-ears
          </li>
        </ol>
      </section>

      {gaps.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl">Underserved in the marketplace</h2>
          <div className="mt-6 grid gap-4">
            {gaps.map((pain) => (
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
