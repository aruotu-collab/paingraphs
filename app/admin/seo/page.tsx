import Link from "next/link";
import { formatStamp } from "@/lib/admin/format";
import { listSeoQueue } from "@/lib/seo/queue";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const rows = await listSeoQueue();

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">SEO freshness</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Unpublished drafts stay out of the sitemap. Thin or stale published
        pages wait here. Search Console numbers are not invented.
      </p>
      <p className="mt-3 font-mono text-xs text-copper">
        {rows.length} pages need attention
      </p>
      <ul className="mt-8">
        {rows.length === 0 ? (
          <li className="text-sm text-muted">No freshness issues right now.</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="border-t border-line py-3">
              <p className="text-sm text-paper">{row.title}</p>
              <p className="mt-1 text-xs text-muted">
                {row.category} · {row.cluster} · {row.status} · updated{" "}
                {formatStamp(row.updatedAt, "date")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                {row.reasons.join(" · ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <Link href="/admin/pains" className="text-copper hover:text-copper-2">
                  Publication
                </Link>
                {row.status === "published" ? (
                  <Link
                    href={row.publicHref}
                    className="text-copper hover:text-copper-2"
                  >
                    Public page
                  </Link>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
