import Link from "next/link";
import { FounderGap } from "@/components/founder-gap";
import { OpportunityCard } from "@/components/opportunity-card";
import { PainCard } from "@/components/pain-card";
import { listBillboardRows, sortBillboard } from "@/lib/opportunities/board";
import { recentOpportunities, todaysOpportunity } from "@/lib/opportunities/daily";
import { founderGapFromPage } from "@/lib/opportunities/gap";
import { getPainGraphPage } from "@/lib/paingraph/queries";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "For Founders",
  description:
    "Find painful problems that existing solutions do not solve well enough.",
};

export default async function FoundersPage() {
  const [featured, board, archive, session] = await Promise.all([
    todaysOpportunity("founder"),
    listBillboardRows(),
    recentOpportunities("founder", 5),
    getSession(),
  ]);
  const sample = sortBillboard(board, "founder").slice(0, 6);
  const featuredPage = featured
    ? await getPainGraphPage(
        featured.category.slug,
        featured.subcategory.slug,
        featured.slug,
      )
    : null;
  const gap = featuredPage ? founderGapFromPage(featuredPage) : null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Build</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight">
        Pains that existing products do not solve well.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        Inspect evidence, workarounds, and product gaps before you build.
        Deeper founder intelligence unlocks on the same account.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={session ? "/home?mode=build" : "/signup?next=/home?mode=build"}
          className="inline-block bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
        >
          {session ? "Open member home" : "Create an account"}
        </Link>
        <Link
          href="/top-pains?view=founder"
          className="inline-block border border-copper px-5 py-2.5 text-copper hover:bg-copper hover:text-ink"
        >
          Founder Billboard
        </Link>
      </div>

      {featured ? (
        <section className="mt-16">
          <OpportunityCard
            graph={featured}
            lens="founder"
            gap={gap?.unmetNeed}
            href={`/founders/gap/${featured.id}`}
          />
          {gap ? (
            <div className="mt-6 border border-line p-5">
              <h2 className="font-display text-2xl">Unlocked gap</h2>
              <div className="mt-4">
                <FounderGap gap={gap} detail={false} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="font-display text-3xl">Sample founder opportunities</h2>
        <div className="mt-6 grid gap-4">
          {sample.map((graph) => (
            <PainCard key={graph.id} graph={graph} />
          ))}
        </div>
      </section>

      {archive.length > 1 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl">This week</h2>
          <ul className="mt-6 space-y-2">
            {archive.map((item) => (
              <li key={`${item.day}-${item.graph.id}`} className="text-sm">
                <span className="font-mono text-xs text-muted">{item.day}</span>
                {" · "}
                <Link
                  href={`/founders/gap/${item.graph.id}`}
                  className="text-copper hover:text-copper-2"
                >
                  {item.graph.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
