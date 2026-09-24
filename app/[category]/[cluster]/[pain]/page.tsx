import Link from "next/link";
import { notFound } from "next/navigation";
import { PainCard } from "@/components/pain-card";
import { PainMatch } from "@/components/pain-match";
import { geoFromHeaders } from "@/lib/admin/visits";
import { headers } from "next/headers";
import { listSavedPainIds } from "@/lib/paingraph/actions";
import { decodeProfile } from "@/lib/paingraph/profile-url";
import { getPainGraphPage } from "@/lib/paingraph/queries";
import { getSavedProfile } from "@/lib/recommendations/store";
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
  searchParams,
}: {
  params: PainParams;
  searchParams: Promise<{ m?: string }>;
}) {
  const { category, cluster, pain } = await params;
  const query = await searchParams;
  const country = geoFromHeaders(await headers()).country;
  const page = await getPainGraphPage(category, cluster, pain, country);
  if (!page) notFound();
  const session = await getSession();
  const saved = (await listSavedPainIds()).includes(page.id);
  const slugs = page.criteria.map((item) => item.slug);
  const urlProfile = decodeProfile(query.m, slugs);
  const savedProfile = session
    ? await getSavedProfile(session.user.id, page.id, slugs)
    : null;

  return (
    <main className="min-w-0 max-w-full flex-1 overflow-x-clip bg-[#eef3ea]">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
        <a href="#pain-match" className="text-sm text-[#1f8a4d] hover:underline">
          Skip to what bothers you
        </a>
        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-[#1f8a4d]">
          <Link href={`/${page.category.slug}`} className="hover:underline">
            {page.category.name}
          </Link>
          {" · "}
          <Link
            href={`/${page.category.slug}/${page.subcategory.slug}`}
            className="hover:underline"
          >
            {page.subcategory.name}
          </Link>
        </p>
        <p className="mt-6 max-w-3xl text-base leading-7 text-[#5d7263]">
          {page.summary}
        </p>

        <div id="pain-match" className="mt-8 scroll-mt-28">
          <PainMatch
            painId={page.id}
            href={page.href}
            h1={page.h1}
            signedIn={Boolean(session)}
            saved={saved}
            savedProfile={urlProfile ?? savedProfile}
            criteria={page.criteria}
            products={page.products}
            evidenceCount={page.evidenceCount}
            evidence={page.evidence}
            after={
              page.related.length > 0 ? (
                <section>
                  <h2 className="font-display text-2xl text-[#12281a]">
                    Related pains
                  </h2>
                  <p className="mt-2 text-sm text-[#5d7263]">
                    Same matching idea, different concern set.
                  </p>
                  <div className="mt-4 grid gap-4">
                    {page.related.slice(0, 4).map((graph) => (
                      <PainCard key={graph.id} graph={graph} />
                    ))}
                  </div>
                </section>
              ) : null
            }
          />
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-5 text-[#5d7263]">
          PainGraphs may earn a commission from some links. Fit is based on
          what you said matters, not commission. Email stays off until you
          turn it on in alerts.
        </p>
      </div>
    </main>
  );
}
