import { createPlacement } from "@/lib/catalog/actions";

export function CategoryForm() {
  return (
    <form action={createPlacement} className="mt-6 grid gap-3 border border-line p-5">
      <h3 className="font-display text-2xl">Add a category</h3>
      <p className="text-sm leading-6 text-muted">
        New candidate placements live here. Leave the group blank to reuse the
        category name, or type an existing category to add another group under
        it.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs uppercase tracking-[0.14em] text-muted">
          Category
          <input
            name="categoryName"
            required
            placeholder="Product safety"
            className="border border-line bg-transparent px-3 py-2 text-sm normal-case tracking-normal text-paper"
          />
        </label>
        <label className="grid gap-1 text-xs uppercase tracking-[0.14em] text-muted">
          Group
          <input
            name="clusterName"
            placeholder="Recalls"
            className="border border-line bg-transparent px-3 py-2 text-sm normal-case tracking-normal text-paper"
          />
        </label>
      </div>
      <textarea
        name="summary"
        rows={2}
        placeholder="Optional summary"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
      />
      <button
        type="submit"
        className="justify-self-start border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
      >
        Save category
      </button>
    </form>
  );
}
