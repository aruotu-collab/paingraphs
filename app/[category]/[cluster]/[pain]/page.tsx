import Link from "next/link";
import { notFound } from "next/navigation";
import { PainRecommend } from "@/components/pain-recommend";
import { SavePainButton } from "@/components/save-pain-button";
import { listSavedPainIds } from "@/lib/paingraph/actions";
import { headers } from "next/headers";
import { geoFromHeaders } from "@/lib/admin/visits";
import { getPainGraphPage } from "@/lib/paingraph/queries";
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
    description: (page.narrative.hook || page.summary).slice(0, 160),
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

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <a
        href="#consult"
        className="text-sm text-copper hover:text-copper-2"
      >
        Skip to the consult
      </a>
      <p className="mt-6 text-xs uppercase tracking-[0.18em] text-copper">
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

      <div className="mt-10">
        <PainRecommend
          h1={page.h1}
          savedPriorities={savedPriorities}
          criteria={page.criteria}
          products={page.products}
          consumer={page.consumer}
          closeLine={page.narrative.trap}
          after={
            <section className="border border-line p-5">
              <h2 className="font-display text-2xl">Keep this PainGraph</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Save this so we can stay in touch. You will see updates on
                member home. Email is off until you turn it on.
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
              <p className="mt-6 text-xs leading-5 text-muted">
                PainGraphs may earn a commission from some links. Fit is based
                on what you told me, not commission.
              </p>
            </section>
          }
        />
      </div>
    </main>
  );
}
