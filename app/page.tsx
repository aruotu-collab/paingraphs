import Link from "next/link";
import { OpportunityCard } from "@/components/opportunity-card";
import { PainSearch } from "@/components/pain-search";
import { todaysOpportunity } from "@/lib/opportunities/daily";
import { founderGapFromPage } from "@/lib/opportunities/gap";
import { getPainGraphPage, listPainGraphs } from "@/lib/paingraph/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const graphs = await listPainGraphs();
  const categories = [
    ...new Map(
      graphs.map((graph) => [graph.category.slug, graph.category]),
    ).values(),
  ];
  const [affiliateDay, founderDay] = await Promise.all([
    todaysOpportunity("affiliate", graphs),
    todaysOpportunity("founder", graphs),
  ]);
  const founderPage = founderDay
    ? await getPainGraphPage(
        founderDay.category.slug,
        founderDay.subcategory.slug,
        founderDay.slug,
      )
    : null;
  const founderGap = founderPage ? founderGapFromPage(founderPage) : null;
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        One PainGraph · five lenses
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight">
        See what people are struggling with — and what to do about it.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        PainGraphs is a live marketplace of problems. Consumers find what
        usually helps. Affiliates promote existing solutions. Founders find
        gaps worth building.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Link href="/" className="border border-line p-5 hover:border-copper">
          <p className="text-xs uppercase tracking-[0.16em] text-copper">Solve</p>
          <h2 className="mt-2 font-display text-2xl">Solve a pain</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Find products, services, and approaches that may help.
          </p>
        </Link>
        <Link href="/affiliates" className="border border-line p-5 hover:border-copper">
          <p className="text-xs uppercase tracking-[0.16em] text-copper">Promote</p>
          <h2 className="mt-2 font-display text-2xl">Promote a solution</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Find pain-driven affiliate opportunities backed by observed demand.
          </p>
        </Link>
        <Link href="/founders" className="border border-line p-5 hover:border-copper">
          <p className="text-xs uppercase tracking-[0.16em] text-copper">Build</p>
          <h2 className="mt-2 font-display text-2xl">Build a solution</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Find underserved pains that may be worth building for.
          </p>
        </Link>
      </div>

      {affiliateDay || founderDay ? (
        <section className="mt-16 grid gap-4 md:grid-cols-2">
          {affiliateDay ? (
            <OpportunityCard graph={affiliateDay} lens="affiliate" />
          ) : null}
          {founderDay ? (
            <OpportunityCard
              graph={founderDay}
              lens="founder"
              gap={founderGap?.unmetNeed}
              href={`/founders/gap/${founderDay.id}`}
            />
          ) : null}
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="font-display text-3xl">Explore by category</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="border border-line px-3 py-1.5 text-sm text-muted hover:border-copper hover:text-copper"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl">Live PainGraphs</h2>
          <Link href="/top-pains" className="text-sm text-copper hover:text-copper-2">
            Open Billboard
          </Link>
        </div>
        <div className="mt-6">
          <PainSearch graphs={graphs} />
        </div>
      </section>
    </main>
  );
}
