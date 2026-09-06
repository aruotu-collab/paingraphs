import Link from "next/link";
import { notFound } from "next/navigation";
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-copper">
        Founder gap · {graph.category.name} · {graph.subcategory.name}
      </p>
      <h1 className="mt-3 font-display text-5xl">{graph.title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{graph.summary}</p>
      <p className="mt-3 font-mono text-xs text-copper">
        Founder {Math.round(graph.scores.founder)} · Pain{" "}
        {Math.round(graph.scores.pain)} · Competition{" "}
        {Math.round(graph.scores.competition)} · Evidence {graph.evidenceCount}
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href={graph.href} className="text-copper hover:text-copper-2">
          Consumer PainGraph
        </Link>
        <Link href="/top-pains?view=founder" className="text-copper hover:text-copper-2">
          Founder Billboard
        </Link>
      </div>
      <section className="mt-12">
        <h2 className="font-display text-3xl">Where existing options fall short</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          This is scored from the same product-fit model consumers use. It does
          not include build strategy or affiliate destinations.
        </p>
        <div className="mt-8">
          <FounderGap gap={gap} />
        </div>
      </section>
    </main>
  );
}
