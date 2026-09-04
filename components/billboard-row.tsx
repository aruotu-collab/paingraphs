import { BillboardPrepareButton } from "@/components/billboard-prepare-button";
import { BillboardSaveButton } from "@/components/billboard-save-button";
import type { BillboardTopic } from "@/lib/billboard/types";

export function BillboardRow({
  topic,
  saved,
  signedIn,
  mode,
}: {
  topic: BillboardTopic;
  saved: boolean;
  signedIn: boolean;
  mode: "chart" | "favourites";
}) {
  const offChart = topic.rank === 0;

  return (
    <article className="border border-line bg-ink-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <p className="w-10 shrink-0 font-display text-3xl text-copper">
            {offChart ? "—" : String(topic.rank).padStart(2, "0")}
          </p>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              {topic.categoryName}
              {offChart ? " · Off the chart" : ` · ${topic.daysOnChart} day${topic.daysOnChart === 1 ? "" : "s"} on chart`}
            </p>
            <h2 className="mt-1 font-display text-2xl">{topic.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{topic.problem}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {mode === "favourites" ? (
            <>
              <BillboardSaveButton
                topicId={topic.id}
                saved={saved}
                signedIn={signedIn}
                next="/billboard/favourites"
                savedLabel="Remove"
              />
              <BillboardPrepareButton topicId={topic.id} href={topic.painHref} />
            </>
          ) : (
            <BillboardSaveButton
              topicId={topic.id}
              saved={saved}
              signedIn={signedIn}
              next="/billboard"
            />
          )}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Stat label="Heat" value={topic.heat} />
        <Stat label="Intent" value={topic.intent} />
        <Stat label="Pain" value={topic.pain} />
        <Stat label="Days" value={topic.daysOnChart} />
      </dl>

      <p className="mt-4 text-sm text-paper/80">{topic.whyNow}</p>
      <p className="mt-2 text-xs text-muted">
        People search: <span className="text-paper">{topic.searchPhrase}</span>
      </p>
      {topic.evidence ? <p className="mt-2 text-xs text-muted">{topic.evidence}</p> : null}
      {topic.sources.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-copper">
          {topic.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} className="hover:text-copper-2" rel="noreferrer">
                {source.title || source.url}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-paper">{value}</dd>
    </div>
  );
}
