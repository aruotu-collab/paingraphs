import Link from "next/link";
import {
  listBillboardRows,
  sortBillboard,
  type BillboardView,
} from "@/lib/opportunities/board";
import { movementFor } from "@/lib/ranks/snapshots";

export const dynamic = "force-dynamic";

const VIEWS: { id: BillboardView; label: string }[] = [
  { id: "pain", label: "Pain" },
  { id: "affiliate", label: "Affiliate" },
  { id: "founder", label: "Founder" },
  { id: "intent", label: "Intent" },
  { id: "growth", label: "Growth" },
];

export default async function AdminRankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const query = await searchParams;
  const view = VIEWS.some((item) => item.id === query.view)
    ? (query.view as BillboardView)
    : "pain";
  const rows = sortBillboard(await listBillboardRows(), view);
  const movement = await movementFor(
    view,
    rows.map((row) => row.id),
  );

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Rankings</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Daily snapshots power movement on the Billboard. Run ingest to capture
        today if the job has not run yet.
      </p>
      <nav className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        {VIEWS.map((item) => (
          <Link
            key={item.id}
            href={
              item.id === "pain"
                ? "/admin/rankings"
                : `/admin/rankings?view=${item.id}`
            }
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
      <ol className="mt-8">
        {rows.map((graph, index) => {
          const change = movement.get(graph.id);
          const label = change?.isNew
            ? "NEW"
            : change?.delta == null
              ? "—"
              : change.delta > 0
                ? `↑ ${change.delta}`
                : change.delta < 0
                  ? `↓ ${Math.abs(change.delta)}`
                  : "=";
          return (
            <li
              key={graph.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3"
            >
              <p className="text-sm">
                <span className="font-mono text-copper">#{index + 1}</span>{" "}
                {graph.title}
              </p>
              <p className="font-mono text-xs text-muted">{label}</p>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
