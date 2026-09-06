import Link from "next/link";
import type { PainGraph } from "@/lib/paingraph/types";

export function PainCard({ graph }: { graph: PainGraph }) {
  return (
    <Link href={graph.href} className="block border border-line p-5 hover:border-copper">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">
        {graph.category.name} · {graph.subcategory.name}
      </p>
      <h2 className="mt-2 font-display text-2xl text-paper">{graph.title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{graph.summary}</p>
      <p className="mt-4 font-mono text-xs text-copper">
        Pain {Math.round(graph.scores.pain)} · Intent {Math.round(graph.scores.buyingIntent)} ·
        Affiliate {Math.round(graph.scores.affiliate)} · Founder {Math.round(graph.scores.founder)}
      </p>
    </Link>
  );
}
