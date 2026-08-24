import Link from "next/link";
import { radarItems } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const items = await radarItems();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Feed</p>
      <h1 className="mt-2 font-display text-4xl">Radar</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Fastest-growing pain clusters from live public sources. Ranked by recent
        mention velocity, not guesses.
      </p>
      {items.length === 0 ? (
        <div className="mt-10 border border-dashed border-line px-6 py-16 text-center text-muted">
          No live clusters yet. Run ingest to pull Ask HN, Stack Exchange, and
          GitHub demand signals.
        </div>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/opportunities/${item.slug}`}
              className="border border-line bg-ink-2 p-5 hover:border-copper"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-2xl">{item.title}</h2>
                <span className="font-mono text-signal">+{item.growth}%</span>
              </div>
              <p className="mt-3 text-sm text-muted">
                {item.niche} · {item.country} · {item.signalCount.toLocaleString()}{" "}
                live signal{item.signalCount === 1 ? "" : "s"}
              </p>
              <p className="mt-4 text-sm leading-6 text-paper">{item.why}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
