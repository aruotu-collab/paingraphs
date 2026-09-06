import Link from "next/link";
import { BillboardNav } from "@/components/billboard-nav";
import { PainCard } from "@/components/pain-card";
import {
  filterByCategory,
  isBillboardView,
  listBillboardRows,
  sortBillboard,
} from "@/lib/opportunities/board";
import { entitlements } from "@/lib/identity/profile";
import { getAccess, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pain Billboard",
  description:
    "Live rankings of published PainGraphs: top pains, buying intent, affiliate opportunities, founder gaps.",
};

export default async function BillboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; category?: string }>;
}) {
  const query = await searchParams;
  const view = isBillboardView(query.view) ? query.view : "pain";
  const category = query.category || undefined;
  const session = await getSession();
  const access = session
    ? await getAccess(session.user).then(({ profile, capabilities }) =>
        entitlements(profile, capabilities.admin || capabilities.marketingAgent),
      )
    : { pro: false };
  const rows = sortBillboard(
    filterByCategory(await listBillboardRows(), category),
    view,
  );
  const limit = access.pro ? rows.length : 8;
  const visible = rows.slice(0, limit);
  const copy =
    view === "affiliate"
      ? "Best current affiliate scores. Programme discovery stays on Marketing Agent and the member vault."
      : view === "founder"
        ? "Best current founder scores. Open a gap analysis to see what existing products still miss."
        : view === "intent"
          ? "Highest buying-intent PainGraphs. People are already looking for a fix."
          : view === "underserved"
            ? "High founder score and lower competition. These are the thinnest solution sets."
            : "Highest pain scores from published PainGraphs. This list stays consumer-readable.";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Billboard</p>
      <h1 className="mt-3 font-display text-5xl">Live opportunity rankings.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{copy}</p>
      <BillboardNav view={view} category={category} />
      {!access.pro ? (
        <p className="mt-4 text-xs text-muted">
          Showing the top {visible.length}.{" "}
          <Link href="/signup?next=/top-pains" className="text-copper hover:text-copper-2">
            Create an account
          </Link>{" "}
          for the full board.
        </p>
      ) : null}
      <div className="mt-10 grid gap-4">
        {visible.map((graph, index) => (
          <div key={graph.id} className="flex gap-4">
            <p className="w-8 font-mono text-sm text-copper">#{index + 1}</p>
            <div className="flex-1">
              <PainCard graph={graph} />
              {view === "affiliate" ? (
                <p className="mt-2 font-mono text-xs text-muted">
                  {graph.productCount} products · {graph.programmeCount} programmes
                  · Evidence {graph.evidenceCount}
                </p>
              ) : null}
              {view === "founder" ? (
                <p className="mt-2 font-mono text-xs text-muted">
                  Competition {Math.round(graph.scores.competition)} ·{" "}
                  <Link
                    href={`/founders/gap/${graph.id}`}
                    className="text-copper hover:text-copper-2"
                  >
                    Gap analysis
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
