import { PainPublicationForm } from "@/components/pain-publication-form";
import { listAllPainGraphs } from "@/lib/paingraph/queries";

export const dynamic = "force-dynamic";

export default async function AdminPainsPage() {
  const graphs = await listAllPainGraphs();
  const drafts = graphs.filter((graph) => graph.status !== "published");

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">PainGraph publication</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Unpublish a PainGraph to take it off the public site. Catalog sync does
        not overwrite this status.
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
              </p>
            </div>
            <PainPublicationForm painId={graph.id} status={graph.status} />
          </li>
        ))}
      </ul>
    </main>
  );
}
