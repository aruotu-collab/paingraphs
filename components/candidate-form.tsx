import Link from "next/link";
import { listPlacementOptions } from "@/lib/catalog/placements";
import { submitCandidate } from "@/lib/discovery/actions";

export async function CandidateForm() {
  const clusters = await listPlacementOptions();
  return (
    <form action={submitCandidate} className="mt-8 grid gap-3 border border-line p-5">
      <input
        name="title"
        required
        placeholder="Suggested title"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
      />
      <textarea
        name="problem"
        required
        rows={4}
        placeholder="What is the problem?"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
      />
      <select
        name="clusterId"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        defaultValue={clusters[0]?.id}
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
        .
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="persona"
          placeholder="Persona"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="countries"
          placeholder="Countries"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="productsDetected"
          placeholder="Products mentioned"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="quoteLabel"
          placeholder="Evidence source label"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
      </div>
      <textarea
        name="quote"
        rows={3}
        placeholder="Optional public quote"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
      />
      <div className="grid gap-3 md:grid-cols-5">
        <input
          name="severity"
          type="number"
          min={0}
          max={100}
          placeholder="Severity"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="buyingIntent"
          type="number"
          min={0}
          max={100}
          placeholder="Intent"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="confidence"
          type="number"
          min={0}
          max={100}
          placeholder="Confidence"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="founderOpportunity"
          type="number"
          min={0}
          max={100}
          placeholder="Founder"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="affiliateOpportunity"
          type="number"
          min={0}
          max={100}
          placeholder="Affiliate"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
      </div>
      <button
        type="submit"
        className="justify-self-start border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
      >
        Queue candidate
      </button>
    </form>
  );
}
