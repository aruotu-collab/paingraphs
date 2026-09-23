import Link from "next/link";
import { PainPublicationForm } from "@/components/pain-publication-form";
import { RewriteNarrativeButton } from "@/components/rewrite-narrative-button";
import { listDestinationGaps } from "@/lib/destinations/completeness";
import { listAllPainGraphs } from "@/lib/paingraph/queries";

export const dynamic = "force-dynamic";

export default async function AdminPainsPage() {
  const [graphs, gaps] = await Promise.all([
    listAllPainGraphs(),
    listDestinationGaps(),
  ]);
  const drafts = graphs.filter((graph) => graph.status !== "published");
  const gapById = new Map(gaps.map((row) => [row.id, row]));

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">PainGraph publication</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Unpublish a PainGraph to take it off the public site. A published graph
        without shop links is unfinished — customers will not see a shop button.
      </p>
      {drafts.length > 0 ? (
        <p className="mt-3 font-mono text-xs text-copper">
          {drafts.length} unpublished
        </p>
      ) : null}
      <ul className="mt-6">
        {graphs.map((graph) => (
          <li
            key={graph.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3"
          >
            <div>
              <p className="text-sm text-paper">{graph.title}</p>
              <p className="mt-1 text-xs text-muted">
                {graph.category.name} · {graph.subcategory.name} · {graph.status}
                {graph.concerns.length
                  ? ` · ${graph.concerns.length} sliders`
                  : ""}
                {gapById.get(graph.id)
                  ? gapById.get(graph.id)!.missing.length > 0
                    ? ` · ${gapById.get(graph.id)!.linked}/${gapById.get(graph.id)!.products} shop links`
                    : " · shop links complete"
                  : ""}
              </p>
              {gapById.get(graph.id)?.missing.length ? (
                <p className="mt-1 text-xs text-copper">
                  Missing: {gapById.get(graph.id)!.missing.join(", ")}{" "}
                  <Link
                    href={`/marketing-agent/${graph.id}`}
                    className="hover:text-copper-2"
                  >
                    Paste destinations
                  </Link>
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <RewriteNarrativeButton painId={graph.id} />
              <PainPublicationForm painId={graph.id} status={graph.status} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
