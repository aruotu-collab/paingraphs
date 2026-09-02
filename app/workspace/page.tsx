import Link from "next/link";
import { redirect } from "next/navigation";
import { CampaignPackView } from "@/components/campaign-pack";
import { MetricsForm } from "@/components/metrics-form";
import { ProductScanForm } from "@/components/product-scan-form";
import {
  listWorkspace,
  publishHypothesisPage,
} from "@/lib/journeys/actions";
import { parsePack, parseQuestions } from "@/lib/journeys/parse";
import { isAdminEmail } from "@/lib/admin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/workspace");
  const data = await listWorkspace();
  const hyps = data?.hyps ?? [];
  const scans = data?.scans ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Workspace · one account
      </p>
      <h1 className="mt-3 font-display text-4xl">Earn and build from the same login.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Reverse URL scans live here.{" "}
        {isAdminEmail(session.user.email) ? (
          <>
            Operator tools are in the{" "}
            <Link href="/admin" className="text-copper hover:text-copper-2">
              admin console
            </Link>{" "}
            and{" "}
            <Link href="/workspace/lab" className="text-copper hover:text-copper-2">
              affiliate lab
            </Link>
            .{" "}
          </>
        ) : null}
        <Link href="/watchlist" className="text-copper hover:text-copper-2">
          Consumer watchlist
        </Link>{" "}
        is still available. You run ads from your own Meta and Google accounts.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Paste a product URL</h2>
        <div className="mt-5">
          <ProductScanForm signedIn intent="founder" />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl">Your scans</h2>
        {scans.length === 0 ? (
          <p className="mt-4 text-sm text-muted">None yet this month. Limit is 5 analyses.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {scans.map((scan) => (
              <li key={scan.id} className="border border-line px-4 py-3">
                {scan.name} · {scan.url}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16 space-y-8">
        <h2 className="font-display text-3xl">Hypotheses and campaign packs</h2>
        {hyps.length === 0 ? (
          <p className="text-sm text-muted">
            Run a scan to generate hypothesized pains. Catalog matches appear here too.
          </p>
        ) : (
          hyps.map((row) => {
            const pack = parsePack(row.campaignPack);
            const questions = parseQuestions(row.questions);
            return (
              <article key={row.id} className="border border-line p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-copper">
                  {row.status.replaceAll("_", " ")} · {row.origin}
                </p>
                <h3 className="mt-2 font-display text-3xl">{row.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{row.problem}</p>
                <p className="mt-2 text-sm">Audience: {row.audience}</p>
                {row.isPublic ? (
                  <Link
                    href={`/test/${row.slug}`}
                    className="mt-3 inline-block text-sm text-copper hover:text-copper-2"
                  >
                    Open hosted test page
                  </Link>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await publishHypothesisPage(row.id);
                    }}
                    className="mt-4"
                  >
                    <button
                      type="submit"
                      className="border border-copper px-4 py-2 text-sm text-copper hover:bg-copper hover:text-ink"
                    >
                      Host a PainGraphs test page
                    </button>
                  </form>
                )}
                <div className="mt-6">
                  <CampaignPackView pack={pack} />
                </div>
                <p className="mt-4 text-xs text-muted">
                  Questionnaire has {questions.length} questions. After you run ads,
                  paste the numbers. PainGraphs judges quiz completes and “I have
                  this problem”, not clicks alone.
                </p>
                <MetricsForm hypothesisId={row.id} />
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

