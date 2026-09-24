import { formatStamp } from "@/lib/admin/format";
import { listPainMisses, painMissStats } from "@/lib/misses/store";

export const dynamic = "force-dynamic";

export default async function AdminMissesPage() {
  const [rows, stats] = await Promise.all([listPainMisses(), painMissStats()]);

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Misses</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        People typed a pain and we had no PainGraph. Repeats rise. This is the
        roadmap — not invented search volume.
      </p>

      <dl className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">
            Distinct pains
          </dt>
          <dd className="mt-2 font-display text-3xl">{stats.queries}</dd>
        </div>
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">
            Times asked
          </dt>
          <dd className="mt-2 font-display text-3xl">{stats.hits}</dd>
        </div>
      </dl>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No misses saved yet.</p>
      ) : (
        <table className="mt-10 w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.14em] text-muted">
              <th className="py-2 pr-3 font-medium">Pain they typed</th>
              <th className="py-2 pr-3 font-medium">Hits</th>
              <th className="py-2 font-medium">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="py-3 pr-3">{row.query}</td>
                <td className="py-3 pr-3 font-mono text-copper">{row.hits}</td>
                <td className="py-3 text-muted">{formatStamp(row.lastSeenAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
