import { explainFit, readWeights } from "@/lib/market/explain";
import { productCtaLabel, productHref } from "@/lib/affiliate/clickbank";
import type { PainPage, Priorities } from "@/lib/market/types";

export function PainGraphReport({
  page,
  shares,
  ranked,
  affiliateOffer,
}: {
  page: PainPage;
  shares: Priorities;
  ranked: PainPage["products"];
  affiliateOffer?: {
    name: string;
    hopLink: string;
    reasons: string[];
    productFit: number;
  } | null;
}) {
  const reading = readWeights(page.criteria, shares);
  const winner = ranked[0];

  return (
    <div id="pain-graph-result" className="mt-10 border border-copper/40 bg-ink p-5 md:p-7">
      <p className="text-xs uppercase tracking-[0.16em] text-copper">
        Your PainGraph
      </p>
      <h3 className="mt-2 font-display text-3xl leading-tight">{reading.headline}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{reading.body}</p>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
        The picture on the left is your mix of priorities. A point further from
        the centre means that factor counts more in this ranking. The bars on
        the right are the same numbers as percentages that add up to 100%.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,240px)_1fr] md:items-center">
        <PriorityRadar criteria={page.criteria} shares={shares} />
        <div>
          <p className="text-xs text-muted">
            How much each factor counts in your ranking
          </p>
          <div className="mt-2 flex h-3 w-full overflow-hidden bg-ink-3">
            {page.criteria.map((item, index) => {
              const value = shares[item.slug] ?? 0;
              if (value <= 0) return null;
              return (
                <div
                  key={item.slug}
                  className="h-full bg-copper"
                  style={{
                    width: `${Math.min(value, 100)}%`,
                    opacity: 0.35 + index * 0.13,
                  }}
                  title={`${item.name} ${value}%`}
                />
              );
            })}
          </div>
          <ul className="mt-4 space-y-3">
            {page.criteria.map((item) => {
              const value = shares[item.slug] ?? 0;
              return (
                <li key={item.slug}>
                  <div className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-mono text-copper">{value}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-ink-3">
                    <div
                      className="h-full bg-copper"
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {winner ? (
        <div className="mt-8 border border-copper/50 bg-ink-2 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-copper">
            Best fit for your mix
          </p>
          <p className="mt-2 font-display text-2xl leading-tight">
            {winner.name}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Of the options on this page, this one scored highest against the
            mix you set
            {ranked[1] ? `, then ${ranked[1].name}` : ""}. That is not “the
            best product in general”. It is the best of these for what you said
            matters.
          </p>
        </div>
      ) : null}

      {affiliateOffer && winner && winner.match >= 55 && affiliateOffer.productFit >= 55 ? (
        <div className="mt-6 border border-copper/40 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-copper">
            Recommended solution
          </p>
          <p className="mt-2 font-display text-2xl">{affiliateOffer.name}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Strong match for the training priorities you selected.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            {affiliateOffer.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <a
            href={affiliateOffer.hopLink}
            target="_blank"
            rel="noreferrer sponsored"
            className="mt-4 inline-block bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
          >
            View program
          </a>
        </div>
      ) : affiliateOffer ? (
        <div className="mt-6 border border-line p-5">
          <p className="text-sm leading-6 text-muted">
            We could not find a sufficiently strong match to recommend that
            offer against the mix you set. Watch this pain if you want to be
            told when a better solution appears.
          </p>
        </div>
      ) : null}

      <p className="mt-6 text-sm leading-6 text-muted">
        Below is every option on this page, in order. The percentage is how
        well it scored on the mix you set — 100% would mean it was strong on
        everything you cared about. The small bars are that option’s score on
        each factor, from 0 (poor) to 100 (excellent).
      </p>
      <ol className="mt-4 space-y-4">
        {ranked.map((product, index) => {
          const fit = explainFit(product, page.criteria, shares);
          return (
            <li
              key={product.id}
              className={`bg-ink-2 p-5 ${
                index === 0 ? "border border-copper/50" : "border border-line"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    {index === 0 ? "First" : `Option ${index + 1}`}
                  </p>
                  <h4 className="mt-1 font-display text-2xl">{product.name}</h4>
                  <p className="mt-1 text-sm text-copper">{product.whoFor}</p>
                </div>
                <span className="font-mono text-lg text-copper">
                  {product.match}% fit
                </span>
              </div>
              <div className="mt-3 h-1.5 bg-ink-3">
                <div
                  className="h-full bg-copper"
                  style={{ width: `${Math.min(product.match, 100)}%` }}
                />
              </div>
              {fit.best && fit.worst ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <p className="text-sm leading-6 text-paper">
                    Strongest on {fit.best.name.toLowerCase()} (score{" "}
                    {fit.best.score} out of 100).
                  </p>
                  {fit.worst.slug !== fit.best.slug ? (
                    <p className="text-sm leading-6 text-muted">
                      Weakest on {fit.worst.name.toLowerCase()} (score{" "}
                      {fit.worst.score} out of 100).
                    </p>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-2 text-sm text-muted">{product.note}</p>
              {product.summary !== product.note ? (
                <p className="mt-2 text-sm text-muted">{product.summary}</p>
              ) : null}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {fit.rows.map((row) => (
                  <div key={row.slug} className="flex items-center gap-2 text-xs">
                    <span className="w-28 shrink-0 text-muted">{row.name}</span>
                    <div className="h-1.5 flex-1 bg-ink-3">
                      <div
                        className="h-full bg-paper/70"
                        style={{ width: `${Math.min(row.score, 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-muted">
                      {row.score}
                    </span>
                  </div>
                ))}
              </div>
              {product.match >= 55 ? (
                <a
                  href={productHref(product.searchQuery)}
                  target="_blank"
                  rel="noreferrer sponsored"
                  className="mt-4 inline-block text-sm text-paper hover:text-copper-2"
                >
                  {productCtaLabel(product.searchQuery)}
                  {product.priceBand ? ` · ${product.priceBand}` : ""}
                </a>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted">
                  This option does not fit the mix you set well enough to
                  recommend. Watch the pain if you want to be told when a
                  stronger match appears.
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function PriorityRadar({
  criteria,
  shares,
}: {
  criteria: PainPage["criteria"];
  shares: Priorities;
}) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 78;
  const count = Math.max(criteria.length, 3);
  const peak = Math.max(...criteria.map((item) => shares[item.slug] ?? 0), 1);
  const points = criteria.map((item, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const value = (shares[item.slug] ?? 0) / peak;
    return {
      x: round(cx + radius * value * Math.cos(angle)),
      y: round(cy + radius * value * Math.sin(angle)),
      lx: round(cx + (radius + 32) * Math.cos(angle)),
      ly: round(cy + (radius + 32) * Math.sin(angle)),
      name: item.name,
    };
  });
  const rings = [0.35, 0.65, 1];
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-[240px] text-copper"
      role="img"
      aria-label="A radar graph of how much each factor counts in your ranking"
    >
      {rings.map((ring) => (
        <polygon
          key={ring}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.22"
          points={criteria
            .map((_, index) => {
              const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
              return `${round(cx + radius * ring * Math.cos(angle))},${round(cy + radius * ring * Math.sin(angle))}`;
            })
            .join(" ")}
        />
      ))}
      {points.map((point, index) => (
        <line
          key={`axis-${index}`}
          x1={cx}
          y1={cy}
          x2={round(cx + radius * Math.cos(-Math.PI / 2 + (index * 2 * Math.PI) / count))}
          y2={round(cy + radius * Math.sin(-Math.PI / 2 + (index * 2 * Math.PI) / count))}
          stroke="currentColor"
          strokeOpacity="0.28"
        />
      ))}
      <polygon
        points={polygon}
        fill="rgba(196, 146, 61, 0.28)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {points.map((point) => (
        <text
          key={point.name}
          x={point.lx}
          y={point.ly}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[#e7ead9]"
          fontSize="9"
        >
          {point.name.split(" / ")[0].slice(0, 12)}
        </text>
      ))}
    </svg>
  );
}
