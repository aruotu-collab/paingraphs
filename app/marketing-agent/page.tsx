import Link from "next/link";
import {
  formatMoney,
  listMoneyBoardRows,
  moneyHref,
  parseMoneyGap,
  parseMoneySort,
  type MoneyGap,
  type MoneySort,
} from "@/lib/monetisation/board";

export const dynamic = "force-dynamic";

const GAPS: { id: MoneyGap; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "needs-destination", label: "Needs destination" },
  { id: "has-clicks", label: "Has clicks" },
  { id: "owned", label: "Owned product" },
];

const SORTS: { id: MoneySort; label: string }[] = [
  { id: "affiliate", label: "Affiliate" },
  { id: "intent", label: "Intent" },
  { id: "clicks", label: "Clicks" },
  { id: "visits", label: "Visits" },
  { id: "revenue", label: "Revenue" },
];

export default async function MarketingAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ gap?: string; sort?: string }>;
}) {
  const query = await searchParams;
  const gap = parseMoneyGap(query.gap);
  const sort = parseMoneySort(query.sort);
  const board = await listMoneyBoardRows(gap, sort);

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">
        How can PainGraphs monetise this demand?
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Public clicks go through /go. EPC only appears after you record a
        merchant conversion. PainGraphs will not invent revenue.
      </p>
      <nav className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        {GAPS.map((item) => (
          <Link
            key={item.id}
            href={moneyHref({ gap: item.id, sort })}
            className={
              gap === item.id
                ? "border border-copper px-3 py-1.5 text-copper"
                : "border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <nav className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        {SORTS.map((item) => (
          <Link
            key={item.id}
            href={moneyHref({ gap, sort: item.id })}
            className={
              sort === item.id
                ? "border border-copper px-3 py-1.5 text-copper"
                : "border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 pr-3">Pain</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Intent</th>
              <th className="py-2 pr-3">Affiliate</th>
              <th className="py-2 pr-3">Visits</th>
              <th className="py-2 pr-3">Clicks</th>
              <th className="py-2 pr-3">CTR</th>
              <th className="py-2 pr-3">Revenue</th>
              <th className="py-2 pr-3">EPC</th>
              <th className="py-2 pr-3">Destinations</th>
              <th className="py-2">Next</th>
            </tr>
          </thead>
          <tbody>
            {board.length === 0 ? (
              <tr className="border-t border-line">
                <td colSpan={11} className="py-3 text-sm text-muted">
                  Nothing in this filter.
                </td>
              </tr>
            ) : (
              board.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="py-3 pr-3">
                    <Link
                      href={row.href}
                      className="text-copper hover:text-copper-2"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-xs text-muted">{row.status}</td>
                  <td className="py-3 pr-3 font-mono">{row.intent}</td>
                  <td className="py-3 pr-3 font-mono">{row.affiliate}</td>
                  <td className="py-3 pr-3 font-mono">{row.visits}</td>
                  <td className="py-3 pr-3 font-mono">{row.clicks}</td>
                  <td className="py-3 pr-3 font-mono">
                    {row.ctr == null ? "—" : `${row.ctr.toFixed(1)}%`}
                  </td>
                  <td className="py-3 pr-3 font-mono">
                    {row.revenue > 0 ? formatMoney(row.revenue) : "—"}
                  </td>
                  <td className="py-3 pr-3 font-mono">
                    {row.epc == null ? "—" : formatMoney(row.epc)}
                  </td>
                  <td className="py-3 pr-3 font-mono">{row.destinations}</td>
                  <td className="py-3 text-muted">{row.next}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
