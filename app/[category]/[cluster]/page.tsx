import { notFound } from "next/navigation";
import { PainCard } from "@/components/pain-card";
import { listMarketPains } from "@/lib/market/queries";

export const dynamic = "force-dynamic";

export default async function ClusterPage({
  params,
}: {
  params: Promise<{ category: string; cluster: string }>;
}) {
  const { category, cluster } = await params;
  const pains = (await listMarketPains()).filter(
    (pain) => pain.category.slug === category && pain.cluster.slug === cluster,
  );
  if (pains.length === 0) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        {pains[0].category.name}
      </p>
      <h1 className="mt-2 font-display text-5xl">{pains[0].cluster.name}</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Specific problems under this cluster. Open one for the decision tool and
        PainGraph.
      </p>
      <div className="mt-10 grid gap-4">
        {pains.map((pain) => (
          <PainCard key={pain.id} pain={pain} />
        ))}
      </div>
    </main>
  );
}
