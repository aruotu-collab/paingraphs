import { listCatalogProducts } from "@/lib/admin/ops";
import { db } from "@/lib/db";
import { productFits } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, fits] = await Promise.all([
    listCatalogProducts(),
    db.select({ productId: productFits.productId }).from(productFits),
  ]);
  const counts = new Map<string, number>();
  for (const row of fits) {
    counts.set(row.productId, (counts.get(row.productId) ?? 0) + 1);
  }

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Products</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Recommended products exist independently of affiliate destinations.
      </p>
      <ul className="mt-8">
        {products.map((product) => (
          <li key={product.id} className="border-t border-line py-4">
            <p className="text-sm text-paper">{product.name}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{product.summary}</p>
            <p className="mt-2 font-mono text-xs text-copper">
              {product.priceBand || "No price band"} · {counts.get(product.id) ?? 0}{" "}
              PainGraphs
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
