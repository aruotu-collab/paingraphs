"use client";

import { useState } from "react";
import {
  buildPainGraph,
  publishMatch,
  recordMatchPerformance,
  setMatchStatus,
} from "@/lib/lab/actions";

export function SaveMatchButton({
  matchId,
  status,
}: {
  matchId: string;
  status: string;
}) {
  const saved = [
    "saved",
    "page_generated",
    "published",
    "getting_traffic",
    "producing_clicks",
    "producing_commissions",
  ].includes(status);
  return (
    <button
      type="button"
      className="border border-copper px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
      onClick={() =>
        void setMatchStatus(matchId, saved ? "researching" : "saved")
      }
    >
      {saved ? "Saved" : "Save opportunity"}
    </button>
  );
}

export function BuildPainGraphButton({ matchId }: { matchId: string }) {
  const [href, setHref] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-paper hover:border-copper hover:text-copper disabled:opacity-60"
        onClick={async () => {
          setPending(true);
          setError("");
          const result = await buildPainGraph(matchId);
          setPending(false);
          if (result.error) {
            setError(result.error);
            return;
          }
          setHref(result.href ?? "");
        }}
      >
        {pending ? "Building…" : "Build this PainGraph"}
      </button>
      {href ? (
        <a
          href={href}
          className="mt-2 block text-xs text-copper hover:text-copper-2"
        >
          Draft ready · {href} (not published)
        </a>
      ) : null}
      {error ? <p className="mt-1 text-xs text-signal">{error}</p> : null}
    </div>
  );
}

export function PublishMatchButton({
  matchId,
  href,
}: {
  matchId: string;
  href?: string | null;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-paper disabled:opacity-60"
      onClick={async () => {
        setPending(true);
        const result = await publishMatch(matchId);
        setPending(false);
        if (result.href) window.location.href = result.href;
      }}
    >
      {pending ? "Publishing…" : href?.startsWith("/test/") ? "Publish draft" : "Mark published"}
    </button>
  );
}

export function MatchPerformanceForm({
  matchId,
  visitors,
  quizCompleted,
  affiliateClicks,
  sales,
  commissionPence,
}: {
  matchId: string;
  visitors: number;
  quizCompleted: number;
  affiliateClicks: number;
  sales: number;
  commissionPence: number;
}) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const num = (name: string) => Number(form.get(name) || 0);
    const result = await recordMatchPerformance({
      matchId,
      visitors: num("visitors"),
      quizCompleted: num("quizCompleted"),
      affiliateClicks: num("affiliateClicks"),
      sales: num("sales"),
      commissionPounds: num("commission"),
    });
    setPending(false);
    setStatus(
      result.error ||
        `Revenue per visitor £${result.rpv?.toFixed(2)}. ${result.note}`,
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-2 sm:grid-cols-5">
      {(
        [
          ["visitors", "Visitors", visitors],
          ["quizCompleted", "Quizzes done", quizCompleted],
          ["affiliateClicks", "Affiliate clicks", affiliateClicks],
          ["sales", "Sales", sales],
          ["commission", "Commission £", commissionPence / 100],
        ] as const
      ).map(([name, label, value]) => (
        <label key={name} className="text-[11px] uppercase tracking-[0.12em] text-muted">
          {label}
          <input
            name={name}
            type="number"
            min={0}
            step={name === "commission" ? "0.01" : "1"}
            defaultValue={value}
            className="mt-1 h-9 w-full border border-line bg-ink px-2 text-sm text-paper outline-none"
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="h-9 border border-copper px-3 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink disabled:opacity-60 sm:col-span-5"
      >
        {pending ? "Saving…" : "Save performance"}
      </button>
      {status ? <p className="text-xs text-signal sm:col-span-5">{status}</p> : null}
    </form>
  );
}
