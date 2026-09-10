import { CategoryForm } from "@/components/category-form";
import { listPlacementGroups } from "@/lib/catalog/placements";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const groups = await listPlacementGroups();

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Categories</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        These placements are where candidates land when you approve them.
        Adding a category does not publish anything.
      </p>
      <ul className="mt-8">
        {groups.length === 0 ? (
          <li className="text-sm text-muted">No categories yet.</li>
        ) : (
          groups.map((group) => (
            <li key={group.categoryId} className="border-t border-line py-3">
              <p className="text-sm text-paper">{group.categoryName}</p>
              <p className="mt-1 font-mono text-xs text-muted">
                /{group.categorySlug}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {group.clusters
                  .map((cluster) => `${cluster.name} (/${cluster.slug})`)
                  .join(" · ")}
              </p>
            </li>
          ))
        )}
      </ul>
      <CategoryForm />
    </main>
  );
}
