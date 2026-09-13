import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnyPainGraph } from "@/lib/paingraph/queries";
import {
  RANK_VIEWS,
  rankHistoryFor,
} from "@/lib/ranks/snapshots";
import type { BillboardView } from "@/lib/opportunities/board";

export const dynamic = "force-dynamic";

const VIEWS: { id: BillboardView; label: string }[] = [
  { id: "pain", label: "Pain" },
  { id: "affiliate", label: "Affiliate" },
  { id: "founder", label: "Founder" },
  { id: "intent", label: "Intent" },
  { id: "growth", label: "Growth" },
];

export default async function AdminRankHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ painId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { painId } = await params;
  const query = await searchParams;
  const view = VIEWS.some((item) => item.id === query.view)
    ? (query.view as BillboardView)
    : "pain";
  const graph = await getAnyPainGraph(painId);
  if (!graph) notFound();
  const history = RANK_VIEWS.includes(view)
    ? await rankHistoryFor(painId, view, 14)
    : [];

  return (
    <main className="pb-16">
      <Link href="/admin/rankings" className="text-sm text-copper hover:text-copper-2">
        Back to rankings
      </Link>
      <h1 className="mt-6 font-display text-4xl">{graph.title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Daily Billboard snapshots. Conversion-informed affiliate score only
        moves after you record a real sale. Product-fit sliders do not use this.
      </p>
      <p className="mt-3 font-mono text-xs text-copper">
        Affiliate {Math.round(graph.scores.affiliate)}
        {graph.scores.outcome
          ? ` · Outcome +${Math.round(graph.scores.outcome)}`
          : " · Outcome 0"}
        {" · "}
        {graph.status}
      </p>
      <nav className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        {VIEWS.map((item) => (
          <Link
            key={item.id}
            href={`/admin/rankings/${painId}?view=${item.id}`}
            className={
              view === item.id
                ? "border border-copper px-3 py-1.5 text-copper"
                : "border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {history.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No daily snapshots yet. Run ingest to capture today.
        </p>
      ) : (
        <ol className="mt-8">
          {history.map((row) => (
            <li
              key={row.day}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3 text-sm"
            >
              <p className="font-mono text-xs text-muted">{row.day}</p>
              <p>
                <span className="font-mono text-copper">#{row.rank}</span>
                <span className="ml-3 text-muted">
                  score {Math.round(row.score)}
                </span>
              </p>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
