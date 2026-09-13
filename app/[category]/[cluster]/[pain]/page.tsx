import Link from "next/link";
import { notFound } from "next/navigation";
import { PainRecommend } from "@/components/pain-recommend";
import { SavePainButton } from "@/components/save-pain-button";
import { WatchPriceButton } from "@/components/watch-price-button";
import { latestPrice, watchedPriceIds } from "@/lib/prices/store";
import { listSavedPainIds } from "@/lib/paingraph/actions";
import { experienceFromComments } from "@/lib/paingraph/experience";
import { headers } from "next/headers";
import { geoFromHeaders } from "@/lib/admin/visits";
import { getPainGraphPage } from "@/lib/paingraph/queries";
import { visibleUnmetNeed } from "@/lib/paingraph/rank";
import { getSavedPriorities } from "@/lib/recommendations/store";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type PainParams = Promise<{
  category: string;
  cluster: string;
  pain: string;
}>;

export async function generateMetadata({ params }: { params: PainParams }) {
  const { category, cluster, pain } = await params;
  const page = await getPainGraphPage(category, cluster, pain);
  if (!page) return { title: "Pain not found" };
  return {
    title: page.title,
    description: page.summary,
    alternates: { canonical: page.href },
  };
}

export default async function PainGraphPage({
  params,
}: {
  params: PainParams;
}) {
  const { category, cluster, pain } = await params;
  const country = geoFromHeaders(await headers()).country;
  const page = await getPainGraphPage(category, cluster, pain, country);
  if (!page) notFound();
  const session = await getSession();
  const saved = (await listSavedPainIds()).includes(page.id);
  const savedPriorities = session
    ? await getSavedPriorities(
        session.user.id,
        page.id,
        page.criteria.map((item) => item.slug),
      )
    : null;
  const watching = session
    ? await watchedPriceIds(session.user.id, page.id)
    : new Set<string>();
  const priceFlags = new Map<string, boolean>();
  for (const product of page.products) {
    const recorded = await latestPrice(product.id, page.id);
    priceFlags.set(product.id, Boolean(product.priceBand || recorded));
  }
  const voices = experienceFromComments(page.evidence);
  const unmetNeed = visibleUnmetNeed(page.criteria, page.products);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        <Link href={`/${page.category.slug}`} className="hover:text-copper-2">
          {page.category.name}
        </Link>
        {" · "}
        <Link
          href={`/${page.category.slug}/${page.subcategory.slug}`}
          className="hover:text-copper-2"
        >
          {page.subcategory.name}
        </Link>
      </p>
      <h1 className="mt-3 font-display text-5xl leading-tight">{page.h1}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{page.summary}</p>
      <p className="mt-4 font-mono text-xs text-copper">
        Pain {Math.round(page.scores.pain)}
        {page.scores.growth > 0 ? ` · Trend ${Math.round(page.scores.growth)}` : ""}
      </p>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Why this happens</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
          {page.consumer.whyItHappens}
        </p>
        {voices.length > 0 ? (
          <div className="mt-6 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.16em] text-copper">
              How people describe it
            </p>
            <ul className="mt-3 space-y-3">
              {voices.map((line) => (
                <li key={line} className="text-sm leading-6 text-paper">
                  “{line}”
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              Shortened from public complaints. The wording is theirs; the
              selection is ours.
            </p>
          </div>
        ) : null}
        {page.consumer.profile ? (
          <p className="mt-6 max-w-2xl text-sm leading-7 text-muted">
            <span className="text-paper">Pain profile. </span>
            {page.consumer.profile}
          </p>
        ) : null}
        {page.consumer.recentlyChanged ? (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
            <span className="text-paper">What has changed. </span>
            {page.consumer.recentlyChanged}
          </p>
        ) : null}
      </section>

      {page.consumer.triedFirst.length > 0 || page.consumer.usuallyFails.length > 0 ? (
        <section className="mt-12 grid gap-8 md:grid-cols-2">
          {page.consumer.triedFirst.length > 0 ? (
            <div>
              <h2 className="font-display text-3xl">What people try first</h2>
              <ul className="mt-5 space-y-2 text-sm leading-6 text-muted">
                {page.consumer.triedFirst.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {page.consumer.usuallyFails.length > 0 ? (
            <div>
              <h2 className="font-display text-3xl">What usually fails</h2>
              <ul className="mt-5 space-y-2 text-sm leading-6 text-muted">
                {page.consumer.usuallyFails.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mt-12">
        <PainRecommend
          painId={page.id}
          href={page.href}
          signedIn={Boolean(session)}
          savedPriorities={savedPriorities}
          criteria={page.criteria}
          products={page.products}
          consumer={page.consumer}
          evidenceCount={page.evidenceCount}
        />
      </div>

      <p className="mt-10 text-xs leading-6 text-muted">
        PainGraphs may earn a commission from some links. Product-fit rankings
        are based on suitability and selected preferences, not commission.
      </p>

      {page.related.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl">People also struggle with</h2>
          <ul className="mt-5 space-y-2">
            {page.related.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="text-sm text-copper hover:text-copper-2">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12 border border-line p-5">
        <h2 className="font-display text-2xl">Keep this PainGraph</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Save the pain to follow updates. You will see them on member home
          when evidence, products, or a public Check price destination change.
          Recommendation sliders can be saved separately above. Email is off
          until you turn it on.
        </p>
        <div className="mt-4">
          <SavePainButton
            painId={page.id}
            saved={saved}
            signedIn={Boolean(session)}
          />
          {saved ? (
            <p className="mt-3 text-xs text-muted">
              Following updates.{" "}
              <Link href="/home/alerts" className="text-copper hover:text-copper-2">
                Manage email
              </Link>
              .
            </p>
          ) : null}
        </div>
        {session ? (
          <ul className="mt-6 space-y-3">
            {page.products.map((product) => (
              <li key={product.id} className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  {product.name}
                  {product.priceBand ? (
                    <span className="ml-2 font-mono text-xs text-muted">
                      {product.priceBand}
                    </span>
                  ) : null}
                </p>
                <WatchPriceButton
                  painId={page.id}
                  productId={product.id}
                  watching={watching.has(product.id)}
                  hasPrice={priceFlags.get(product.id) ?? false}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <article className="border border-line p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-copper">Founder</p>
          <p className="mt-2 font-display text-2xl">
            Founder score {Math.round(page.scores.founder)}
          </p>
          {unmetNeed ? (
            <p className="mt-3 text-sm leading-6 text-muted">{unmetNeed}</p>
          ) : null}
          <p className="mt-2 font-mono text-xs text-copper">
            Pain {Math.round(page.scores.pain)}
            {page.scores.growth > 0 ? ` · Trend ${Math.round(page.scores.growth)}` : ""}
          </p>
          <Link
            href={`/founders/gap/${page.id}`}
            className="mt-4 inline-block text-sm text-copper hover:text-copper-2"
          >
            Open gap analysis
          </Link>
        </article>
        <article className="border border-line p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-copper">Affiliate</p>
          <p className="mt-2 font-display text-2xl">
            Affiliate score {Math.round(page.scores.affiliate)}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            {page.products.length === 1
              ? "1 product found"
              : `${page.products.length} products found`}
            . Rankings stay based on fit.
          </p>
          <p className="mt-2 font-mono text-xs text-copper">
            Buying intent {Math.round(page.scores.buyingIntent)}
          </p>
          <Link
            href="/affiliates"
            className="mt-4 inline-block text-sm text-copper hover:text-copper-2"
          >
            Explore Affiliate Intelligence
          </Link>
        </article>
      </section>
    </main>
  );
}
