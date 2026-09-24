import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsumerShell } from "@/components/consumer-shell";
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
    <ConsumerShell>
      <p className="text-xs uppercase tracking-[0.18em] text-[#1f8a4d]">
        <Link href={`/${graphs[0].category.slug}`} className="hover:underline">
          {graphs[0].category.name}
        </Link>
        {" · "}
        {graphs[0].subcategory.name}
      </p>
      <h1 className="mt-3 break-words font-display text-[2rem] leading-tight text-[#12281a] sm:text-5xl">
        {graphs[0].subcategory.name}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5d7263]">
        Open a PainGraph and move the sliders for what you cannot live with.
      </p>
      <div className="mt-10 grid gap-4">
        {graphs.map((graph) => (
          <PainCard key={graph.id} graph={graph} />
        ))}
      </div>
    </ConsumerShell>
  );
}
