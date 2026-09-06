import { notFound } from "next/navigation";
import { PainCard } from "@/components/pain-card";
import { listPainGraphs } from "@/lib/paingraph/queries";

export const dynamic = "force-dynamic";

export default async function ClusterPage({
  params,
}: {
  params: Promise<{ category: string; cluster: string }>;
}) {
  const { category, cluster } = await params;
  const graphs = (await listPainGraphs()).filter(
    (graph) =>
      graph.category.slug === category && graph.subcategory.slug === cluster,
  );
  if (graphs.length === 0) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        {graphs[0].category.name} · {graphs[0].subcategory.name}
      </p>
      <h1 className="mt-3 font-display text-5xl">{graphs[0].subcategory.name}</h1>
      <div className="mt-10 grid gap-4">
        {graphs.map((graph) => (
          <PainCard key={graph.id} graph={graph} />
        ))}
      </div>
    </main>
  );
}
