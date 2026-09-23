import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsumerShell } from "@/components/consumer-shell";
import { PainCard } from "@/components/pain-card";
import { RESERVED_PATHS } from "@/lib/catalog/data";
import { listPainGraphs } from "@/lib/paingraph/queries";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (RESERVED_PATHS.has(category)) notFound();
  const graphs = (await listPainGraphs()).filter(
    (graph) => graph.category.slug === category,
  );
  if (graphs.length === 0) notFound();

  const clusters = [
    ...new Map(
      graphs.map((graph) => [graph.subcategory.slug, graph.subcategory]),
    ).values(),
  ];

  return (
    <ConsumerShell>
      <p className="text-xs uppercase tracking-[0.18em] text-[#1f8a4d]">
        <Link href="/" className="hover:underline">
          Pains
        </Link>
        {" · "}
        {graphs[0].category.name}
      </p>
      <h1 className="mt-3 font-display text-5xl text-[#12281a]">
        {graphs[0].category.name}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5d7263]">
        Pick a cluster, then set the sliders on the PainGraph.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {clusters.map((cluster) => (
          <Link
            key={cluster.slug}
            href={`/${category}/${cluster.slug}`}
            className="rounded-full border border-[#d7e2d4] bg-white px-3 py-1.5 text-sm text-[#3f6b4c] hover:border-[#1f8a4d] hover:text-[#1f8a4d]"
          >
            {cluster.name}
          </Link>
        ))}
      </div>
      <div className="mt-10 grid gap-8">
        {clusters.map((cluster) => {
          const items = graphs.filter(
            (graph) => graph.subcategory.slug === cluster.slug,
          );
          return (
            <section key={cluster.slug}>
              <div className="flex items-end justify-between gap-3">
                <h2 className="font-display text-3xl text-[#12281a]">
                  {cluster.name}
                </h2>
                <Link
                  href={`/${category}/${cluster.slug}`}
                  className="text-sm text-[#1f8a4d] hover:underline"
                >
                  Open cluster
                </Link>
              </div>
              <div className="mt-4 grid gap-4">
                {items.map((graph) => (
                  <PainCard key={graph.id} graph={graph} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </ConsumerShell>
  );
}
