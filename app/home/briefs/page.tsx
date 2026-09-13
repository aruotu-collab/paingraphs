import Link from "next/link";
import { CampaignBriefForm } from "@/components/campaign-brief-form";
import { listBriefs } from "@/lib/briefs/store";
import { entitlements } from "@/lib/identity/profile";
import { listAllPainGraphs, listPainGraphs } from "@/lib/paingraph/queries";
import { getAccess, requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function BriefsPage() {
  const session = await requireSession("/home/briefs");
  const { profile, capabilities } = await getAccess(session.user);
  const owner = capabilities.admin || capabilities.marketingAgent;
  const access = entitlements(profile, owner);
  const [graphs, briefs] = access.pro
    ? await Promise.all([
        owner ? listAllPainGraphs() : listPainGraphs(),
        listBriefs(session.user.id),
      ])
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
          <div className="mt-10">
            <CampaignBriefForm graphs={graphs} />
          </div>
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
