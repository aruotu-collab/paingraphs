import Link from "next/link";
import { OpenAIExtractButton } from "@/components/openai-extract-button";
import { openaiConfigured } from "@/lib/discovery/openai";
import { listCandidates } from "@/lib/discovery/store";

export const dynamic = "force-dynamic";

export default async function AdminCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    openai?: string;
    reviewed?: string;
    discarded?: string;
  }>;
}) {
  const query = await searchParams;
  const openaiReady = openaiConfigured();
  const status =
    query.status === "new" ||
    query.status === "watch" ||
    query.status === "needs_evidence" ||
    query.status === "approved" ||
    query.status === "rejected" ||
    query.status === "merged"
      ? query.status
      : undefined;
  const listed = await listCandidates(status);
  const rows = status
    ? listed
    : listed.filter((row) =>
        ["new", "watch", "needs_evidence"].includes(row.status),
      );

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Candidate pain queue</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        New pains stay here until you approve, merge, watch, or reject them.
        OpenAI only rereads licensed feed text you already pulled. It cannot
        invent a complaint, HopLink, or published page.
      </p>
      {query.openai === "missing" ? (
        <p className="mt-3 text-sm text-muted">
          OPENAI_API_KEY is not set in this environment.
        </p>
      ) : query.openai ? (
        <p className="mt-3 text-sm text-muted">
          OpenAI pass created {query.openai} new candidate
          {query.openai === "1" ? "" : "s"}
          {query.reviewed ? ` · reviewed ${query.reviewed} licensed texts` : ""}
          {query.discarded ? ` · discarded ${query.discarded}` : ""}. Review
          before anything is published.
        </p>
      ) : null}
      <nav className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        {[
          ["", "Open"],
          ["new", "New"],
          ["watch", "Watch"],
          ["needs_evidence", "Needs evidence"],
          ["approved", "Approved"],
          ["rejected", "Rejected"],
          ["merged", "Merged"],
        ].map(([value, label]) => (
          <Link
            key={label}
            href={value ? `/admin/candidates?status=${value}` : "/admin/candidates"}
            className={
              (status ?? "") === value
                ? "border border-copper px-3 py-1.5 text-copper"
                : "border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
            }
          >
            {label}
          </Link>
        ))}
        <Link
          href="/admin/add-candidate"
          className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
        >
          Add a candidate
        </Link>
        <OpenAIExtractButton configured={openaiReady} />
      </nav>
      <ul className="mt-8">
        {rows.length === 0 ? (
          <li className="text-sm text-muted">No candidates in this view.</li>
        ) : (
          rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3"
            >
              <div>
                <Link
                  href={`/admin/candidates/${row.id}`}
                  className="text-sm text-copper hover:text-copper-2"
                >
                  {row.title}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {row.status} · {row.origin} · evidence {row.evidenceCount}
                  {row.persona ? ` · ${row.persona}` : ""}
                  {row.categorySlug ? ` · ${row.categorySlug}` : ""}
                  {row.clusterSlug ? `/${row.clusterSlug}` : ""}
                </p>
              </div>
              <p className="font-mono text-xs text-muted">
                Intent {row.buyingIntent ?? "—"} · Conf {row.confidence ?? "—"}
              </p>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
