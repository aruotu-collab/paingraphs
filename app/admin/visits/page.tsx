import Link from "next/link";
import { formatStamp, visitCountryLabel } from "@/lib/admin/format";
import { listVisits, sourceLabel, visitStats } from "@/lib/admin/visits";

export const dynamic = "force-dynamic";

export default async function AdminVisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ ip?: string; path?: string; bots?: string }>;
}) {
  const query = await searchParams;
  const hideBots = query.bots !== "1";
  const [rows, stats] = await Promise.all([
    listVisits({
      ip: query.ip,
      path: query.path,
      hideBots,
      limit: 200,
    }),
    visitStats(),
  ]);

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Visits</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Pages people opened, the IP that hit the app, the country the host sent,
        and the link that brought them here. Country is empty on localhost — it
        fills in on Vercel from the request headers.
      </p>

      <dl className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat label="All visits" value={stats.all} />
        <Stat label="24h" value={stats.day} />
        <Stat label="Humans / 7d" value={stats.humans} />
        <Stat label="Unique IPs / 7d" value={stats.uniqueIpsWeek} />
      </dl>

      <section className="mt-10 grid gap-8 lg:grid-cols-3">
        <div>
          <h2 className="font-display text-2xl">Pages clicked</h2>
          <HitList
            rows={stats.topPages.map((row) => ({
              key: row.path,
              label: row.path,
              hits: row.hits,
              href: `/admin/visits?path=${encodeURIComponent(row.path)}`,
            }))}
            empty="No page hits yet."
          />
        </div>
        <div>
          <h2 className="font-display text-2xl">IPs</h2>
          <HitList
            rows={stats.topIps.map((row) => ({
              key: row.ip,
              label: `${row.ip} · ${visitCountryLabel(row.country)}`,
              hits: row.hits,
              href: `/admin/visits?ip=${encodeURIComponent(row.ip)}`,
            }))}
            empty="No IPs yet."
          />
        </div>
        <div>
          <h2 className="font-display text-2xl">Sources</h2>
          <HitList
            rows={stats.topSources.map((row) => ({
              key: row.source,
              label: row.source,
              hits: row.hits,
            }))}
            empty="No sources yet."
          />
        </div>
      </section>

      <form className="mt-10 flex flex-wrap items-end gap-3 text-sm" method="get">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Path
          </span>
          <input
            name="path"
            defaultValue={query.path ?? ""}
            className="mt-1 block border border-line bg-ink px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            IP
          </span>
          <input
            name="ip"
            defaultValue={query.ip ?? ""}
            className="mt-1 block border border-line bg-ink px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 pb-2">
          <input type="checkbox" name="bots" value="1" defaultChecked={!hideBots} />
          Show bots
        </label>
        <button type="submit" className="border border-line px-3 py-2 text-copper">
          Filter
        </button>
        {query.path || query.ip || query.bots ? (
          <Link href="/admin/visits" className="pb-2 text-muted hover:text-copper">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Page</th>
              <th className="py-2 pr-3">IP</th>
              <th className="py-2 pr-3">Country</th>
              <th className="py-2">Brought by</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="py-6 text-muted" colSpan={5}>
                  No visits match. Open a public page, then refresh.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const source = sourceLabel(row);
                return (
                  <tr key={row.id} className="border-t border-line align-top">
                    <td className="py-3 pr-3 font-mono text-xs text-muted">
                      {formatStamp(row.createdAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <p>{row.path}</p>
                      {row.query ? (
                        <p className="font-mono text-xs text-muted">{row.query}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs">
                      <Link
                        href={`/admin/visits?ip=${encodeURIComponent(row.ip)}`}
                        className="hover:text-copper"
                      >
                        {row.ip}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">
                      <p>{visitCountryLabel(row.country)}</p>
                      {row.city ? (
                        <p className="text-xs text-muted">{row.city}</p>
                      ) : null}
                    </td>
                    <td className="py-3">
                      <p>{source.source}</p>
                      {row.referrer ? (
                        <p className="break-all font-mono text-xs text-muted">
                          {row.referrer}
                        </p>
                      ) : (
                        <p className="text-xs text-muted">No inbound link</p>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line p-4">
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-2 font-display text-3xl">{value}</dd>
    </div>
  );
}

function HitList({
  rows,
  empty,
}: {
  rows: { key: string; label: string; hits: number; href?: string }[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-muted">{empty}</p>;
  }
  return (
    <ul className="mt-4">
      {rows.map((row) => (
        <li
          key={row.key}
          className="flex justify-between gap-3 border-t border-line py-2 text-sm"
        >
          {row.href ? (
            <Link href={row.href} className="truncate hover:text-copper">
              {row.label}
            </Link>
          ) : (
            <span className="truncate">{row.label}</span>
          )}
          <span className="font-mono text-xs text-muted">{row.hits}</span>
        </li>
      ))}
    </ul>
  );
}
