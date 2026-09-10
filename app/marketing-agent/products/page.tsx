import Link from "next/link";
import { saveMemberProduct } from "@/lib/products/actions";
import { productMatchesFor } from "@/lib/products/store";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MarketingAgentProductsPage() {
  const session = await getSession();
  const rows = session ? await productMatchesFor(session.user.id) : [];

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Owned products</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Register PainGraphs’ own web apps here. Matches appear on the Money
        Board. Public fit scores do not change.
      </p>
      <form action={saveMemberProduct} className="mt-8 grid gap-3 border border-line p-5">
        <input
          name="name"
          required
          placeholder="Name"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="url"
          type="url"
          required
          placeholder="https://…"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <textarea
          name="description"
          required
          rows={3}
          placeholder="What it does"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <button
          type="submit"
          className="justify-self-start border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
        >
          Save owned product
        </button>
      </form>
      <ul className="mt-10 space-y-6">
        {rows.map(({ product, summary, matches }) => (
          <li key={product.id} className="border border-line p-5">
            <h2 className="font-display text-2xl">{product.name}</h2>
            <p className="mt-2 font-mono text-xs text-copper">
              {summary.total} matches · {summary.highIntent} high intent
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {matches.slice(0, 6).map((match) => (
                <li key={match.graph.id}>
                  <Link
                    href={`/marketing-agent/${match.graph.id}`}
                    className="text-copper hover:text-copper-2"
                  >
                    {match.graph.title}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
