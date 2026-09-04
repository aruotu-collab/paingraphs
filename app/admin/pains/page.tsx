import Link from "next/link";
import { listPainTraffic } from "@/lib/admin/events";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPainTrafficPage() {
  await requireAdmin("/admin/pains");
  const rows = await listPainTraffic();
  const visits = rows.reduce((sum, row) => sum + row.visits, 0);
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Pain page traffic</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Visits are page loads. PainGraph clicks are people who press See my
        PainGraph on that page. IPs and sources are unique humans on that pain,
        excluding bots.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
        <div className="bg-ink px-4 py-5">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">
            Pain pages
          </dt>
          <dd className="mt-2 font-mono text-lg">{rows.length}</dd>
        </div>
        <div className="bg-ink px-4 py-5">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">
            Visits
          </dt>
          <dd className="mt-2 font-mono text-lg">{visits}</dd>
        </div>
        <div className="bg-ink px-4 py-5">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">
            PainGraph clicks
          </dt>
          <dd className="mt-2 font-mono text-lg">{clicks}</dd>
        </div>
      </dl>

      <div className="mt-8 space-y-6">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No published pains yet.</p>
        ) : (
          rows.map((row) => (
            <section key={row.id} className="border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link
                    href={row.href}
                    className="font-display text-2xl text-paper hover:text-copper-2"
                  >
                    {row.title}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted">{row.href}</p>
                </div>
                <dl className="flex gap-6 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">
                      Visits
                    </dt>
                    <dd className="mt-1 font-mono">{row.visits}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">
                      PainGraph clicks
                    </dt>
                    <dd className="mt-1 font-mono">{row.clicks}</dd>
                  </div>
                </dl>
              </div>

              {row.visitors.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No human visits yet.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-muted">
                      <tr>
                        <th className="py-2 pr-3">IP</th>
                        <th className="py-2 pr-3">From</th>
                        <th className="py-2 pr-3">Geo</th>
                        <th className="py-2 text-right">Hits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.visitors.map((visitor) => (
                        <tr key={visitor.ip} className="border-t border-line">
                          <td className="py-2 pr-3">
                            <Link
                              href={`/admin/visits?ip=${encodeURIComponent(visitor.ip)}&path=${encodeURIComponent(row.href)}`}
                              className="font-mono text-xs text-paper hover:text-copper-2"
                            >
                              {visitor.ip}
                            </Link>
                          </td>
                          <td className="py-2 pr-3">
                            <Link
                              href={`/admin/visits?source=${encodeURIComponent(visitor.source)}`}
                              className="text-copper hover:text-copper-2"
                            >
                              {visitor.source}
                            </Link>
                            {visitor.sources && visitor.sources !== `${visitor.source} ${visitor.hits}` ? (
                              <div className="mt-1 text-xs text-muted">
                                {visitor.sources}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-2 pr-3 text-xs text-muted">
                            {[visitor.country, visitor.city].filter(Boolean).join(" · ") || "—"}
                          </td>
                          <td className="py-2 text-right font-mono">{visitor.hits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </main>
  );
}
