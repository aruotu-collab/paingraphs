import { SignalForm, SourceForm } from "@/components/source-form";
import { formatStamp } from "@/lib/admin/format";
import {
  listDiscoverySignals,
  listDiscoverySources,
} from "@/lib/discovery/store";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const [sources, signals] = await Promise.all([
    listDiscoverySources(),
    listDiscoverySignals(40),
  ]);

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Source registry</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Phase 3 starts here: permitted sources, pasted signals, and a job that
        matches them. No live scrape of the open web.
      </p>
      <ul className="mt-8">
        {sources.map((source) => (
          <li key={source.id} className="border-t border-line py-3">
            <p className="text-sm text-paper">{source.name}</p>
            <p className="mt-1 text-xs text-muted">
              {source.sourceType} · {source.accessMethod} · {source.commercialUse}
              {source.enabled ? "" : " · disabled"}
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              Last ingest {formatStamp(source.lastIngestedAt, "datetime")}
            </p>
            {source.termsNotes ? (
              <p className="mt-2 text-sm leading-6 text-muted">{source.termsNotes}</p>
            ) : null}
          </li>
        ))}
      </ul>
      <SourceForm />
      <SignalForm sources={sources.filter((source) => source.enabled)} />
      <section className="mt-10">
        <h2 className="font-display text-2xl">Recent signals</h2>
        <ul className="mt-4">
          {signals.length === 0 ? (
            <li className="text-sm text-muted">No signals queued yet.</li>
          ) : (
            signals.map((signal) => (
              <li key={signal.id} className="border-t border-line py-3 text-sm">
                <p className="text-paper">{signal.rawText}</p>
                <p className="mt-1 text-xs text-muted">
                  {signal.status}
                  {signal.matchedPainId ? ` · matched ${signal.matchedPainId}` : ""}
                  {signal.candidateId ? ` · candidate ${signal.candidateId}` : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
