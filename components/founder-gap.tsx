import type { FounderGap } from "@/lib/opportunities/gap";

export function FounderGap({
  gap,
  detail = true,
}: {
  gap: FounderGap;
  detail?: boolean;
}) {
  return (
    <div className="space-y-6">
      {gap.unmetNeed ? (
        <p className="text-sm leading-6 text-paper">{gap.unmetNeed}</p>
      ) : (
        <p className="text-sm leading-6 text-muted">
          Existing options cover the scored criteria. The gap, if any, is in
          combining them without the usual trade-offs.
        </p>
      )}
      <p className="font-mono text-xs text-copper">
        {gap.productCount === 1
          ? "1 scored product"
          : `${gap.productCount} scored products`}
        {gap.weakest
          ? ` · Weakest coverage ${gap.weakest.name} ${Math.round(gap.weakest.best)}`
          : ""}
      </p>
      {detail ? (
        <ul className="space-y-3">
          {gap.criteria.map((item) => (
            <li key={item.slug} className="border-t border-line pt-3">
              <p className="text-sm text-paper">{item.name}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>
              <p className="mt-1 font-mono text-xs text-copper">
                Best existing score {Math.round(item.best)}
                {item.covered ? " · covered" : " · open gap"}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {detail && gap.usuallyFails.length > 0 ? (
        <div>
          <h3 className="text-xs uppercase tracking-[0.16em] text-copper">
            What current options usually fail
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            {gap.usuallyFails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {detail && gap.tradeoffs.length > 0 ? (
        <div>
          <h3 className="text-xs uppercase tracking-[0.16em] text-copper">
            Trade-offs a new product would have to beat
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            {gap.tradeoffs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
