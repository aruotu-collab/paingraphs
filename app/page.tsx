import { PainCard } from "@/components/pain-card";
import { listMarketPains } from "@/lib/market/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const pains = await listMarketPains();
  const trending = [...pains].sort((a, b) => b.trend - a.trend);
  const affiliate = pains.filter((pain) => pain.affiliateScore >= 75);
  const productOps = pains.filter((pain) => pain.productGap >= 65);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-copper">
        Pain market
      </p>
      <h1 className="mt-3 font-display text-5xl leading-[1.05] sm:text-6xl">
        A live exchange of consumer pain.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        {pains.length} structured pains, updated from catalog research and
        permitted public sources. Not an article farm. Each page is a decision
        tool: what people complain about, who each option is for, then a
        PainGraph.
      </p>
      <dl className="mt-8 grid gap-px bg-line sm:grid-cols-3">
        <Tile label="Tracked pains" value={String(pains.length)} />
        <Tile label="Updated" value="today" />
        <Tile
          label="Hottest move"
          value={trending[0] ? `+${trending[0].trend}%` : "—"}
        />
      </dl>

      <Section title="Trending today" items={trending} />
      <Section title="Affiliate opportunities" items={affiliate} />
      <Section title="Product gaps" items={productOps} />
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink px-5 py-6">
      <dt className="text-xs uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="mt-2 font-display text-3xl">{value}</dd>
    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listMarketPains>>;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="font-display text-3xl">{title}</h2>
      <div className="mt-6 grid gap-4">
        {items.map((pain) => (
          <PainCard key={pain.id} pain={pain} />
        ))}
      </div>
    </section>
  );
}
