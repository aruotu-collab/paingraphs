import Link from "next/link";
import { radarItems } from "@/lib/sample-data";

export default function RadarPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Feed</p>
      <h1 className="mt-2 font-display text-4xl">Radar</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Emerging, fastest-growing, and underserved pains. In Phase 1 this
        becomes a live feed from ingested sources.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {radarItems.map((item) => (
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
              sample signals
            </p>
            <p className="mt-4 text-sm leading-6 text-paper">{item.why}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
