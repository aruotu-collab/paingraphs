import Link from "next/link";
import { listPainTraffic } from "@/lib/admin/events";
import { clickCounts, destinationCounts } from "@/lib/destinations/store";
import { listAllPainGraphs } from "@/lib/paingraph/queries";
import { ownerMatchesByPain } from "@/lib/products/store";
import { nextMonetisationAction, programmeCounts } from "@/lib/programmes/store";

export const dynamic = "force-dynamic";

export default async function MarketingAgentPage() {
  const [graphs, destinations, programmes, clicks, traffic, owned] = await Promise.all([
    listAllPainGraphs(),
    destinationCounts(),
    programmeCounts(),
    clickCounts(),
    listPainTraffic(),
    ownerMatchesByPain(),
  ]);
  const visits = new Map(traffic.map((row) => [row.id, row.visits]));
  const board = [...graphs].sort((a, b) => b.scores.affiliate - a.scores.affiliate);

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">
        How can PainGraphs monetise this demand?
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Public clicks go through /go. Programme discovery is not a whitelist.
        Paste a tracking URL you already created, including country-specific
        ones. Fit scores do not change.
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 pr-3">Pain</th>
              <th className="py-2 pr-3">Intent</th>
              <th className="py-2 pr-3">Affiliate</th>
              <th className="py-2 pr-3">Founder</th>
              <th className="py-2 pr-3">Visits</th>
              <th className="py-2 pr-3">Programmes</th>
              <th className="py-2 pr-3">Destinations</th>
              <th className="py-2 pr-3">Clicks</th>
              <th className="py-2 pr-3">Owned</th>
              <th className="py-2">Next</th>
            </tr>
          </thead>
          <tbody>
            {board.slice(0, 20).map((graph) => {
              const destCount = destinations.get(graph.id) ?? 0;
              const programmeCount = programmes.get(graph.id) ?? 0;
              const clickCount = clicks.get(graph.id) ?? 0;
              return (
                <tr key={graph.id} className="border-t border-line">
                  <td className="py-3 pr-3">
                    <Link
                      href={`/marketing-agent/${graph.id}`}
                      className="text-copper hover:text-copper-2"
                    >
                      {graph.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-3 font-mono">
                    {Math.round(graph.scores.buyingIntent)}
                  </td>
                  <td className="py-3 pr-3 font-mono">
                    {Math.round(graph.scores.affiliate)}
                  </td>
                  <td className="py-3 pr-3 font-mono">
                    {Math.round(graph.scores.founder)}
                  </td>
                  <td className="py-3 pr-3 font-mono">{visits.get(graph.id) ?? 0}</td>
                  <td className="py-3 pr-3 font-mono">{programmeCount}</td>
                  <td className="py-3 pr-3 font-mono">{destCount}</td>
                  <td className="py-3 pr-3 font-mono">{clickCount}</td>
                  <td className="py-3 pr-3 text-xs text-muted">
                    {(owned.get(graph.id) ?? []).slice(0, 2).join(", ") || "—"}
                  </td>
                  <td className="py-3 text-muted">
                    {nextMonetisationAction({
                      affiliateScore: graph.scores.affiliate,
                      founderScore: graph.scores.founder,
                      destinations: destCount,
                      programmes: programmeCount,
                      clicks: clickCount,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
