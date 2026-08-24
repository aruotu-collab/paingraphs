import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getLatestProductSnapshot } from "@/lib/product/analyse";
import { ProductAnalyser } from "@/components/product-analyser";
import type { ConversationMatch, ProblemDna } from "@/lib/product/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function ProductPage() {
  const session = await requireSession();
  const snapshot = await getLatestProductSnapshot(session.user.id);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Reverse the graph
      </p>
      <h1 className="mt-2 font-display text-4xl">My Product</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Paste a public product URL. PainGraphs reads the page, extracts Problem
        DNA from what it actually says, then ranks live conversations already
        asking for that.
      </p>
      <ProductAnalyser initialUrl={snapshot?.url} />
      {snapshot ? (
        <>
          <DnaCards dna={snapshot.dna} name={snapshot.name} url={snapshot.url} />
          <MatchList matches={snapshot.matches} />
        </>
      ) : (
        <DnaCards
          dna={{
            name: "",
            solves: "—",
            forWho: "—",
            when: "—",
            competingAgainst: "—",
            keywords: [],
            summary: "",
          }}
        />
      )}
    </main>
  );
}

function DnaCards({
  dna,
  name,
  url,
}: {
  dna: ProblemDna;
  name?: string;
  url?: string;
}) {
  return (
    <section className="mt-10">
      {name ? (
        <p className="mb-4 text-sm text-muted">
          Problem DNA for{" "}
          <span className="text-paper">{name}</span>
          {url ? (
            <>
              {" "}
              ·{" "}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-copper-2"
              >
                {url.replace(/^https?:\/\//, "")}
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Solves", dna.solves],
          ["For", dna.forWho],
          ["When", dna.when],
          ["Competing against", dna.competingAgainst],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border border-dashed border-line p-5"
          >
            <div className="text-xs uppercase tracking-[0.16em] text-muted">
              {label}
            </div>
            <div className="mt-2 text-paper">{value || "—"}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MatchList({ matches }: { matches: ConversationMatch[] }) {
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">People already asking</h2>
          <p className="mt-2 text-sm text-muted">
            Ranked by fit, purchase intent, and recency. Evidence only — nothing
            posts itself.
          </p>
        </div>
        <span className="font-mono text-sm text-copper">
          {matches.length} match{matches.length === 1 ? "" : "es"}
        </span>
      </div>
      {matches.length === 0 ? (
        <p className="mt-6 border border-dashed border-line p-5 text-sm text-muted">
          No live conversations match this Problem DNA yet. The graph is still
          thin — try a product closer to agencies, invoicing, CRM, or reporting.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {matches.map((match) => (
            <li key={match.id} className="border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {match.problemSlug ? (
                  <Link
                    href={`/opportunities/${match.problemSlug}`}
                    className="font-display text-2xl hover:text-copper-2"
                  >
                    {match.problemTitle}
                  </Link>
                ) : (
                  <h3 className="font-display text-2xl">{match.problemTitle}</h3>
                )}
                <div className="flex gap-4 font-mono text-xs text-copper">
                  <span>{pct(match.fit)} fit</span>
                  <span>{pct(match.intent)} intent</span>
                </div>
              </div>
              {match.quote ? (
                <p className="mt-3 text-paper">“{match.quote}”</p>
              ) : null}
              <p className="mt-2 text-sm text-muted">{match.why}</p>
              <p className="mt-3 text-xs text-muted">
                {match.url ? (
                  <a
                    href={match.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-copper-2"
                  >
                    {match.source}
                  </a>
                ) : (
                  match.source
                )}{" "}
                · {match.date}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}
