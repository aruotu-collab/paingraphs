import Link from "next/link";
import { notFound } from "next/navigation";
import { CandidateReview } from "@/components/candidate-review";
import { CLUSTERS } from "@/lib/catalog/data";
import { getCandidate } from "@/lib/discovery/store";
import { listAllPainGraphs } from "@/lib/paingraph/queries";

export const dynamic = "force-dynamic";

export default async function AdminCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [candidate, graphs] = await Promise.all([
    getCandidate(id),
    listAllPainGraphs(),
  ]);
  if (!candidate) notFound();
  const related = graphs.find((graph) => graph.id === candidate.relatedPainId);
  const approved = graphs.find((graph) => graph.id === candidate.painId);
  const defaultCluster = CLUSTERS.find(
    (cluster) => cluster.slug === candidate.clusterSlug,
  );

  return (
    <main className="pb-16">
      <Link
        href="/admin/candidates"
        className="mt-8 inline-block text-sm text-copper hover:text-copper-2"
      >
        Back to queue
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-copper">
        {candidate.status} · {candidate.origin}
      </p>
      <h1 className="mt-3 font-display text-4xl">{candidate.title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        {candidate.problem}
      </p>
      <dl className="mt-8 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Persona</dt>
          <dd className="mt-1">{candidate.persona || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Places</dt>
          <dd className="mt-1">
            {[candidate.categorySlug, candidate.clusterSlug, candidate.countries]
              .filter(Boolean)
              .join(" · ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Products</dt>
          <dd className="mt-1">{candidate.productsDetected || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Scores</dt>
          <dd className="mt-1 font-mono text-xs">
            Intent {candidate.buyingIntent ?? "—"} · Severity{" "}
            {candidate.severity ?? "—"} · Founder{" "}
            {candidate.founderOpportunity ?? "—"} · Affiliate{" "}
            {candidate.affiliateOpportunity ?? "—"} · Conf{" "}
            {candidate.confidence ?? "—"}
          </dd>
        </div>
      </dl>
      {related ? (
        <p className="mt-4 text-sm text-muted">
          Related:{" "}
          <Link href={related.href} className="text-copper hover:text-copper-2">
            {related.title}
          </Link>
        </p>
      ) : null}
      {approved ? (
        <p className="mt-4 text-sm text-muted">
          Approved PainGraph:{" "}
          <Link href={approved.href} className="text-copper hover:text-copper-2">
            {approved.title}
          </Link>
        </p>
      ) : null}
      <section className="mt-8">
        <h2 className="font-display text-2xl">Evidence</h2>
        {candidate.signals.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No quotes attached yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {candidate.signals.map((signal) => (
              <li key={signal.id} className="border border-line p-4 text-sm">
                <p className="text-paper">{signal.rawQuote}</p>
                <p className="mt-2 text-xs text-muted">{signal.sourceLabel}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <CandidateReview
        candidateId={candidate.id}
        status={candidate.status}
        graphs={graphs.filter((graph) => graph.status === "published")}
        defaultClusterId={defaultCluster?.id}
      />
    </main>
  );
}
