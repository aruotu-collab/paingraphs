import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsumerShell } from "@/components/consumer-shell";
import { FounderGap } from "@/components/founder-gap";
import { founderGapFromPage } from "@/lib/opportunities/gap";
import { getPainGraph, getPainGraphPage } from "@/lib/paingraph/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ painId: string }>;
}) {
  const { painId } = await params;
  const graph = await getPainGraph(painId);
  return {
    title: graph ? `Gap: ${graph.title}` : "Gap not found",
  };
}

export default async function FounderGapPage({
  params,
}: {
  params: Promise<{ painId: string }>;
}) {
  const { painId } = await params;
  const graph = await getPainGraph(painId);
  if (!graph) notFound();
  const page = await getPainGraphPage(
    graph.category.slug,
    graph.subcategory.slug,
    graph.slug,
  );
  if (!page) notFound();
  const gap = founderGapFromPage(page);

  return (
    <ConsumerShell>
      <p className="text-xs uppercase tracking-[0.16em] text-[#1f8a4d]">
        Founder gap · {graph.category.name} · {graph.subcategory.name}
      </p>
      <h1 className="mt-3 font-display text-5xl text-[#12281a]">{graph.title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5d7263]">
        {graph.summary}
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href={graph.href} className="text-[#1f8a4d] hover:underline">
          Open the customer PainGraph
        </Link>
        <Link href="/top-pains?view=founder" className="text-[#1f8a4d] hover:underline">
          Founder Billboard
        </Link>
      </div>
      <section className="mt-12 rounded-2xl border border-[#d7e2d4] bg-white p-5">
        <h2 className="font-display text-3xl text-[#12281a]">
          Where existing kinds fall short
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5d7263]">
          Scored with the same slider match customers use. A deal-breaker gap
          means every kind is blocked when that concern is set to 10.
        </p>
        <div className="mt-8">
          <FounderGap gap={gap} />
        </div>
      </section>
    </ConsumerShell>
  );
}
