import Link from "next/link";
import { formatMoney } from "@/lib/monetisation/board";
import { programmeKindLabel } from "@/lib/programmes/labels";
import {
  listProviderHosts,
  listProviderProgrammes,
} from "@/lib/providers/board";

export const dynamic = "force-dynamic";

function formatDay(value: Date | null) {
  if (!value) return "—";
  return value.toISOString().slice(0, 10);
}

export default async function MarketingAgentProvidersPage() {
  const [hosts, programmes] = await Promise.all([
    listProviderHosts(),
    listProviderProgrammes(),
  ]);

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Providers</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Hosts come from destinations you pasted. Programme names come from the
        catalog. Clicks and revenue wait for /go and a merchant sale you log.
        PainGraphs will not invent a HopLink, Amazon search, or checkout.
      </p>

      <h2 className="mt-10 font-display text-2xl">Live destinations</h2>
      {hosts.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No public destination yet. Paste a tracking URL on a pain first.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {hosts.map((host) => (
            <section key={host.host} className="border border-line p-5">
              <h3 className="font-display text-xl">{host.host}</h3>
              <p className="mt-2 font-mono text-xs text-copper">
                {host.destinations} destinations · {host.pains} pains ·{" "}
                {host.clicks} clicks ·{" "}
                {host.revenue > 0 ? formatMoney(host.revenue) : "No revenue"} ·
                last click {formatDay(host.lastClickAt)}
              </p>
              <ul className="mt-4">
                {host.rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-baseline justify-between gap-3 border-t border-line py-3 text-sm"
                  >
                    <div>
                      <Link
                        href={`/marketing-agent/${row.painId}`}
                        className="text-copper hover:text-copper-2"
                      >
                        {row.painTitle}
                      </Link>
                      <p className="mt-1 text-xs text-muted">
                        {row.productName} · {row.countryLabel}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-muted">
                      {row.clicks} clicks
                      {row.revenue > 0 ? ` · ${formatMoney(row.revenue)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <h2 className="mt-12 font-display text-2xl">Programme landscape</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Confirmation is yours after you join. A stored join page is the official
        publisher entry, not a product listing.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 pr-3">Programme</th>
              <th className="py-2 pr-3">Kind</th>
              <th className="py-2 pr-3">Products</th>
              <th className="py-2 pr-3">Confirmed</th>
              <th className="py-2 pr-3">Pending</th>
              <th className="py-2">Join</th>
            </tr>
          </thead>
          <tbody>
            {programmes.map((row) => (
              <tr key={row.name} className="border-t border-line">
                <td className="py-3 pr-3">{row.name}</td>
                <td className="py-3 pr-3 text-xs text-muted">
                  {programmeKindLabel(row.kind)}
                </td>
                <td className="py-3 pr-3 font-mono">{row.products}</td>
                <td className="py-3 pr-3 font-mono">{row.confirmed}</td>
                <td className="py-3 pr-3 font-mono">{row.pending}</td>
                <td className="py-3">
                  {row.joinUrl ? (
                    <a
                      href={row.joinUrl}
                      rel="nofollow"
                      className="text-xs uppercase tracking-[0.14em] text-copper hover:text-copper-2"
                    >
                      Open programme
                    </a>
                  ) : (
                    <span className="text-xs text-muted">
                      No official join page stored
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
