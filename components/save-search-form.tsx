import { saveBillboardSearch } from "@/lib/searches/actions";
import type { BillboardFilters, BillboardView } from "@/lib/opportunities/board";

export function SaveSearchForm({
  view,
  filters,
  pro,
}: {
  view: BillboardView;
  filters: BillboardFilters;
  pro: boolean;
}) {
  if (!pro) {
    return (
      <p className="mt-4 text-xs text-muted">
        Pro can save this Billboard filter.
      </p>
    );
  }
  return (
    <form action={saveBillboardSearch} className="mt-4 flex flex-wrap gap-2">
      <input type="hidden" name="view" value={view} />
      <input type="hidden" name="category" value={filters.category ?? ""} />
      <input type="hidden" name="country" value={filters.country ?? ""} />
      <input type="hidden" name="products" value={filters.products ?? "any"} />
      <input type="hidden" name="programmes" value={filters.programmes ?? "any"} />
      <input
        type="hidden"
        name="minIntent"
        value={filters.minIntent ? String(filters.minIntent) : ""}
      />
      <input
        name="name"
        required
        placeholder="Name this search"
        className="min-w-[12rem] flex-1 border border-line bg-transparent px-3 py-2 text-xs text-paper"
      />
      <button
        type="submit"
        className="border border-line px-3 py-2 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
      >
        Save search
      </button>
    </form>
  );
}
