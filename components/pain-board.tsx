import { boardLeadJob, boardRows } from "@/lib/paingraph/board";
import type { PainCriterion, RecommendedProduct } from "@/lib/paingraph/types";

export function PainBoard({
  evidenceCount,
  criteria,
  products,
  proof,
}: {
  evidenceCount: number;
  criteria: PainCriterion[];
  products: RecommendedProduct[];
  proof?: string | null;
}) {
  const types = products.slice(0, 4);
  const rows = boardRows(criteria, types);
  if (rows.length === 0 && evidenceCount <= 0) return null;
  const job = boardLeadJob(rows, criteria[0]);

  return (
    <aside className="mt-10 border border-line">
      <div className="border-b border-line px-5 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-copper">
          The graph
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {proof?.trim() ||
            "Same jobs, scored for this pain. This is why the last pair still hurt."}
        </p>
      </div>
      <dl className="grid border-b border-line sm:grid-cols-3">
        <Stat
          value={evidenceCount > 0 ? String(evidenceCount) : "—"}
          label={
            evidenceCount === 1
              ? "public complaint selected"
              : "public complaints selected"
          }
        />
        <Stat
          value={types.length > 0 ? String(types.length) : "—"}
          label={types.length === 1 ? "type on the same jobs" : "types on the same jobs"}
        />
        <Stat value={job ?? "—"} label="the job generic lists blur" />
      </dl>
      {rows.length > 0 ? (
        <div className="space-y-8 px-5 py-6">
          {rows.map((row) => {
            const best = Math.max(...row.values.map((item) => item.score));
            return (
              <div key={row.slug}>
                <p className="text-sm text-paper">{row.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{row.detail}</p>
                <ul className="mt-4 space-y-3">
                  {types.map((product) => {
                    const score =
                      row.values.find((item) => item.productId === product.id)
                        ?.score ?? 0;
                    const lead = score === best && row.spread > 0;
                    return (
                      <li key={`${row.slug}-${product.id}`}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-xs text-muted">{product.name}</span>
                          <span
                            className={
                              lead
                                ? "font-mono text-xs text-copper"
                                : "font-mono text-xs text-muted"
                            }
                          >
                            {score}
                          </span>
                        </div>
                        <div className="mt-1 h-2 bg-ink-3">
                          <div
                            className={lead ? "h-2 bg-copper" : "h-2 bg-line"}
                            style={{ width: `${Math.max(score, 2)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
      <p className="border-t border-line px-5 py-3 text-xs leading-5 text-muted">
        Fit on the jobs above, from the evidence we have. Commission does not
        move a bar.
      </p>
    </aside>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-line px-5 py-4 sm:border-r sm:last:border-r-0">
      <dt className="text-xs leading-5 text-muted">{label}</dt>
      <dd className="mt-2 font-display text-3xl leading-none text-paper">{value}</dd>
    </div>
  );
}
