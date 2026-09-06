import Link from "next/link";
import { listPainGraphs } from "@/lib/paingraph/queries";
import { requireSession } from "@/lib/session";
import { memberDestinationCounts } from "@/lib/vault/store";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const session = await requireSession("/home/vault");
  const [graphs, counts] = await Promise.all([
    listPainGraphs(),
    memberDestinationCounts(session.user.id),
  ]);
  const board = [...graphs].sort((a, b) => b.scores.affiliate - a.scores.affiliate);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Promote · Private vault
      </p>
      <h1 className="mt-3 font-display text-4xl">Your affiliate URLs stay private.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Save tracking URLs you already created. They never replace the public
        PainGraphs Check price link. Programme discovery is a starting list,
        not a whitelist.
      </p>
      <Link
        href="/home?mode=promote"
        className="mt-4 inline-block text-sm text-copper hover:text-copper-2"
      >
        Back to member home
      </Link>
      <ul className="mt-10">
        {board.map((graph) => (
          <li
            key={graph.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3"
          >
            <div>
              <Link
                href={`/home/vault/${graph.id}`}
                className="text-sm text-copper hover:text-copper-2"
              >
                {graph.title}
              </Link>
              <p className="mt-1 text-xs text-muted">
                Affiliate {Math.round(graph.scores.affiliate)} ·{" "}
                {counts.get(graph.id) ?? 0} private URLs
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
