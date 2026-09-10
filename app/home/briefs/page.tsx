import Link from "next/link";
import { saveCampaignBrief } from "@/lib/briefs/actions";
import { BRIEF_OBJECTIVES } from "@/lib/briefs/build";
import { listBriefs } from "@/lib/briefs/store";
import { DESTINATION_COUNTRIES } from "@/lib/destinations/url";
import { entitlements } from "@/lib/identity/profile";
import { listPainGraphs } from "@/lib/paingraph/queries";
import { getAccess, requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function BriefsPage() {
  const session = await requireSession("/home/briefs");
  const { profile, capabilities } = await getAccess(session.user);
  const owner = capabilities.admin || capabilities.marketingAgent;
  const access = entitlements(profile, owner);
  const [graphs, briefs] = access.pro
    ? await Promise.all([listPainGraphs(), listBriefs(session.user.id)])
    : [[], []];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Member home · Campaign briefs
      </p>
      <h1 className="mt-3 font-display text-4xl">Draft the ad. Do not launch it here.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        PainGraphs writes a Google Ads-style brief from a PainGraph. You paste
        a destination you already created. Nothing goes live.
      </p>
      <Link href="/home" className="mt-4 inline-block text-sm text-copper hover:text-copper-2">
        Back to member home
      </Link>
      {!access.pro ? (
        <p className="mt-8 text-sm text-muted">
          Campaign briefs are Pro.{" "}
          <Link href="/pricing" className="text-copper hover:text-copper-2">
            Unlock Pro
          </Link>
        </p>
      ) : (
        <>
          <form
            action={saveCampaignBrief}
            autoComplete="off"
            className="mt-10 grid gap-3 border border-line p-5"
          >
            <select
              name="painId"
              required
              className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
            >
              <option value="" className="bg-ink">
                Choose a PainGraph
              </option>
              {graphs.map((graph) => (
                <option key={graph.id} value={graph.id} className="bg-ink">
                  {graph.title}
                </option>
              ))}
            </select>
            <div className="grid gap-3 md:grid-cols-3">
              <select
                name="market"
                autoComplete="off"
                defaultValue="*"
                className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
              >
                {DESTINATION_COUNTRIES.map((row) => (
                  <option key={row.code} value={row.code} className="bg-ink">
                    {row.label}
                  </option>
                ))}
              </select>
              <select
                name="objective"
                defaultValue="traffic"
                className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
              >
                {BRIEF_OBJECTIVES.map((value) => (
                  <option key={value} value={value} className="bg-ink">
                    {value}
                  </option>
                ))}
              </select>
              <input
                name="dailyBudget"
                placeholder="Daily budget"
                className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
              />
            </div>
            <input
              name="destinationUrl"
              type="url"
              placeholder="Optional tracking URL you already created"
              className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
            />
            <button
              type="submit"
              className="justify-self-start border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
            >
              Generate draft brief
            </button>
          </form>
          <ul className="mt-10">
            {briefs.length === 0 ? (
              <li className="text-sm text-muted">No briefs yet.</li>
            ) : (
              briefs.map((brief) => {
                const graph = graphs.find((item) => item.id === brief.painId);
                return (
                  <li key={brief.id} className="border-t border-line py-3">
                    <Link
                      href={`/home/briefs/${brief.id}`}
                      className="text-sm text-copper hover:text-copper-2"
                    >
                      {graph?.title ?? brief.painId}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {brief.objective} · {brief.country}
                    </p>
                  </li>
                );
              })
            )}
          </ul>
        </>
      )}
    </main>
  );
}
