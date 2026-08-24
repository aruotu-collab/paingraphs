import Link from "next/link";
import { MarketSearch } from "@/components/market-search";

export default function HomePage() {
  return (
    <main className="radar-grid flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-20">
        <p className="text-xs uppercase tracking-[0.22em] text-copper">
          Demand intelligence
        </p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] text-paper sm:text-6xl">
          See where demand already exists.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
          PainGraphs maps public complaints into a live graph of unmet demand.
          Find a problem worth building, or find the people already asking for
          what you shipped.
        </p>
        <div className="mt-10">
          <p className="mb-3 text-sm text-muted">
            What market do you want to understand?
          </p>
          <MarketSearch />
        </div>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link href="/opportunities" className="text-paper hover:text-copper-2">
            Find something to build
          </Link>
          <Link href="/product" className="text-paper hover:text-copper-2">
            Find customers for my product
          </Link>
        </div>
      </section>
    </main>
  );
}
