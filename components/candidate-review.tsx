import Link from "next/link";
import type { PlacementOption } from "@/lib/catalog/placements";
import {
  approveCandidate,
  mergeCandidate,
  reviewCandidate,
} from "@/lib/discovery/actions";
import type { PainGraph } from "@/lib/paingraph/types";

export function CandidateReview({
  candidateId,
  status,
  graphs,
  clusters,
  defaultClusterId,
}: {
  candidateId: string;
  status: string;
  graphs: PainGraph[];
  clusters: PlacementOption[];
  defaultClusterId?: string;
}) {
  const closed = status === "approved" || status === "rejected" || status === "merged";

  return (
    <div className="mt-8 space-y-6">
      {!closed ? (
        <form action={approveCandidate} className="grid gap-3 border border-line p-5">
          <input type="hidden" name="candidateId" value={candidateId} />
          <h3 className="font-display text-2xl">Approve into a PainGraph</h3>
          <select
            name="clusterId"
            defaultValue={defaultClusterId ?? clusters[0]?.id}
            className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
          >
            {clusters.map((cluster) => (
              <option key={cluster.id} value={cluster.id} className="bg-ink">
                {cluster.label}
              </option>
            ))}
          </select>
          <p className="text-sm leading-6 text-muted">
            If none fit,{" "}
            <Link href="/admin/categories" className="text-copper hover:text-copper-2">
              add a category
            </Link>
            , then come back and choose it here.
          </p>
          <textarea
            name="reviewNote"
            rows={2}
            placeholder="Review note"
            className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              name="publish"
              value=""
              className="border border-line px-3 py-2 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
            >
              Approve as draft
            </button>
            <button
              type="submit"
              name="publish"
              value="1"
              className="border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
            >
              Approve and publish
            </button>
          </div>
        </form>
      ) : null}

      {!closed ? (
        <form action={mergeCandidate} className="grid gap-3 border border-line p-5">
          <input type="hidden" name="candidateId" value={candidateId} />
          <h3 className="font-display text-2xl">Merge into an existing pain</h3>
          <select
            name="painId"
            className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
          >
            {graphs.map((graph) => (
              <option key={graph.id} value={graph.id} className="bg-ink">
                {graph.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="justify-self-start border border-line px-3 py-2 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
          >
            Merge evidence
          </button>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {status !== "watch" && !closed ? (
          <form action={reviewCandidate}>
            <input type="hidden" name="candidateId" value={candidateId} />
            <input type="hidden" name="status" value="watch" />
            <button
              type="submit"
              className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
            >
              Watch
            </button>
          </form>
        ) : null}
        {status !== "needs_evidence" && !closed ? (
          <form action={reviewCandidate}>
            <input type="hidden" name="candidateId" value={candidateId} />
            <input type="hidden" name="status" value="needs_evidence" />
            <button
              type="submit"
              className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
            >
              Request evidence
            </button>
          </form>
        ) : null}
        {status !== "rejected" ? (
          <form action={reviewCandidate}>
            <input type="hidden" name="candidateId" value={candidateId} />
            <input type="hidden" name="status" value="rejected" />
            <button
              type="submit"
              className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
            >
              Reject
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
