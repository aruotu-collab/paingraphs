import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignBriefForm } from "@/components/campaign-brief-form";
import { ConversionForm } from "@/components/conversion-form";
import { DestinationForm } from "@/components/destination-form";
import { ProgrammeList } from "@/components/programme-list";
import {
  clickCounts,
  conversionTotals,
  listDestinationsForPain,
  productsForPain,
} from "@/lib/destinations/store";
import { paidAcquisitionScore } from "@/lib/paingraph/paid";
import { listAllPainGraphs } from "@/lib/paingraph/queries";
import { listProgrammesForProducts } from "@/lib/programmes/store";

export const dynamic = "force-dynamic";

export default async function MarketingAgentPainPage({
  params,
}: {
  params: Promise<{ painId: string }>;
}) {
  const { painId } = await params;
  const [graphs, products, destinations, clicks, revenue] = await Promise.all([
    listAllPainGraphs(),
    productsForPain(painId),
    listDestinationsForPain(painId),
    clickCounts(),
    conversionTotals(),
  ]);
  const graph = graphs.find((item) => item.id === painId);
  if (!graph) notFound();
  const money = revenue.get(painId) ?? { amount: 0, count: 0 };
  const paid = paidAcquisitionScore({
    intent: graph.scores.buyingIntent,
    organic: graph.scores.reachability ?? 0,
    competition: graph.scores.competition,
    published: graph.status === "published",
    destinations: destinations.length,
    evidenceCount: graph.evidenceCount,
    revenue: money.amount,
    clicks: clicks.get(painId) ?? 0,
    sensitive: graph.sensitive,
  });
  const programmes = await listProgrammesForProducts(
    products.map((item) => item.id),
  );
  const destinationsByProduct = new Map<string, typeof destinations>();
  for (const destination of destinations) {
    const existing = destinationsByProduct.get(destination.productId) ?? [];
    existing.push(destination);
    destinationsByProduct.set(destination.productId, existing);
  }
  const programmesByProduct = new Map<string, typeof programmes>();
  for (const programme of programmes) {
    const existing = programmesByProduct.get(programme.productId) ?? [];
    existing.push(programme);
    programmesByProduct.set(programme.productId, existing);
  }

  return (
    <main className="pb-16">
      <p className="mt-8 text-xs uppercase tracking-[0.16em] text-copper">
        {graph.category.name} · {graph.subcategory.name}
      </p>
      <h1 className="mt-3 font-display text-4xl">{graph.title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Public Check price goes through /go so clicks can be counted. You can
        save a default URL and optional country-specific URLs. Programme
        confirmation is yours after you join. PainGraphs will not invent a
        HopLink, Amazon search, or eBay search.
      </p>
      <ol className="mt-4 max-w-2xl list-decimal space-y-1 pl-5 text-sm leading-6 text-muted">
        <li>Open a programme for the product type.</li>
        <li>Join it and create a tracking URL for a specific SKU.</li>
        <li>Paste that URL, optionally for a country. Check price goes live.</li>
      </ol>
      <p className="mt-3 font-mono text-xs text-copper">
        Affiliate {Math.round(graph.scores.affiliate)} · Intent{" "}
        {Math.round(graph.scores.buyingIntent)} · Ads {paid} · {graph.status}
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href={graph.href} className="text-copper hover:text-copper-2">
          View public PainGraph
        </Link>
        <Link href="/home/briefs" className="text-copper hover:text-copper-2">
          All campaign briefs
        </Link>
      </div>

      <section className="mt-10 space-y-6">
        {products.length === 0 ? (
          <p className="text-sm text-muted">
            No scored products on this PainGraph yet.
          </p>
        ) : (
          products.map((product) => {
            const productDestinations = destinationsByProduct.get(product.id) ?? [];
            return (
              <article key={product.id} className="border border-line p-5">
                <h2 className="font-display text-2xl">{product.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{product.summary}</p>
                {product.priceBand ? (
                  <p className="mt-2 font-mono text-xs text-copper">{product.priceBand}</p>
                ) : null}
                <p className="mt-2 text-sm text-muted">{product.note}</p>
                <h3 className="mt-6 text-xs uppercase tracking-[0.16em] text-copper">
                  Programme discovery
                </h3>
                <ProgrammeList
                  painId={painId}
                  confirmable
                  programmes={programmesByProduct.get(product.id) ?? []}
                />
                <h3 className="mt-6 text-xs uppercase tracking-[0.16em] text-copper">
                  Public destinations
                </h3>
                {productDestinations.length === 0 ? (
                  <p className="mt-3 text-xs text-muted">No public destination yet.</p>
                ) : null}
                <DestinationForm
                  painId={painId}
                  productId={product.id}
                  destinations={productDestinations}
                />
              </article>
            );
          })
        )}
      </section>
      <ConversionForm painId={painId} destinations={destinations} />
      <div className="mt-10">
        <CampaignBriefForm
          painId={painId}
          defaultDestinationUrl={destinations[0]?.url}
        />
      </div>
    </main>
  );
}
