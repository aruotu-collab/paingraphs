import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: PageProps<"/opportunities/[slug]">) {
  const { slug } = await params;
  const item = await getOpportunity(slug);
  if (!item) notFound();

  const maxTrend = Math.max(...item.trend, 1);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <Link
        href="/opportunities"
        className="text-sm text-muted hover:text-paper"
      >
        ← Scoreboard
      </Link>
      <div className="mt-6 flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-copper">
            {item.industry} · {item.country}
          </p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{item.title}</h1>
          <p className="mt-3 text-muted">
            {item.persona} in {item.niche}
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-5xl text-copper-2">{item.score}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
            Opportunity · {item.confidence} confidence
          </div>
        </div>
      </div>

      <section className="grid gap-px bg-line md:grid-cols-4">
        {[
          ["Demand", item.demand],
          ["Pain", item.pain],
          ["Intent", item.intent],
          ["Signals", item.signalCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-ink px-5 py-6">
            <div className="text-xs uppercase tracking-[0.16em] text-muted">
              {label}
            </div>
            <div className="mt-2 font-mono text-2xl">
              {typeof value === "number" && value > 100
                ? value.toLocaleString()
                : value}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-2xl">Why this score</h2>
          <p className="mt-3 leading-7 text-muted">{item.why}</p>
          <h3 className="mt-8 text-xs uppercase tracking-[0.16em] text-muted">
            Evidence
          </h3>
          <ul className="mt-4 space-y-4">
            {item.quotes.map((quote) => (
              <li key={`${quote.url}-${quote.text}`} className="border border-line p-4">
                <p className="text-paper">“{quote.text}”</p>
                <p className="mt-2 text-xs text-muted">
                  {quote.url ? (
                    <a
                      href={quote.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-copper-2"
                    >
                      {quote.source}
                    </a>
                  ) : (
                    quote.source
                  )}{" "}
                  · {quote.date}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <aside className="space-y-8">
          <div>
            <h3 className="text-xs uppercase tracking-[0.16em] text-muted">
              12-month activity
            </h3>
            <div className="mt-4 flex h-24 items-end gap-1">
              {item.trend.map((point, index) => (
                <div
                  key={index}
                  className="flex-1 bg-copper/80"
                  style={{ height: `${(point / maxTrend) * 100}%` }}
                />
              ))}
            </div>
            <p className="mt-2 font-mono text-sm text-signal">+{item.growth}%</p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.16em] text-muted">
              Current workarounds
            </h3>
            {item.workarounds.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No workaround named in the evidence yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-paper">
                {item.workarounds.map((itemName) => (
                  <li key={itemName}>{itemName}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.16em] text-muted">
              Existing solutions
            </h3>
            {item.solutions.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No incumbent named in the evidence yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {item.solutions.map((solution) => (
                  <li key={solution.name}>
                    <div className="text-paper">{solution.name}</div>
                    <div className="text-muted">{solution.gap}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
