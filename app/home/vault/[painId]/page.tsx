import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgrammeList } from "@/components/programme-list";
import { VaultDestinationForm } from "@/components/vault-destination-form";
import { productsForPain } from "@/lib/destinations/store";
import { listPainGraphs } from "@/lib/paingraph/queries";
import { listProgrammesForProducts } from "@/lib/programmes/store";
import { requireSession } from "@/lib/session";
import { listMemberDestinations } from "@/lib/vault/store";

export const dynamic = "force-dynamic";

export default async function VaultPainPage({
  params,
}: {
  params: Promise<{ painId: string }>;
}) {
  const session = await requireSession("/home/vault");
  const { painId } = await params;
  const [graphs, products, destinations] = await Promise.all([
    listPainGraphs(),
    productsForPain(painId),
    listMemberDestinations(session.user.id, painId),
  ]);
  const graph = graphs.find((item) => item.id === painId);
  if (!graph) notFound();
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-copper">
        {graph.category.name} · {graph.subcategory.name}
      </p>
      <h1 className="mt-3 font-display text-4xl">{graph.title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        These URLs are only on your account. They do not become Check price on
        the public PainGraph.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/home/vault" className="text-copper hover:text-copper-2">
          All vault pains
        </Link>
        <Link href={graph.href} className="text-copper hover:text-copper-2">
          View public PainGraph
        </Link>
      </div>
      <section className="mt-10 space-y-6">
        {products.length === 0 ? (
          <p className="text-sm text-muted">
            No scored products on this PainGraph yet.
          </p>
        ) : (
          products.map((product) => (
            <article key={product.id} className="border border-line p-5">
              <h2 className="font-display text-2xl">{product.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{product.summary}</p>
              <h3 className="mt-6 text-xs uppercase tracking-[0.16em] text-copper">
                Programme discovery
              </h3>
              <ProgrammeList programmes={programmesByProduct.get(product.id) ?? []} />
              <h3 className="mt-6 text-xs uppercase tracking-[0.16em] text-copper">
                Your private URLs
              </h3>
              <VaultDestinationForm
                painId={painId}
                productId={product.id}
                destinations={destinationsByProduct.get(product.id) ?? []}
              />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
