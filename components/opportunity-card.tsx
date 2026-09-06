import Link from "next/link";
import type { PainGraph } from "@/lib/paingraph/types";

export function OpportunityCard({
  graph,
  lens,
  gap,
  href,
}: {
  graph: PainGraph;
  lens: "affiliate" | "founder";
  gap?: string | null;
  href?: string;
}) {
  const score =
    lens === "affiliate" ? graph.scores.affiliate : graph.scores.founder;
  return (
    <article className="border border-copper p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-copper">
        {lens === "affiliate"
          ? "Affiliate opportunity of the day"
          : "Founder opportunity of the day"}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
        {graph.category.name} · {graph.subcategory.name}
      </p>
      <h2 className="mt-2 font-display text-3xl">{graph.title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{graph.summary}</p>
      {gap ? <p className="mt-3 text-sm leading-6 text-paper">{gap}</p> : null}
      <p className="mt-4 font-mono text-xs text-copper">
        {lens === "affiliate" ? "Affiliate" : "Founder"} {Math.round(score)} ·
        Intent {Math.round(graph.scores.buyingIntent)} · Evidence{" "}
        {graph.evidenceCount}
      </p>
      <Link
        href={href ?? graph.href}
        className="mt-4 inline-block text-sm text-copper hover:text-copper-2"
      >
        {lens === "founder" ? "Open gap analysis" : "Open this PainGraph"}
      </Link>
    </article>
  );
}
