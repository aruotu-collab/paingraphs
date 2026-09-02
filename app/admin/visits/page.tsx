import Link from "next/link";
import { PurgeVisitsButton } from "@/components/purge-visits-button";
import { listVisits, sourceLabel } from "@/lib/admin/visits";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminVisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ ip?: string; path?: string; bots?: string; source?: string }>;
}) {
  await requireAdmin("/admin/visits");
  const params = await searchParams;
  const hideBots = params.bots !== "1";
  const rows = await listVisits({
    ip: params.ip?.trim(),
    path: params.path?.trim(),
    source: params.source?.trim(),
    hideBots,
    limit: 300,
  });

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Page visits and IPs</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Source is the first place that session arrived from: Direct, ChatGPT,
        Google, Claude, and so on. Later clicks on the site keep that landing
        source. The referrer column is the raw URL when the browser sent one.
      </p>

      <form className="mt-6 flex flex-wrap gap-3" action="/admin/visits">
        <input
          name="path"
          defaultValue={params.path ?? ""}
          placeholder="Filter path"
          className="h-10 border border-line bg-ink px-3 text-sm outline-none"
        />
        <input
          name="ip"
          defaultValue={params.ip ?? ""}
          placeholder="Filter IP"
          className="h-10 border border-line bg-ink px-3 text-sm outline-none"
        />
        <input
          name="source"
          defaultValue={params.source ?? ""}
          placeholder="Source e.g. ChatGPT"
          className="h-10 border border-line bg-ink px-3 text-sm outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="bots" value="1" defaultChecked={!hideBots} />
          Include bots
        </label>
        <button
          type="submit"
          className="h-10 bg-copper px-4 text-sm text-ink hover:bg-copper-2"
        >
          Filter
        </button>
        <PurgeVisitsButton />
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Path</th>
              <th className="py-2 pr-3">IP</th>
              <th className="py-2 pr-3">From</th>
              <th className="py-2 pr-3">Geo</th>
              <th className="py-2 pr-3">Account</th>
              <th className="py-2 pr-3">Referrer</th>
              <th className="py-2">Agent</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-muted">
                  No visits match. Open the site in a new tab from ChatGPT or
                  Google to seed a labelled source.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const from = sourceLabel(row);
                return (
                  <tr key={row.id} className="border-t border-line align-top">
                    <td className="py-3 pr-3 font-mono text-xs whitespace-nowrap">
                      {row.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="py-3 pr-3">
                      <Link href={row.path} className="text-paper hover:text-copper-2">
                        {row.path}
                      </Link>
                      {row.query ? (
                        <div className="mt-1 max-w-xs truncate text-xs text-muted">
                          ?{row.query}
                        </div>
                      ) : null}
                      {row.isBot ? (
                        <div className="text-xs text-signal">bot</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3">
                      <Link
                        href={`/admin/visits?ip=${encodeURIComponent(row.ip)}`}
                        className="font-mono text-xs text-paper hover:text-copper-2"
                      >
                        {row.ip}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">
                      <Link
                        href={`/admin/visits?source=${encodeURIComponent(from.source)}`}
                        className="text-copper hover:text-copper-2"
                      >
                        {from.source}
                      </Link>
                      {from.host && from.source !== from.host ? (
                        <div className="mt-1 font-mono text-[11px] text-muted">
                          {from.host}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {[row.country, row.city].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="py-3 pr-3 text-xs">{row.email || "guest"}</td>
                    <td className="py-3 pr-3 max-w-[180px] truncate text-xs text-muted">
                      {row.referrer || "direct / none"}
                    </td>
                    <td className="py-3 max-w-[220px] truncate text-xs text-muted">
                      {row.userAgent || "—"}
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
