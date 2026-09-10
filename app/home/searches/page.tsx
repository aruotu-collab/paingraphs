import Link from "next/link";
import { entitlements } from "@/lib/identity/profile";
import { removeSavedSearch } from "@/lib/searches/actions";
import { listSavedSearches, searchHref } from "@/lib/searches/store";
import { getAccess, requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SavedSearchesPage() {
  const session = await requireSession("/home/searches");
  const { profile, capabilities } = await getAccess(session.user);
  const access = entitlements(
    profile,
    capabilities.admin || capabilities.marketingAgent,
  );
  const rows = access.pro ? await listSavedSearches(session.user.id) : [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Member home · Saved searches
      </p>
      <h1 className="mt-3 font-display text-4xl">Keep a Billboard filter.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Save a ranking view from the Billboard. New matching pains can land in
        Alerts if you opt in to email.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/home" className="text-copper hover:text-copper-2">
          Back to member home
        </Link>
        <Link href="/top-pains" className="text-copper hover:text-copper-2">
          Open Billboard
        </Link>
      </div>
      {!access.pro ? (
        <p className="mt-8 text-sm text-muted">
          Saved searches are Pro.{" "}
          <Link href="/pricing" className="text-copper hover:text-copper-2">
            Unlock Pro
          </Link>
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No saved searches yet. Filter the Billboard, then save it.
        </p>
      ) : (
        <ul className="mt-10">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3"
            >
              <div>
                <Link
                  href={searchHref(row)}
                  className="text-sm text-copper hover:text-copper-2"
                >
                  {row.name}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {row.view}
                  {row.category ? ` · ${row.category}` : ""}
                  {row.country ? ` · ${row.country}` : ""}
                </p>
              </div>
              <form action={removeSavedSearch}>
                <input type="hidden" name="searchId" value={row.id} />
                <button
                  type="submit"
                  className="text-xs uppercase tracking-[0.14em] text-muted hover:text-copper"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
