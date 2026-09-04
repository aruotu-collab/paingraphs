import Link from "next/link";
import { PainCard } from "@/components/pain-card";
import { listMarketPains } from "@/lib/market/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const pains = await listMarketPains();
  const trending = [...pains].sort((a, b) => b.trend - a.trend);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-copper">
        Pain market
      </p>
      <h1 className="mt-3 font-display text-5xl leading-[1.05] sm:text-6xl">
        A live exchange of consumer pain.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        Shoppers get a decision tool. Affiliates and founders use the same
        published pains. The Billboard is a separate daily chart of topics still
        being researched.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Door
          kicker="Solve a problem"
          title="Find my PainGraph"
          body="Find products matched to what is bothering you."
          href={trending[0]?.href ?? "/electronics/headphones/glasses-pressure"}
          cta="Find my PainGraph"
        />
        <Door
          kicker="Earn from problems"
          title="Explore affiliate opportunities"
          body="Discover pains people are already trying to solve, and products you can promote."
          href="/for-affiliates"
          cta="Explore affiliate opportunities"
        />
        <Door
          kicker="Build solutions"
          title="Explore founder opportunities"
          body="Find underserved markets, or discover new audiences for a product you already sell."
          href="/for-founders"
          cta="Explore founder opportunities"
        />
      </div>

      <dl className="mt-10 grid gap-px bg-line sm:grid-cols-3">
        <Tile label="Published pains" value={String(pains.length)} />
        <Tile label="Updated" value="today" />
        <Tile
          label="Hottest move"
          value={trending[0] ? `+${trending[0].trend}%` : "—"}
        />
      </dl>

      <p className="mt-8 text-sm text-muted">
        Looking for today&apos;s search topics, not live shopper pages?{" "}
        <Link href="/billboard" className="text-copper hover:text-copper-2">
          Open the Painpoint Billboard
        </Link>
        .
      </p>

      <Section title="Live marketplace" items={trending} extra />
    </main>
  );
}

function Door({
  kicker,
  title,
  body,
  href,
  cta,
}: {
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col border border-line p-5 transition-colors hover:border-copper"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-copper">{kicker}</p>
      <h2 className="mt-3 font-display text-2xl">{title}</h2>
      <p className="mt-3 flex-1 text-sm leading-6 text-muted">{body}</p>
      <span className="mt-5 text-sm text-paper">{cta} →</span>
    </Link>
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
  extra,
}: {
  title: string;
  items: Awaited<ReturnType<typeof listMarketPains>>;
  extra?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="font-display text-3xl">{title}</h2>
      <div className="mt-6 grid gap-4">
        {items.map((pain) => (
          <PainCard key={pain.id} pain={pain} extra={extra} />
        ))}
      </div>
    </section>
  );
}
