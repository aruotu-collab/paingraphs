import { notFound } from "next/navigation";
import { PainCard } from "@/components/pain-card";
import { RESERVED_PATHS } from "@/lib/catalog/data";
import { listMarketPains } from "@/lib/market/queries";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (RESERVED_PATHS.has(category)) notFound();
  const pains = (await listMarketPains()).filter(
    (pain) => pain.category.slug === category,
  );
  if (pains.length === 0) notFound();
  const name = pains[0].category.name;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Category hub
      </p>
      <h1 className="mt-2 font-display text-5xl">{name}</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Pain clusters in {name.toLowerCase()}. Deeper pages exist only where we
        have enough evidence to be useful.
      </p>
      <div className="mt-10 grid gap-4">
        {pains.map((pain) => (
          <PainCard key={pain.id} pain={pain} />
        ))}
      </div>
    </main>
  );
}
