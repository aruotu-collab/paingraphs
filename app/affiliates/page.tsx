import Link from "next/link";
import { OpportunityCard } from "@/components/opportunity-card";
import { PainCard } from "@/components/pain-card";
import { listBillboardRows, sortBillboard } from "@/lib/opportunities/board";
import { recentOpportunities, todaysOpportunity } from "@/lib/opportunities/daily";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "For Affiliates",
  description:
    "Discover problems people are already trying to solve, see the products that address them, and find where those products may be monetised.",
};

export default async function AffiliatesPage() {
  const [featured, board, archive, session] = await Promise.all([
    todaysOpportunity("affiliate"),
    listBillboardRows(),
    recentOpportunities("affiliate", 5),
    getSession(),
  ]);
  const sample = sortBillboard(board, "affiliate").slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Promote</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight">
        Problems people are already trying to solve.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        See the products that address a pain, then save your own affiliate URL
        privately. Your link never replaces the public PainGraphs destination.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={session ? "/home?mode=promote" : "/signup?next=/home?mode=promote"}
          className="inline-block bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
        >
          {session ? "Open member home" : "Create an account"}
        </Link>
        <Link
          href="/top-pains?view=affiliate"
          className="inline-block border border-copper px-5 py-2.5 text-copper hover:bg-copper hover:text-ink"
        >
          Affiliate Billboard
        </Link>
      </div>

      {featured ? (
        <section className="mt-16">
          <OpportunityCard graph={featured} lens="affiliate" />
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="font-display text-3xl">Sample affiliate opportunities</h2>
        <p className="mt-3 text-sm text-muted">
          Live scores. Programme pages and the private vault stay behind an
          account.
        </p>
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
                <Link href={item.graph.href} className="text-copper hover:text-copper-2">
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
