import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog/data";
import { DESTINATION_COUNTRIES } from "@/lib/destinations/url";
import type { BillboardFilters, BillboardView } from "@/lib/opportunities/board";

const TABS: { id: BillboardView; label: string }[] = [
  { id: "pain", label: "Top pains" },
  { id: "growth", label: "Growing" },
  { id: "intent", label: "Buying intent" },
  { id: "affiliate", label: "Affiliate" },
  { id: "founder", label: "Founder" },
  { id: "underserved", label: "Underserved" },
  { id: "competition", label: "Low competition" },
];

function hrefFor(view: BillboardView, filters: BillboardFilters) {
  const params = new URLSearchParams();
  if (view !== "pain") params.set("view", view);
  if (filters.category) params.set("category", filters.category);
  if (filters.country) params.set("country", filters.country);
  if (filters.products && filters.products !== "any") {
    params.set("products", filters.products);
  }
  if (filters.programmes && filters.programmes !== "any") {
    params.set("programmes", filters.programmes);
  }
  if (filters.minIntent) params.set("minIntent", String(filters.minIntent));
  const query = params.toString();
  return query ? `/top-pains?${query}` : "/top-pains";
}

const fieldClass =
  "border border-line bg-transparent px-3 py-2 text-xs text-paper";

export function BillboardNav({
  view,
  filters,
}: {
  view: BillboardView;
  filters: BillboardFilters;
}) {
  return (
    <div>
      <nav className="mt-8 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={hrefFor(tab.id, filters)}
            className={
              view === tab.id
                ? "border border-copper px-3 py-1.5 text-copper"
                : "border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <form
        method="get"
        action="/top-pains"
        autoComplete="off"
        className="mt-4 grid gap-2 md:grid-cols-5"
      >
        {view !== "pain" ? <input type="hidden" name="view" value={view} /> : null}
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          autoComplete="off"
          className={fieldClass}
        >
          <option value="" className="bg-ink">
            All categories
          </option>
          {CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug} className="bg-ink">
              {category.name}
            </option>
          ))}
        </select>
        <select
          name="country"
          defaultValue={filters.country ?? "*"}
          autoComplete="off"
          className={fieldClass}
        >
          {DESTINATION_COUNTRIES.map((row) => (
            <option key={row.code} value={row.code} className="bg-ink">
              {row.code === "*" ? "Any country" : row.label}
            </option>
          ))}
        </select>
        <select
          name="products"
          defaultValue={filters.products ?? "any"}
          autoComplete="off"
          className={fieldClass}
        >
          <option value="any" className="bg-ink">
            Any products
          </option>
          <option value="some" className="bg-ink">
            Has products
          </option>
          <option value="none" className="bg-ink">
            No products
          </option>
        </select>
        <select
          name="programmes"
          defaultValue={filters.programmes ?? "any"}
          autoComplete="off"
          className={fieldClass}
        >
          <option value="any" className="bg-ink">
            Any programmes
          </option>
          <option value="some" className="bg-ink">
            Has programmes
          </option>
          <option value="none" className="bg-ink">
            No programmes
          </option>
        </select>
        <div className="flex gap-2">
          <input
            name="minIntent"
            type="number"
            min={0}
            max={100}
            defaultValue={filters.minIntent ?? ""}
            placeholder="Min intent"
            autoComplete="off"
            className={`min-w-0 flex-1 ${fieldClass}`}
          />
          <button
            type="submit"
            className="border border-line px-3 py-2 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
          >
            Filter
          </button>
        </div>
      </form>
    </div>
  );
}
