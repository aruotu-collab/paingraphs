import { RunIngestButton } from "@/components/run-ingest-button";
import { listPainTraffic } from "@/lib/admin/events";
import { formatStamp } from "@/lib/admin/format";
import { visitStats } from "@/lib/admin/visits";
import { latestIngestRun } from "@/lib/discovery/store";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const [visits, traffic, ingest] = await Promise.all([
    visitStats(),
    listPainTraffic(),
    latestIngestRun(),
  ]);
  const summary = ingest
    ? (JSON.parse(ingest.summary) as Record<string, unknown>)
    : null;

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Site health</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Traffic, PainGraph engagement, and the last discovery job. The job does
        not crawl the web.
      </p>
      <dl className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">All visits</dt>
          <dd className="mt-2 font-display text-3xl">{visits.all}</dd>
        </div>
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">24h</dt>
          <dd className="mt-2 font-display text-3xl">{visits.day}</dd>
        </div>
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Humans / 7d</dt>
          <dd className="mt-2 font-display text-3xl">{visits.humans}</dd>
        </div>
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Unique IPs / 7d</dt>
          <dd className="mt-2 font-display text-3xl">{visits.uniqueIpsWeek}</dd>
        </div>
      </dl>
      <section className="mt-10">
        <h2 className="font-display text-2xl">Discovery job</h2>
        <p className="mt-3 text-sm text-muted">
          {ingest
            ? `Last run ${formatStamp(ingest.finishedAt)} · ${ingest.ok ? "ok" : "failed"}`
            : "Not run yet."}
        </p>
        {summary ? (
          <p className="mt-2 font-mono text-xs text-muted">
            matched {String(summary.matched ?? 0)} · created{" "}
            {String(summary.created ?? 0)} · clustered {String(summary.clustered ?? 0)}{" "}
            · scores {String(summary.scores ?? 0)}
          </p>
        ) : null}
        <div className="mt-4">
          <RunIngestButton />
        </div>
      </section>
      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">Top pages</h2>
          <ul className="mt-4">
            {visits.topPages.map((row) => (
              <li
                key={row.path}
                className="flex justify-between gap-3 border-t border-line py-2 text-sm"
              >
                <span className="truncate">{row.path}</span>
                <span className="font-mono text-xs text-muted">{row.hits}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-2xl">Top sources</h2>
          <ul className="mt-4">
            {visits.topSources.map((row) => (
              <li
                key={row.source}
                className="flex justify-between gap-3 border-t border-line py-2 text-sm"
              >
                <span>{row.source}</span>
                <span className="font-mono text-xs text-muted">{row.hits}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl">PainGraph traffic</h2>
        <ul className="mt-4">
          {traffic.slice(0, 12).map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap justify-between gap-3 border-t border-line py-2 text-sm"
            >
              <span>{row.title}</span>
              <span className="font-mono text-xs text-muted">
                {row.visits} visits · {row.clicks} clicks
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
