import Link from "next/link";
import { listSavedMarkets } from "@/lib/actions";
import { MarketSearch } from "@/components/market-search";
import { SaveMarketButton } from "@/components/save-market-button";
import { Scoreboard } from "@/components/scoreboard";
import { searchOpportunities } from "@/lib/sample-data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({
  searchParams,
}: PageProps<"/opportunities">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const items = searchOpportunities(query);
  const session = await getSession();
  const saved = await listSavedMarkets();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-copper">
            Scoreboard
          </p>
          <h1 className="mt-2 font-display text-4xl">Opportunities</h1>
          <p className="mt-3 max-w-xl text-muted">
            Ranked pain clusters. Click a row to inspect evidence, scores, and
            current workarounds.
          </p>
        </div>
        <SaveMarketButton query={query} signedIn={Boolean(session)} />
      </div>
      <div className="mt-8 max-w-xl">
        <MarketSearch initialQuery={query} size="sm" />
      </div>
      {query ? (
        <p className="mt-5 text-sm text-muted">
          Showing sample matches for{" "}
          <span className="text-paper">“{query}”</span>
        </p>
      ) : null}
      <div className="mt-6">
        <Scoreboard items={items} />
      </div>
      {saved.length > 0 ? (
        <aside className="mt-10 border border-line p-5">
          <h2 className="text-xs uppercase tracking-[0.16em] text-muted">
            Saved markets
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {saved.map((market) => (
              <li key={market.id}>
                <Link
                  href={`/opportunities?q=${encodeURIComponent(market.query)}`}
                  className="text-paper hover:text-copper-2"
                >
                  {market.query}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </main>
  );
}
