import Link from "next/link";
import type { Opportunity } from "@/lib/opportunities";

function Score({ value }: { value: number }) {
  const tone =
    value >= 85 ? "text-copper-2" : value >= 70 ? "text-paper" : "text-muted";
  return <span className={`font-mono tabular-nums ${tone}`}>{value}</span>;
}

export function Scoreboard({ items }: { items: Opportunity[] }) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center text-muted">
        No matching pain clusters yet. Try another market, or a broader search.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-ink-2 text-[11px] uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Opportunity</th>
            <th className="px-3 py-3 font-medium">Demand</th>
            <th className="px-3 py-3 font-medium">Pain</th>
            <th className="px-3 py-3 font-medium">Intent</th>
            <th className="px-3 py-3 font-medium">Competition</th>
            <th className="px-3 py-3 font-medium">Growth</th>
            <th className="px-3 py-3 font-medium">Build</th>
            <th className="px-4 py-3 font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.slug} className="border-t border-line hover:bg-ink-2">
              <td className="px-4 py-3">
                <Link
                  href={`/opportunities/${item.slug}`}
                  className="block py-1 text-paper hover:text-copper-2"
                >
                  {item.title}
                </Link>
                <div className="mt-1 text-xs text-muted">
                  {item.niche} · {item.country}
                </div>
              </td>
              <td className="px-3 py-3">
                <Score value={item.demand} />
              </td>
              <td className="px-3 py-3">
                <Score value={item.pain} />
              </td>
              <td className="px-3 py-3">
                <Score value={item.intent} />
              </td>
              <td className="px-3 py-3">
                <Score value={item.competition} />
              </td>
              <td className="px-3 py-3 font-mono text-signal">
                +{item.growth}%
              </td>
              <td className="px-3 py-3">
                <Score value={item.buildability} />
              </td>
              <td className="px-4 py-3 font-mono text-base text-copper-2">
                {item.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
