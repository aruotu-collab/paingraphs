import Link from "next/link";
import { notFound } from "next/navigation";
import { ComplaintQuotes } from "@/components/complaint-quotes";
import { PainQuiz } from "@/components/pain-quiz";
import { WatchButton } from "@/components/watch-button";
import { listWatchIds } from "@/lib/market/actions";
import { getPainPage } from "@/lib/market/queries";
import { parseQuizWeights } from "@/lib/market/quiz-state";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type PainParams = Promise<{
  category: string;
  cluster: string;
  pain: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: PainParams;
}) {
  const { category, cluster, pain } = await params;
  const page = await getPainPage(category, cluster, pain);
  if (!page) return { title: "Pain not found" };
  return {
    title: page.title,
    description: page.problem,
    alternates: { canonical: page.href },
  };
}

export default async function PainDecisionPage({
  params,
  searchParams,
}: {
  params: PainParams;
  searchParams: Promise<{ graph?: string; w?: string }>;
}) {
  const { category, cluster, pain } = await params;
  const page = await getPainPage(category, cluster, pain);
  if (!page) notFound();
  const session = await getSession();
  const watching = (await listWatchIds()).includes(page.id);
  const query = await searchParams;
  const reveal = Boolean(session) && query.graph === "1";
  const initialPriorities = parseQuizWeights(
    query.w,
    page.criteria.map((item) => item.slug),
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        <Link href={`/${page.category.slug}`} className="hover:text-copper-2">
          {page.category.name}
        </Link>
        {" · "}
        <Link
          href={`/${page.category.slug}/${page.cluster.slug}`}
          className="hover:text-copper-2"
        >
          {page.cluster.name}
        </Link>
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">{page.h1}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{page.problem}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border border-line px-3 py-1.5">
        <WatchButton
          painId={page.id}
          watching={watching}
          signedIn={Boolean(session)}
          next={page.href}
          flush
        />
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-6 gap-y-1 text-xs uppercase tracking-[0.14em] text-muted">
          {[
            ["Pain", page.painScore],
            ["Intent", page.intentScore],
            ["Organic", page.organicScore],
            ["Opportunity", page.opportunity],
          ].map(([label, value]) => (
            <span key={String(label)} className="whitespace-nowrap">
              {label}{" "}
              <span className="font-mono text-paper">{value}</span>
            </span>
          ))}
        </div>
      </div>

      {page.signals.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">
            What people actually complain about
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            These are public comments, not marketing copy. Skim a few until you
            recognise the same problem you have. If that is enough, skip ahead
            to the analysis underneath.
          </p>
          <ComplaintQuotes quotes={page.signals} />
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl">PainGraphs analysis</h2>
        <p className="mt-3 max-w-3xl whitespace-pre-line leading-7 text-muted">
          {page.analysis}
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="border border-line p-5">
            <h3 className="text-xs uppercase tracking-[0.16em] text-muted">
              Why now
            </h3>
            <p className="mt-3 text-sm leading-6 text-paper">{page.whyNow}</p>
          </div>
          <div className="border border-line p-5">
            <h3 className="text-xs uppercase tracking-[0.16em] text-muted">
              Organic opportunity
            </h3>
            <p className="mt-3 text-sm leading-6 text-paper">
              Enough people search this, and most pages still pick one winner.
              A report that lets you set your own priorities is the useful
              version of that page.
            </p>
          </div>
        </div>
        <div className="mt-6 border border-line p-5">
          <h3 className="text-xs uppercase tracking-[0.16em] text-muted">
            Comparison criteria
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            These are the five things we score. When you move the sliders
            later, you are saying which of these matters most in your ranking.
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {page.criteria.map((item) => (
              <li key={item.slug}>
                <span className="text-paper">{item.name}</span>
                <span className="block text-sm text-muted">{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-[0.16em] text-muted">
            How this pain scores
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            These numbers sit behind the report. They are not the ranking of
            products — that comes from the sliders at the bottom.
          </p>
          <section className="mt-4 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "Pain",
                page.painScore,
                "How severe this problem is, scored from real complaints. 100 is a daily, widely reported failure.",
              ],
              [
                "Search intent",
                page.intentScore,
                "How clearly people are already looking for a product that fixes it, not just venting.",
              ],
              [
                "Organic opportunity",
                page.organicScore,
                "How much room there is for a useful page to rank, because most current pages are thin lists.",
              ],
              [
                "Opportunity",
                page.opportunity,
                "The overall chance this pain is worth a proper answer — a real product decision, not a passing moan.",
              ],
            ].map(([label, value, detail]) => (
              <div key={String(label)} className="bg-ink px-5 py-6">
                <div className="text-xs uppercase tracking-[0.16em] text-muted">
                  {label}
                </div>
                <div className="mt-2 font-mono text-2xl">{value}</div>
                <p className="mt-3 text-xs leading-5 text-muted">{detail}</p>
              </div>
            ))}
          </section>
          <p className="mt-3 text-xs leading-5 text-muted">
            Competition {page.competitionScore} is how crowded the search
            results are. Product gap {page.productGap} is how poorly current
            products answer the complaint. Affiliate {page.affiliateScore} is
            whether honest product links are available.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Who each option is best for</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          This page is a short report, not a “best overall” list. These are
          types of product, not a single recommended model. None of them wins
          every criterion. After this, a one-minute set of sliders makes the
          ranking about your situation.
        </p>
        <ul className="mt-5 space-y-4">
          {page.products.map((product) => (
            <li key={product.id} className="border border-line p-5">
              <h3 className="font-display text-2xl">{product.name}</h3>
              <p className="mt-1 text-sm text-copper">{product.whoFor}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{product.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <PainQuiz
        page={page}
        signedIn={Boolean(session)}
        reveal={reveal}
        initialPriorities={initialPriorities}
      />

      {page.related.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">Related pains</h2>
          <p className="mt-2 text-sm text-muted">
            Other problems in the same category, if this was close but not
            quite yours.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {page.related.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="text-paper hover:text-copper-2">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-12 text-xs leading-6 text-muted">
        Affiliate disclosure: if you buy through a search or retailer link,
        PainGraphs may earn a commission. Recommendations are scored against the
        criteria on this page, not against who pays us. Pages are decision tools,
        not copied merchant descriptions.
      </p>
    </main>
  );
}
