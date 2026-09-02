import { loadAdminDemand } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminDemandPage() {
  await requireAdmin("/admin/demand");
  const data = await loadAdminDemand();
  if (!data) return null;

  return (
    <main className="space-y-14 pb-16">
      <h1 className="mt-8 font-display text-4xl">First-party demand</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Questionnaire completions, watchlist joins, hypothesis answers, and
        product URL scans.
      </p>

      <section>
        <h2 className="font-display text-2xl">PainGraph completions</h2>
        <List
          empty="None yet."
          rows={data.quiz.map((row) => [
            row.createdAt.toISOString().slice(0, 16),
            row.title || row.painId,
            row.email || "signed-in / no extra email",
            row.consentMarketing ? "marketing on" : "",
          ])}
        />
      </section>

      <section>
        <h2 className="font-display text-2xl">Watchlist</h2>
        <List
          empty="Nobody is watching a pain yet."
          rows={data.watching.map((row) => [
            row.createdAt.toISOString().slice(0, 16),
            row.title || row.userId,
            row.email || row.userId,
            "",
          ])}
        />
      </section>

      <section>
        <h2 className="font-display text-2xl">Hypothesis answers</h2>
        <List
          empty="No test-page answers yet."
          rows={data.answers.map((row) => [
            row.createdAt.toISOString().slice(0, 16),
            row.title || "hypothesis",
            row.email || "anonymous",
            row.hasProblem ? "has this problem" : "weak / no",
          ])}
        />
      </section>

      <section>
        <h2 className="font-display text-2xl">Product scans</h2>
        <List
          empty="No reverse scans."
          rows={data.scans.map((row) => [
            row.createdAt.toISOString().slice(0, 16),
            row.name,
            row.url,
            row.userId || "guest",
          ])}
        />
      </section>
    </main>
  );
}

function List({
  empty,
  rows,
}: {
  empty: string;
  rows: string[][];
}) {
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-muted">{empty}</p>;
  }
  return (
    <ul className="mt-4 space-y-2 text-sm">
      {rows.map((row, index) => (
        <li key={`${row[0]}-${index}`} className="border border-line px-4 py-3">
          <span className="font-mono text-xs text-muted">{row[0]}</span>
          <span className="mt-1 block text-paper">{row[1]}</span>
          <span className="block text-xs text-muted">
            {row[2]}
            {row[3] ? ` · ${row[3]}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
