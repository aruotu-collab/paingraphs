import Link from "next/link";
import { formatStamp } from "@/lib/admin/format";
import { loadAdminOverview } from "@/lib/admin/actions";
import { visitStats } from "@/lib/admin/visits";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdmin("/admin");
  let overview = await loadAdminOverview().catch((error) => {
    console.warn("Admin overview failed:", error);
    return null;
  });
  const visits = await visitStats();
  if (!overview) {
    overview = {
      users: 0,
      assessments: 0,
      watchlists: 0,
      hypotheses: 0,
      scans: 0,
      recentUsers: [],
    };
  }

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Admin command center</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        This surface is locked to your operator account. Shoppers still get
        PainGraphs and a watchlist. Affiliate lab, programme research, and
        visit logs stay here.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Users" value={overview.users} />
        <Kpi label="Visits (24h)" value={visits.day} />
        <Kpi label="Visits (7d)" value={visits.week} />
        <Kpi label="Unique IPs (7d)" value={visits.uniqueIpsWeek} />
        <Kpi label="PainGraphs done" value={overview.assessments} />
        <Kpi label="Watchlist rows" value={overview.watchlists} />
      </dl>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <section>
          <h2 className="font-display text-2xl">Top pages this week</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {visits.topPages.length === 0 ? (
              <li className="text-muted">No visits recorded yet.</li>
            ) : (
              visits.topPages.map((row) => (
                <li
                  key={row.path}
                  className="flex justify-between gap-4 border-b border-line py-2"
                >
                  <span className="truncate">{row.path}</span>
                  <span className="font-mono text-copper">{row.hits}</span>
                </li>
              ))
            )}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl">Where traffic came from</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {visits.topSources.length === 0 ? (
              <li className="text-muted">No sources recorded yet.</li>
            ) : (
              visits.topSources.map((row) => (
                <li
                  key={row.source}
                  className="flex justify-between gap-4 border-b border-line py-2"
                >
                  <Link
                    href={`/admin/visits?source=${encodeURIComponent(row.source)}`}
                    className="text-paper hover:text-copper-2"
                  >
                    {row.source}
                  </Link>
                  <span className="font-mono text-copper">{row.hits}</span>
                </li>
              ))
            )}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl">Top IPs this week</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {visits.topIps.length === 0 ? (
              <li className="text-muted">No IPs recorded yet.</li>
            ) : (
              visits.topIps.map((row) => (
                <li key={row.ip} className="border-b border-line py-2">
                  <div className="flex justify-between gap-4">
                    <Link
                      href={`/admin/visits?ip=${encodeURIComponent(row.ip)}`}
                      className="font-mono text-paper hover:text-copper-2"
                    >
                      {row.ip}
                    </Link>
                    <span className="font-mono text-copper">{row.hits}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {row.primary}
                    {row.country ? ` · ${row.country}` : ""}
                    {row.sources ? ` · ${row.sources}` : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Newest accounts</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {overview.recentUsers.map((person) => (
            <li key={person.id} className="border border-line px-4 py-3">
              {person.email} · {person.emailVerified ? "verified" : "unverified"} ·{" "}
              {formatStamp(person.createdAt, "date")}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/admin/pains" className="text-copper hover:text-copper-2">
            Pain page visits
          </Link>
          <Link href="/admin/visits" className="text-copper hover:text-copper-2">
            Open visit log
          </Link>
          <Link href="/workspace/lab" className="text-copper hover:text-copper-2">
            Open affiliate lab
          </Link>
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-ink px-4 py-5">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">
        {label}
      </dt>
      <dd className="mt-2 font-mono text-lg">{value}</dd>
    </div>
  );
}
