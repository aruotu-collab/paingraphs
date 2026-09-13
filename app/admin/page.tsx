import Link from "next/link";
import { count } from "drizzle-orm";
import { visitStats } from "@/lib/admin/visits";
import { destinationTotals } from "@/lib/admin/ops";
import { db } from "@/lib/db";
import { candidateCounts, latestIngestRun } from "@/lib/discovery/store";
import { pains, user } from "@/lib/db/schema";
import { listAllPainGraphs } from "@/lib/paingraph/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [userCount] = await db.select({ value: count() }).from(user);
  const [painCount] = await db.select({ value: count() }).from(pains);
  const [graphs, candidates, visits, destinations, ingest] = await Promise.all([
    listAllPainGraphs(),
    candidateCounts(),
    visitStats(),
    destinationTotals(),
    latestIngestRun(),
  ]);
  const published = graphs.filter((graph) => graph.status === "published");
  const drafts = graphs.filter((graph) => graph.status !== "published");

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Is PainGraphs running?</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Admin operates the platform. Marketing Agent monetises demand. New pains
        wait in the candidate queue until you approve them.
      </p>
      <dl className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Members</dt>
          <dd className="mt-2 font-display text-3xl">{userCount.value}</dd>
        </div>
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Published</dt>
          <dd className="mt-2 font-display text-3xl">{published.length}</dd>
        </div>
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">
            Candidate queue
          </dt>
          <dd className="mt-2 font-display text-3xl">{candidates.queue}</dd>
        </div>
        <div className="border border-line p-4">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">
            Visits / 24h
          </dt>
          <dd className="mt-2 font-display text-3xl">{visits.day}</dd>
        </div>
      </dl>
      <p className="mt-6 font-mono text-xs text-muted">
        {painCount.value} pain records · {drafts.length} unpublished ·{" "}
        {destinations.destinations} destinations · {destinations.clicks} /go
        clicks
        {ingest
          ? ` · last ingest ${new Date(ingest.finishedAt).toISOString().slice(0, 16)}`
          : " · ingest not run yet"}
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/candidates" className="text-copper hover:text-copper-2">
          Review candidates
        </Link>
        <Link href="/admin/add-candidate" className="text-copper hover:text-copper-2">
          Add a candidate
        </Link>
        <Link href="/admin/categories" className="text-copper hover:text-copper-2">
          Categories
        </Link>
        <Link href="/admin/pains" className="text-copper hover:text-copper-2">
          Publication
        </Link>
        <Link href="/admin/seo" className="text-copper hover:text-copper-2">
          SEO freshness
        </Link>
        <Link href="/admin/health" className="text-copper hover:text-copper-2">
          Site health
        </Link>
        <Link href="/admin/billing" className="text-copper hover:text-copper-2">
          Billing
        </Link>
      </div>
    </main>
  );
}
