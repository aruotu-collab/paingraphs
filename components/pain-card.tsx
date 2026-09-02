import Link from "next/link";
import { marketplaceLabels } from "@/lib/journeys/labels";
import type { MarketPain } from "@/lib/market/types";

export function PainCard({
  pain,
  extra,
}: {
  pain: MarketPain;
  extra?: boolean;
}) {
  const labels = marketplaceLabels(pain);
  return (
    <Link
      href={pain.href}
      className="block border border-line bg-ink-2 p-5 transition-colors hover:border-copper"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            {pain.category.name} · {pain.cluster.name}
          </p>
          <h2 className="mt-2 font-display text-2xl">{pain.title}</h2>
        </div>
        <span className="font-mono text-sm text-copper">
          {labels.rising ? "🔥" : "↑"} {labels.trend}
          {pain.trend > 0 ? ` +${pain.trend}%` : ""}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted">{pain.problem}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Stat label="Pain" value={pain.painScore} />
        <Stat label="Intent" value={pain.intentScore} />
        {extra ? (
          <>
            <Stat label="Affiliate" value={labels.affiliate} />
            <Stat label="Founder" value={labels.founder} />
          </>
        ) : (
          <>
            <Stat label="Organic" value={pain.organicScore} />
            <Stat label="Opportunity" value={pain.opportunity} />
          </>
        )}
      </dl>
      <p className="mt-4 text-xs text-copper">{pain.strategy}</p>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-paper">{value}</dd>
    </div>
  );
}
