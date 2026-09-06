import { count } from "drizzle-orm";
import { PainPublicationForm } from "@/components/pain-publication-form";
import { db } from "@/lib/db";
import { pains, user } from "@/lib/db/schema";
import { listAllPainGraphs } from "@/lib/paingraph/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [userCount] = await db.select({ value: count() }).from(user);
  const [painCount] = await db.select({ value: count() }).from(pains);
  const graphs = await listAllPainGraphs();
  const published = graphs.filter((graph) => graph.status === "published");
  const drafts = graphs.filter((graph) => graph.status !== "published");

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Is PainGraphs running?</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Admin operates the platform. Marketing Agent monetises demand. They stay
        separate even though both are owner-only.
      </p>
      <dl className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Members</dt>
          <dd className="mt-2 font-display text-3xl">{userCount.value}</dd>
        </div>
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Pain records</dt>
          <dd className="mt-2 font-display text-3xl">{painCount.value}</dd>
        </div>
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Published</dt>
          <dd className="mt-2 font-display text-3xl">{published.length}</dd>
        </div>
      </dl>
      <section className="mt-10">
        <h2 className="font-display text-2xl">PainGraph publication</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Unpublish a PainGraph to take it off the public site. Catalog sync
          does not overwrite this status.
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
      </section>
    </main>
  );
}
