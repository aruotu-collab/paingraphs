import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog/data";
import { entitlements } from "@/lib/identity/profile";
import { removeMemberProduct, saveMemberProduct } from "@/lib/products/actions";
import { productMatchesFor } from "@/lib/products/store";
import { getAccess, requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MyProductsPage() {
  const session = await requireSession("/home/products");
  const { profile, capabilities } = await getAccess(session.user);
  const owner = capabilities.admin || capabilities.marketingAgent;
  const access = entitlements(profile, owner);
  const rows = access.pro ? await productMatchesFor(session.user.id) : [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Member home · My Products
      </p>
      <h1 className="mt-3 font-display text-4xl">Match what you already built.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Register a product you own. PainGraphs scores overlap with published
        pains. Fit is not commission.
      </p>
      <Link href="/home" className="mt-4 inline-block text-sm text-copper hover:text-copper-2">
        Back to member home
      </Link>
      {!access.pro ? (
        <p className="mt-8 text-sm text-muted">
          My Products is a Pro tool.{" "}
          <Link href="/pricing" className="text-copper hover:text-copper-2">
            Unlock Pro
          </Link>
        </p>
      ) : (
        <>
          <form action={saveMemberProduct} className="mt-10 grid gap-3 border border-line p-5">
            <h2 className="font-display text-2xl">Add a product</h2>
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
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="targetCustomer"
                placeholder="Target customer"
                className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
              />
              <input
                name="geography"
                placeholder="Geography"
                className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
              />
              <input
                name="price"
                placeholder="Price"
                className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
              />
              <select
                name="categorySlug"
                className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
              >
                <option value="" className="bg-ink">
                  Category
                </option>
                {CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug} className="bg-ink">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              name="problemsSolved"
              rows={2}
              placeholder="Problems solved"
              className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
            />
            <textarea
              name="features"
              rows={2}
              placeholder="Features"
              className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
            />
            <input
              name="positioning"
              placeholder="Positioning"
              className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
            />
            <button
              type="submit"
              className="justify-self-start border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
            >
              Save product
            </button>
          </form>
          <ul className="mt-10 space-y-6">
            {rows.length === 0 ? (
              <li className="text-sm text-muted">No products yet.</li>
            ) : (
              rows.map(({ product, matches, summary }) => (
                <li key={product.id} className="border border-line p-5">
                  <h2 className="font-display text-2xl">{product.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{product.description}</p>
                  <p className="mt-3 font-mono text-xs text-copper">
                    Matches {summary.total} pains · {summary.highIntent} high intent ·{" "}
                    {summary.rising} rising
                  </p>
                  <ul className="mt-4 space-y-2">
                    {matches.slice(0, 8).map((match) => (
                      <li key={match.graph.id} className="text-sm">
                        <Link
                          href={match.graph.href}
                          className="text-copper hover:text-copper-2"
                        >
                          {match.graph.title}
                        </Link>
                        <span className="ml-2 font-mono text-xs text-muted">
                          Intent {Math.round(match.graph.scores.buyingIntent)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <form action={removeMemberProduct} className="mt-4">
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      className="text-xs uppercase tracking-[0.14em] text-muted hover:text-copper"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </main>
  );
}
